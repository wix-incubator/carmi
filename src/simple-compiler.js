const { Expr, Token, Setter, Expression, SetterExpression, SpliceSetterExpression, TokenTypeData } = require('./lang');
const _ = require('lodash');
const NaiveCompiler = require('./naive-compiler');
const {
  tagExprWithPaths,
  findReferencesToPathInAllGetters,
  splitSettersGetters,
  pathMatches,
  pathFragmentToString,
  normalizeAndTagAllGetters,
  allPathsInGetter
} = require('./expr-tagging');

class SimpleCompiler extends NaiveCompiler {
  constructor(model, options) {
    const { getters, setters } = splitSettersGetters(model);
    super({ ...model, ...normalizeAndTagAllGetters(getters, setters) }, options);
  }

  buildDerived(name) {
    return `$${name}Build();`;
  }

  get template() {
    return require('./templates/simple.js');
  }
}

module.exports = SimpleCompiler;
