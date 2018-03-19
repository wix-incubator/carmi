const { AllTokensList, Expr, Token, Setter, Expression } = require('./src/lang');
const NaiveCompiler = require('./src/naive-compiler');
const OptimzingCompiler = require('./src/optimizing-compiler');
const prettier = require('prettier');

function compile(model, naive, name) {
  const Compiler = naive ? NaiveCompiler : OptimzingCompiler;
  const compiler = new Compiler(model);
  const source = prettier.format(compiler.compile());
  require('fs').writeFileSync('./tmp.js', source);

  return `(function () {
    'use strict';
    return ${source}
  })()`;
}

function currentValues(inst) {
  return Object.keys(inst)
    .sort()
    .filter(k => typeof inst[k] !== 'function' && k.indexOf('$') !== 0)
    .reduce((acc, k) => {
      acc[k] = inst[k];
      return acc;
    }, {});
}

const exported = { currentValues, compile, Setter, Expression };

Object.keys(AllTokensList).forEach(t => {
  if (t === 'topLevel') {
    return; // topLevel not exported
  }
  if (AllTokensList[t]) {
    exported[t] = (...args) => Expr.apply(null, [new Token(t), ...args]);
  } else {
    exported[t] = new Token(t);
  }
});

module.exports = exported;
