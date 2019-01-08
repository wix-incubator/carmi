const _ = require('lodash');
const { flattenExpression, searchExpressions, searchExpressionsWithoutInnerFunctions, getAllFunctions, flattenExpressionWithoutInnerFunctions } = require('./expr-search');
const { memoizeExprFunc, memoize } = require('./memoize');
const {exprHash, hashString} = require('./expr-hash');
const { TokenTypeData, Expression, Get, Expr, TopLevel, Token, Invoke, FuncArg, Func } = require('./lang');
const { generateName, generateNameFromTag } = require('./expr-names');
const objectHash = require('object-hash');

const countTokens = memoizeExprFunc(expr => {
    return _.sum(expr.map(countTokens))
}, () => 1)

function tryToHoist(expr) {
    return TokenTypeData[expr[0].$type].tryToHoist;
}

const isStaticExpression = memoize(expr => {
    let res = true;
    const areChildrenStatic = expr.map(token => {
        if (token instanceof Expression) {
            return isStaticExpression(token);
        } else if (token.$type === 'val' || token.$type === 'key' || token.$type === 'context') {
            return false;
        }
        return true;
    });
    return _.every(areChildrenStatic, (isChildStatic, index) => {
        return isChildStatic || (expr[index] instanceof Expression && expr[index][0].$type === 'func');
    });
});

const getRewriteUsingTopLevels = namesByExpr => {
    const rewriteUsingTopLevels = memoizeExprFunc(
        expr => {
            const str = exprHash(expr);
            if (namesByExpr[str]) {
                return Expr(Get, namesByExpr[str], TopLevel);
            }
            return expr.map(child => rewriteUsingTopLevels(child));
        },
        token => token
    );
    return rewriteUsingTopLevels;
};


function rewriteStaticsToTopLevels(getters) {
    const allExpressions = flattenExpression(...Object.values(getters));
    const allStaticExpressions = _.filter(allExpressions, isStaticExpression);
    const allStaticAsStrings = allStaticExpressions.reduce((acc, e) => {
        acc[exprHash(e)] = e;
        return acc;
    }, {});
    const namesByExpr = _(getters)
        .mapValues(e => exprHash(e))
        .invert()
        .value();
    let nodeIndex = 1;
    _.forEach(allStaticAsStrings, (e, s) => {
        if (!namesByExpr[s] && tryToHoist(e)) {
            namesByExpr[s] = '$' + e[0].$type + generateName(namesByExpr, e) + nodeIndex++;
        }
    });
    const rewriteUsingTopLevels = getRewriteUsingTopLevels(namesByExpr);
    const newGetters = {};
    _.forEach(namesByExpr, (name, hash) => {
        newGetters[name] = allStaticAsStrings[hash].map(rewriteUsingTopLevels);
    });
    return newGetters;
}

