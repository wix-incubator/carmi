// Usage: `require('carmi/loader!./file.carmi')`
// or just setup as a default loader for `.carmi.js$` files

'use strict';

const _ = require('lodash');
const { compile } = require('carmi');

const clearAllModulesLoadedForCarmi = requiredPreCarmi => {
  Object.keys(require.cache).forEach(key => {
    if (!requiredPreCarmi.has(key)) {
      delete require.cache[key];
    }
  });
};

module.exports = function CarmiLoader() {
  this.cacheable(false);
  const callback = this.async();
  const srcPath = this.getDependencies()[0];
  const requiredPreCarmi = new Set(Object.keys(require.cache));
  compile(require(srcPath), { compiler: 'optimizing', format: 'cjs' })
    .then(compiledCode => {
      clearAllModulesLoadedForCarmi(requiredPreCarmi);
      callback(null, compiledCode);
    })
    .catch(err => callback(err));
};
