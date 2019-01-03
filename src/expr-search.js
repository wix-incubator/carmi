const { isExpression } = require('./lang');
const _ = require('lodash');

function searchExpressions(callback, ...expressions) {
    const nextExpr = expressions;
    const visited = new Set();
    expressions.forEach(e => visited.add(e))
    while (nextExpr.length) {
        const currentExpr = nextExpr.shift();
        callback(currentExpr);
        currentExpr.forEach(subExpression => {
            if (isExpression(subExpression) && !visited.has(subExpression)) {
                nextExpr.push(subExpression);
                visited.add(subExpression)
            }
        });
    }
}


function searchExpressionsWithoutInnerFunctions(callback, ...expressions) {
    const nextExpr = expressions;
    const visited = new Set();
    expressions.forEach(e => visited.add(e))
    while (nextExpr.length) {
        const currentExpr = nextExpr.shift();
        callback(currentExpr);
        currentExpr.forEach(subExpression => {
            if (isExpression(subExpression) && !visited.has(subExpression) && subExpression[0].$type !== 'func') {
                nextExpr.push(subExpression);
                visited.add(subExpression)
            }
        });
    }
}

function flattenExpression(...expressions) {
    const output = [];
    searchExpressions((expr) => output.push(expr), ...expressions);
    return output;
}


function getAllFunctions(sourceExpr) {
    const allExpressions = flattenExpression(sourceExpr);
    const exprByFunc = _.groupBy(allExpressions, expr => expr[0].$funcId);
    return _.map(exprByFunc, expressions => expressions[0]);
}

module.exports = { searchExpressions, searchExpressionsWithoutInnerFunctions, flattenExpression, getAllFunctions };