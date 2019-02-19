const {Expression} = require('./lang');

const memoize = func => {
  const cache = new WeakMap();
  return arg => {
    if (!cache.has(arg)) {
      cache.set(arg, func(arg));
    }
    return cache.get(arg);
  };
};

const maybeMemoize = (testFunc, objFunc, primitiveFunc) => {
  let funcOnObj; //eslint-disable-line prefer-const
  const funcOnMaybeObj = token => {
    if (testFunc(token)) {
      return funcOnObj(token);
    } 
      return primitiveFunc(token);
  };
  funcOnObj = memoize(token => objFunc(token));
  return funcOnMaybeObj;
};

const memoizeExprFunc = (exprFunc, nonExprFunc) => maybeMemoize(t => t instanceof Expression, exprFunc, nonExprFunc);

const memoizeNonPrimitives = (objFunc, primitiveFunc) => maybeMemoize(t => t && t === Object(t), objFunc, primitiveFunc);

module.exports = {
  memoizeNonPrimitives,
  maybeMemoize,
  memoizeExprFunc,
  memoize
};
