'use strict'

const path = require('path');
const fs = require('fs');
const {exprHash, clearHashStrings} = require('./expr-hash');
const prettier = require('prettier');
const {unwrap} = require('./unwrapable-proxy');

const compilerTypes = {};
compilerTypes.naive = require('./naive-compiler');
compilerTypes.simple = require('./simple-compiler');
compilerTypes.optimizing = require('./optimizing-compiler');
compilerTypes.bytecode = require('./bytecode-compiler');
try {
  compilerTypes.flow = require('./flow-compiler');
  compilerTypes.rust = require('./rust-compiler');
} catch (e) { } //eslint-disable-line no-empty

module.exports = (model, options) => {
  clearHashStrings();
  if (typeof options === 'boolean' || typeof options === 'undefined') {
    options = {compiler: options ? 'naive' : 'optimizing'};
  }
  options.name = options.name || 'instance';
  if (options.compiler === 'carmi') {
    options.compiler = 'optimizing';
  }

  model = unwrap(model);
  const hashFile =
    options.cache &&
    !options.ast &&
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
  if (options.ast) {
    return JSON.stringify(compiler.getters, null, 2);
  }
  const rawSource = compiler.compile();
  let source = rawSource;
  if (options.prettier && typeof source === 'string') {
    try {
      source = prettier.format(rawSource, {parser: 'babel'});
    } catch (e) { } //eslint-disable-line no-empty
  }
  let result;

  if (compiler.lang === 'js' && typeof source === 'string') {
    switch (options.format) {
      case 'iife':
        result = `var ${options.name} = (function () {
          return ${source}
        }())`;
        break;
      case 'cjs':
        result = `module.exports = ${source}`;
        break;
      case 'esm':
        result = `export default ${source}`;
        break;
      case 'umd':
        result = `
          (function (global, factory) {
            typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
            typeof define === 'function' && define.amd ? define(factory) :
            (global.${options.name} = factory());
          }(this, (function () {
            return ${source}
          })))
        `;
        break;
      case 'amd':
        result = `
          define(function () {
            return ${source}
          });
        `;
        break;
      default:
        result = `(function () {
          'use strict';
          return ${source}
        })()`;
        break;
    }
  } else {
    result = source;
  }
  if (hashFile) {
    fs.writeFileSync(hashFile, result);
  }
  return result;
}
