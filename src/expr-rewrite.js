const _ = require('lodash');
const {flattenExpression, searchExpressions, searchExpressionsWithoutInnerFunctions, getAllFunctions, flattenExpressionWithoutInnerFunctions} = require('./expr-search');
const {memoizeExprFunc, memoize} = require('./memoize');
const {exprHash, hashString} = require('./expr-hash');
const {TokenTypeData, Expression, Get, Expr, TopLevel, Token, Invoke, FuncArg, Func} = require('./lang');
const {generateName, generateNameFromTag} = require('./expr-names');
const objectHash = require('object-hash');

const countTokens = memoizeExprFunc(expr => _.sum(expr.map(countTokens)), () => 1)

function tryToHoist(expr) {
    return TokenTypeData[expr[0].$type].tryToHoist;
}

const isStaticExpression = memoize(expr => {
    const res = true;
    const areChildrenStatic = expr.map(token => {
        if (token instanceof Expression) {
            return isStaticExpression(token);
        } else if (token.$type === 'val' || token.$type === 'key' || token.$type === 'context') {
            return false;
        }
        return true;
    });
    return _.every(areChildrenStatic, (isChildStatic, index) => isChildStatic || expr[index] instanceof Expression && expr[index][0].$type === 'func');
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
            namesByExpr[s] = `$${e[0].$type}${generateName(namesByExpr, e)}${nodeIndex++}`;
        }
    });
    const rewriteUsingTopLevels = getRewriteUsingTopLevels(namesByExpr);
    const newGetters = {};
    _.forEach(namesByExpr, (name, hash) => {
        newGetters[name] = allStaticAsStrings[hash].map(rewriteUsingTopLevels);
    });
    _.forEach(getters, (expr, name) => {
        if (!newGetters[name]) {
            newGetters[name] = Expr(Get, namesByExpr[exprHash(expr)], TopLevel);
        }
    })
    return newGetters;
}

function rewriteLocalsToFunctions(getters) {
    const exprs = flattenExpression(...Object.values(getters));
    // console.log(exprs.length)

    const parentMap = new Map();
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
    const countIdenticals = {};
    exprs.forEach(e => {
        const parents = parentMap.get(e);
        // console.log(parents && parents.length);
        if (e instanceof Expression && e[0].$type !== 'func' && parents && parents.length > 1) {
            const hash = exprHash(e);
            const children = flattenExpressionWithoutInnerFunctions(e);
            // console.log(parents && parents.length, children.length);
            countIdenticals[hash] = {counter: parents.length, children}
        }
    });

    const newGetters = {};
    const namesByHash = {};
    const localTokens = {
        val: true,
        key: true,
        context: true,
        loop: true
    }

    const rewriteExpr = memoizeExprFunc(e => { 
            const hash = exprHash(e);
            const found = countIdenticals[hash];
            if (found && found.counter > 2 && found.children.length > 4) {
                const name = namesByHash[hash] ? namesByHash[hash] : `$$${generateNameFromTag(e)}${hash}`;
                if (!namesByHash[name]) {
                    const tokens = _(found.children)
                        .flatten()
                        .filter(t => t instanceof Token && localTokens[t.$type])
                        .map(t => t.$type)
                        .uniq()
                        .map(t => new Token(t))
                        .value()
                    found.tokens = tokens;
                    namesByHash[hash] = name;
                    newGetters[name] = Expr(Func, Expr(...e.map(rewriteExpr)), ...found.tokens);
                }
                return Expr(Invoke, name, ...found.tokens.map(t => new Token(t.$type)));
            } 
            return Expr(...e.map(rewriteExpr));
        },
        (t) => t)
    

    Object.assign(newGetters, _.mapValues(getters, rewriteExpr))
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
    rewriteLocalsToFunctions,
    rewriteStaticsToTopLevels,
    rewriteUniqueByHash
}