function rewriteLocalsToLet(getters) {
    const exprs = flattenExpression(...Object.values(getters));
    exprs.reverse();
    const parentMap = new Map();
    const stringsByExpr = new Map();
    searchExpressions(expr => {
        if (expr[0].$type !== 'func') {
            expr.forEach(child => {
                if (child instanceof Expression) {
                    if (!parentMap.has(child)) {
                        parentMap.set(child, []);
                    }
                    parentMap.get(child).push(expr);
                }
            })
        }
    }, Object.values(getters))
    function addStringToExpr(str, exprs) {
        while (exprs.length) {
            const expr = exprs.shift();
            if (!stringsByExpr.has(expr)) {
                stringsByExpr.set(expr, new Set())
            }
            stringsByExpr.get(expr).add(str);
            const parents = parentMap.get(expr);
            if (parents) {
                parents.forEach(p => exprs.push(p))
            }
        }
    }
    exprs.forEach(e => {
            e.filter(t => typeof t === 'string')
                .forEach(str => addStringToExpr(str, [e]))
    })
    const exprsGroupedByHash = {};
    const noHashTypes = {
        get:true,
        func: true,
        array: true,
        object: true
    }
    const hashByExpr = new Map();
    function hashExprWithStrings(expr, strings) {
        if (noHashTypes[expr[0].$type]) {
            return;
        }
        strings = strings || new Set();
        const stringsToIndexes = Array.from(strings.values()).reduce((acc, str, index) => ({...acc,[str]: index}), {})
        const localHashExpr = memoizeExprFunc(e => {
            if (e[0].$type === 'func' || e[0].$type === 'get' && e[2] instanceof Token && e[2].$type === 'topLevel') {
                return exprHash(e);
            } else {
                return objectHash(e.map(val => localHashExpr(val)).join(','));
            }
        }, t => stringsToIndexes.hasOwnProperty(t) ? stringsToIndexes[t] : t)
        const stringAgnosticHash = localHashExpr(expr)
        hashByExpr.set(expr, stringAgnosticHash);
        exprsGroupedByHash[stringAgnosticHash] = exprsGroupedByHash[stringAgnosticHash] || [];
        exprsGroupedByHash[stringAgnosticHash].push(expr);
    }
    exprs.forEach(e => 
        hashExprWithStrings(e, stringsByExpr.get(e))
    )
    // console.log('hashed chains', JSON.stringify(exprsGroupedByHash, null, 2));

    Object.keys(exprsGroupedByHash).forEach(h => {
        const exprsByHash = exprsGroupedByHash[h];
        const parents = _(exprsByHash.map(e => parentMap.get(e))).flatten().compact().uniq().value()
        // console.log(parents);
        const parentsHashes = parents.map(p => hashByExpr.get(p))
        const parentsLengths = parentsHashes.map(ph => exprsGroupedByHash[ph] ? exprsGroupedByHash[ph].length : 0)
        const parentsAllSameLength = parentsLengths.every(len => len ===  exprsByHash.length)
        const areAllExpressionsStatics = exprsByHash.every(isStaticExpression);
        const areAllParentsStatics = parents.every(isStaticExpression);
        const allStringsSets = exprsGroupedByHash[h].map(e => stringsByExpr.get(e) || new Set());
        const allStrings = _.flatten(allStringsSets.map(s => Array.from(s.values())))
        const allPossibleStrings = _.groupBy(allStrings);
        const constStrings = Object.keys(allPossibleStrings).filter(str => allPossibleStrings[str].length === exprsGroupedByHash[h].length)
 
        if (exprsByHash.length === 1 || 
            parentsAllSameLength || 
            (areAllExpressionsStatics !== areAllParentsStatics) 
            || allStringsSets[0].size > constStrings + 8) {
            delete exprsGroupedByHash[h];
            return;
        } else {
            exprsGroupedByHash[h].forEach(e => {
                const stringsIncludingConst = stringsByExpr.get(e);
                if (stringsIncludingConst && constStrings.length) {
                    constStrings.forEach(str => stringsIncludingConst.delete(str))
                }
            })
        }
    });

    // console.log('delete chains', JSON.stringify(exprsGroupedByHash, null, 2));


    // Object.keys(exprsGroupedByHash).forEach(h => {
    //     const allStringsSets = exprsGroupedByHash[h].map(e => stringsByExpr.get(e) || new Set());
    //     const allStrings = _.flatten(allStringsSets.map(s => Array.from(s.values())))
    //     const allPossibleStrings = _.groupBy(allStrings);
    //     const constStrings = Object.keys(allPossibleStrings).filter(str => allPossibleStrings[str].length === exprsGroupedByHash[h].length)
    //     // console.log({constStrings, allPossibleStrings})
    //     exprsGroupedByHash[h].forEach(e => {
            
    //     })
    // });

    // console.log('removed const strings', JSON.stringify(_.mapValues(exprsGroupedByHash, 
    //     exprs => {
    //         console.log(JSON.stringify(exprs));
    //         return exprs.map(e => {
    //             console.log('inner', JSON.stringify(e), stringsByExpr.get(e));
    //             return Array.from(stringsByExpr.get(e).values())
    //         })
    //     }
    // ), null, 2));
    let nodeIndex = 0;

    exprs.reverse();
    const newGetters = {}

    const expressionsWithStringsMapping = new Map();
    let rewriteExprTokens = null;

    
    const rewriteExpr = memoizeExprFunc(e => {
        const hash = hashByExpr.get(e);
        const isStatic = isStaticExpression(e);
        const hoistable = isStatic && tryToHoist(e);
        if (exprsGroupedByHash[hash]) {
            const name = '$' + generateNameFromTag(e) + nodeIndex++;
            const sampleExpr = exprsGroupedByHash[hash][0];
            const nonConstStrings = Array.from((stringsByExpr.get(e) || new Set()).values());
            const helperName = '$$' + generateNameFromTag(sampleExpr) + hash;
            // console.log('found group',exprsGroupedByHash[hash].length, hash, name);

            if (!newGetters[helperName]) {
                flattenExpressionWithoutInnerFunctions(e).forEach(scopedChild => {
                    expressionsWithStringsMapping.set(scopedChild, nonConstStrings);
                })
                newGetters[helperName] = Expr(Func, rewriteExprTokens(e));
            }
            if (hoistable) {
                newGetters[name] = Expr(Invoke, helperName, ...nonConstStrings)
                return Expr(Get, name, TopLevel);
            } else {
                return Expr(Invoke, helperName, ...nonConstStrings);
            }
        } else if (hoistable) {
            const name = '$' + generateNameFromTag(e) + nodeIndex++;
            newGetters[name] = rewriteExprTokens(e);
            return Expr(Get, name, TopLevel);
        } else {
            return rewriteExprTokens(e)
        }
    }, t => t)

    rewriteExprTokens = memoizeExprFunc(e => {
        return e.map(t => {
            if (typeof t === 'string') {
                const strs = expressionsWithStringsMapping.get(e) || [];
                const idx = strs.indexOf(t);
                return idx === -1 ? t : new Token('arg'+idx);
            } else {
                return rewriteExpr(t)
            }
        }, t => t)
    })

    Object.assign(newGetters, _.mapValues(getters, rewriteExpr));

    // return getters;
    return newGetters;
}

function rewriteUniqueByHash(getters) {
    const exprs = flattenExpression(Object.values(getters));
    const allHashes = {};
    exprs.forEach(e => {
        const hash = exprHash(e);
        allHashes[hash] = allHashes[hash] || [];
        allHashes[hash].push(e)
    })
    const canonical = {};
    function getCanoncial(expr) {
        if (expr instanceof Expression) {
            const hash = exprHash(expr);
            if (!canonical.hasOwnProperty(hash)) {
                canonical[hash] = Expr(...expr.map(getCanoncial));
            }
            return canonical[hash];
        }
        return expr;
    }
    const newGetters = _.mapValues(getters, getCanoncial)
    return newGetters;
}

module.exports = {
    rewriteLocalsToLet,
    rewriteStaticsToTopLevels,
    rewriteUniqueByHash
}