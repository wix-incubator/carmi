const { isExpression } = require('./lang');

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

module.exports = { searchExpressions, searchExpressionsWithoutInnerFunctions };