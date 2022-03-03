'use strict'

const path = require('path');
const fs = require('fs');
const {exprHash, clearHashStrings} = require('./expr-hash');
const prettier = require('prettier');
const {unwrap} = require('./unwrapable-proxy');
const wrapModule = require('./wrap-module');

const compilerTypes = {};
compilerTypes.naive = require('./naive-compiler');
compilerTypes.simple = require('./simple-compiler');
compilerTypes.optimizing = require('./optimizing-compiler');
compilerTypes.bytecode = require('./bytecode-compiler');

module.exports = (model, options) => {
  clearHashStrings();
  if (typeof options === 'boolean' || typeof options === 'undefined') {
    options = {compiler: options ? 'naive' : 'optimizing'};
  }
  options.name = options.name || 'instance';
  if (options.compiler === 'carmi') {
    options.compiler = 'optimizing';
  }

  const onlyAST = options.ast && !options.debug

  model = unwrap(model);
  const hashFile =
    options.cache &&
    !onlyAST &&
    path.resolve(process.cwd(), options.cache, exprHash({model, options}));
  if (options.cache) {
    try {
      const result = fs
        .readFileSync(hashFile)
        .toString();
      return result;
    } catch (e) { } //eslint-disable-line no-empty
  }
  const Compiler = compilerTypes[options.compiler];
  const compiler = new Compiler(model, options);
  if (onlyAST) {
    return JSON.stringify(compiler.getters, null, 2);
  }
  const rawSource = compiler.compile();
  const imports = compiler.importLibrary();
  let source = rawSource;
  if (options.prettier && typeof source === 'string') {
    try {
      source = prettier.format(rawSource, {parser: 'babel'});
    } catch (e) { } //eslint-disable-line no-empty
  }
  let result;

  if (compiler.lang === 'js' && typeof source === 'string') {
    result = wrapModule(options.format, source, options.name, imports);
  } else {
    result = source;
  }
  if (hashFile) {
    fs.writeFileSync(hashFile, result);
  }
  return result;
}
