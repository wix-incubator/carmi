const {Expression} = require('./lang');

const memoize = (func) => {
    const cache = new WeakMap();
    return (arg) => {
        if (!cache.has(arg)) {
            cache.set(arg, func(arg));
        }
        return cache.get(arg);
    }
}

const memoizeExprFunc = (exprFunc, nonExprFunc) => {
    let funcOnMaybeExpr,funcOnExpr;
    funcOnMaybeExpr = (token) => {
        if (token instanceof Expression) {
            return funcOnExpr(token)
        } else {
            return nonExprFunc(token);
        }
    }
    funcOnExpr = memoize((token) => {
        return exprFunc(token);
    })
    return funcOnMaybeExpr;
}

module.exports = {
    memoizeExprFunc,
    memoize
}