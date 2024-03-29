const {Expr, Token, Setter, Expression, SetterExpression, SpliceSetterExpression, TokenTypeData} = require('./lang');
const _ = require('lodash');
const NaiveCompiler = require('./naive-compiler');
const {
  splitSettersGetters,
  normalizeAndTagAllGetters
} = require('./expr-tagging');

class SimpleCompiler extends NaiveCompiler {
  constructor(model, options) {
    const {getters, setters} = splitSettersGetters(model);
    super({...model, ...normalizeAndTagAllGetters(getters, setters, options)}, options);
  }

  buildDerived(name) {
    return `this.$res.${name} = ${this.generateExpr(this.getters[name])};`;
  }

  topLevelToIndex(str) {
    return this.getters[str][0].$topLevelIndex;
  }

  get template() {
    return require('./templates/simple.js');
  }
}

module.exports = SimpleCompiler;
