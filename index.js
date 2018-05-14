const { TokenTypeData, Expr, Token, Setter, Expression, Splice } = require('./src/lang');
const NaiveCompiler = require('./src/naive-compiler');
const OptimzingCompiler = require('./src/optimizing-compiler');
const prettier = require('prettier');

const unwrapableProxies = require('./src/unwrapable-proxy');
const proxyHandler = {};
const { wrap, unwrap } = unwrapableProxies(proxyHandler);

function convertArrayAndObjectsToExpr(v) {
  if (v.constructor === Object) {
    return createExpr(
      new Token('object'),
      ...Object.keys(v).reduce((acc, key) => {
        acc.push(key);
        acc.push(v[key]);
        return acc;
      }, [])
    );
  } else if (v.constructor === Array) {
    return createExpr(new Token('array'), ...v);
  } else {
    return v;
  }
}

function createExpr(...args) {
  return Expr.apply(null, args.map(convertArrayAndObjectsToExpr));
}

proxyHandler.get = (target, key) => {
  const tokenData = TokenTypeData[key];
  if (
    !tokenData &&
    typeof key === 'string' &&
    key !== '$type' &&
    key !== 'length' &&
    key !== 'inspect' &&
    Number.isNaN(parseInt(key, 10))
  ) {
    throw new Error(`unknown token: ${key}, ${JSON.stringify(target)}`);
  }
  if (!tokenData || tokenData.nonVerb || tokenData.nonChained) {
    // console.log(target, key);
    return Reflect.get(target, key);
  }
  return (...args) => {
    // console.log(key, args);
    args = [new Token(key), ...args];
    if (tokenData.chainIndex) {
      if (tokenData.collectionVerb && tokenData.chainIndex === 2) {
        if (typeof args[1] === 'function') {
          args[1] = args[1].apply(null, ['val', 'key', 'context', 'loop'].map(t => wrap(new Token(t))));
        } else if (typeof args[1] === 'string') {
          args[1] = createExpr(new Token('get'), args[1], new Token('val'));
        }
        args[1] = createExpr(new Token('func'), args[1]);
      }
      args.splice(tokenData.chainIndex, 0, target);
    }
    return wrap(createExpr(...args));
  };
};

proxyHandler.apply = (target, thisArg, args) => {
  if (target instanceof Token) {
    wrap(createExpr(new Token(target.$type), ...args));
  } else {
    throw `${String(target)} not a function`;
  }
};

function compile(model, naive, name) {
  const Compiler = naive ? NaiveCompiler : OptimzingCompiler;
  const compiler = new Compiler(unwrap(model));
  const source = prettier.format(compiler.compile());
  require('fs').writeFileSync('./tmp.js', `module.exports = ${source}`);

  return `(function () {
    'use strict';
    return ${source}
  })()`;
}

function currentValues(inst) {
  if (typeof inst !== 'object') {
    return inst;
  }
  if (Array.isArray(inst)) {
    return inst.map(currentValues);
  }
  return Object.keys(inst)
    .sort()
    .filter(k => typeof inst[k] !== 'function' && k.indexOf('$') !== 0)
    .reduce((acc, k) => {
      acc[k] = currentValues(inst[k]);
      return acc;
    }, {});
}

const exported = { currentValues, compile, Setter, Expression, Splice };
Object.keys(TokenTypeData).forEach(t => {
  if (TokenTypeData[t].private) {
    return; // privates aren't exported - only used in optimizing code or internally
  }
  if (TokenTypeData[t].nonVerb) {
    exported[t] = wrap(new Token(t));
  } else if (TokenTypeData[t].nonChained) {
    exported[t] = (...args) => wrap(createExpr(new Token(t), ...args));
  }
});

module.exports = exported;
