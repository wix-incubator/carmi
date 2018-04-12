const { TokenTypeData, Expr, Token, Setter, Expression } = require('./src/lang');
const NaiveCompiler = require('./src/naive-compiler');
const OptimzingCompiler = require('./src/optimizing-compiler');
const prettier = require('prettier');

const unwrapableProxies = require('./src/unwrapable-proxy');
const proxyHandler = {};
const { wrap, unwrap } = unwrapableProxies(proxyHandler);

proxyHandler.get = (target, key) => {
  const tokenData = TokenTypeData[key];
  if (!tokenData || tokenData.nonVerb || tokenData.nonChained) {
    return Reflect.get(target, key);
  }
  return (...args) => {
    args = [new Token(key), ...args];
    if (tokenData.chainIndex) {
      if (tokenData.collectionVerb) {
        args[1] = Expr.apply(null, [new Token('func'), args[1]]);
      }
      args.splice(tokenData.chainIndex, 0, target);
    }
    return wrap(Expr.apply(null, args));
  };
};

proxyHandler.apply = (target, thisArg, args) => {
  if (target instanceof Token) {
    wrap(Expr.apply(null, [new Token(target.$type), ...args]));
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
  return Object.keys(inst)
    .sort()
    .filter(k => typeof inst[k] !== 'function' && k.indexOf('$') !== 0)
    .reduce((acc, k) => {
      acc[k] = currentValues(inst[k]);
      return acc;
    }, {});
}

const exported = { currentValues, compile, Setter, Expression };
Object.keys(TokenTypeData).forEach(t => {
  if (TokenTypeData[t].private) {
    return; // privates aren't exported - only used in optimizing code or internally
  }
  if (TokenTypeData[t].nonVerb) {
    exported[t] = wrap(new Token(t));
  } else if (TokenTypeData[t].nonChained) {
    exported[t] = (...args) => wrap(Expr.apply(null, [new Token(t), ...args]));
  }
});

module.exports = exported;
