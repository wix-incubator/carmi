const { TokensRequireExpressions, Expr, Token, Setter, Expression } = require('./src/lang');
const NaiveCompiler = require('./src/naive-compiler');
const OptimzingCompiler = require('./src/optimizing-compiler');
const prettier = require('prettier');

function compile(model, naive, name) {
  const Compiler = naive ? NaiveCompiler : OptimzingCompiler;
  const compiler = new Compiler(model);
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
const privateTokens = {
  wildcard: true,
  topLevel: true
};
Object.keys(TokensRequireExpressions).forEach(t => {
  if (privateTokens[t]) {
    return; // privates aren't exported - only used in optimizing code
  }
  if (TokensRequireExpressions[t]) {
    exported[t] = (...args) => Expr.apply(null, [new Token(t), ...args]);
  } else {
    exported[t] = new Token(t);
  }
});

module.exports = exported;
