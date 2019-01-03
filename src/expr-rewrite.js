const _ = require('lodash');
const { flattenExpression } = require('./expr-search');
const { memoizeExprFunc, memoize } = require('./memoize');
const exprHash = require('./expr-hash');
const { TokenTypeData, Expression, Get, Expr, TopLevel } = require('./lang');
const { generateName, generateNameFromTag } = require('./expr-names');

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


module.exports = {
    rewriteStaticsToTopLevels
}