
const _ = require('lodash');
const OldNaiveCompiler = require('./naive-function-compiler');
const {
  splitSettersGetters,
  normalizeAndTagAllGetters
} = require('./expr-tagging');

// This is the old implementation of the simple compiler, which is still used for the optimizing compiler
class OldSimpleCompiler extends OldNaiveCompiler {
  constructor(model, options) {
    const {getters, setters} = splitSettersGetters(model);
    super({...model, ...normalizeAndTagAllGetters(getters, setters, options)}, options);
  }

  buildDerived(name) {
    return `$res.${name} = ${this.generateExpr(this.getters[name])};`;
  }

  topLevelToIndex(str) {
    return this.getters[str][0].$topLevelIndex;
  }

  get template() {
    return require('./templates/simple.js');
  }
}

module.exports = OldSimpleCompiler;
