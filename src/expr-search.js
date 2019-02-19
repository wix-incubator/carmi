const {isExpression, isToken} = require('./lang');
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

function flattenExpressionWithoutInnerFunctions(...expr) {
    const output = [];
    searchExpressionsWithoutInnerFunctions((expr) => output.push(expr), ...expr);
    return output;
}


function getAllFunctions(expr) {
    const output = [expr];
    searchExpressions((e) => {
        if (e[0].$type === 'func') {
            output.push(e)
        }
    }, [expr]);
    return output;
}

function processByExecutionOrder(callback, context, recurIntoFunctions, expr) {
    if (!isExpression(expr)) {
        return context;
    }
    // console.log(expr[0])
    context = callback(expr[0], context);
    if (expr[0].$type === 'ternary') {
        const newContext = callback(expr[1], context);
        processByExecutionOrder(callback, callback(expr[2], newContext), recurIntoFunctions, expr[2])
        processByExecutionOrder(callback, callback(expr[3], newContext), recurIntoFunctions, expr[3])
    } else {
        expr.slice(1).map(t => {
                if (isToken(t)) {
                    context = callback(t, context);
                } else if (isExpression(t)) {
                    if (expr[0].$type === 'func' && !recurIntoFunctions) {
                        return;
                    }
                    context = processByExecutionOrder(callback, callback(expr[2], context), recurIntoFunctions, t)
                }
        })
    }
    return context;
}



module.exports = { 
    searchExpressions,
    searchExpressionsWithoutInnerFunctions,
    flattenExpression,
    flattenExpressionWithoutInnerFunctions,
    getAllFunctions,
    processByExecutionOrder
};