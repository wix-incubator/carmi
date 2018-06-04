const { Expr, Token, Setter, Expression, SetterExpression, SpliceSetterExpression, TokenTypeData } = require('./lang');
const _ = require('lodash');
const NaiveCompiler = require('./naive-compiler');
const { splitSettersGetters, normalizeAndTagAllGetters } = require('./expr-tagging');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const FlowCompiler = require('./flow-compiler');
const { extractAllTypeDeclerations } = require('./rust-types');

class RustCompiler extends NaiveCompiler {
  constructor(model, options) {
    const { getters, setters } = splitSettersGetters(model);
    super({ ...model, ...normalizeAndTagAllGetters(getters, setters) }, options);
  }

  buildDerived(name) {
    return `$${name}Build();`;
  }

  get template() {
    return require('./templates/rust-simple.js');
  }

  async generateAnnotations() {
    const annotationsFile = path.join(__dirname, '..', 'cache', `${this.hash()}.json`);
    console.log(annotationsFile);
    try {
      const annotations = await readFile(annotationsFile);
      this.annotations = JSON.parse(annotations.toString());
      console.log('annotations: found in cache');
    } catch (e) {
      const flowCompiler = new FlowCompiler(Object.assign({}, this.getters, this.setters), this.options);
      await flowCompiler.compile();
      this.annotations = flowCompiler.annotations;
      await writeFile(annotationsFile, JSON.stringify(this.annotations));
      console.log('annotations: not found in cache, generated new');
    }
    return this.annotations;
  }

  async compile() {
    await this.generateAnnotations();
    console.log(extractAllTypeDeclerations(this.annotations));
    return super.compile();
  }

  get lang() {
    return 'rust';
  }
}

module.exports = RustCompiler;
