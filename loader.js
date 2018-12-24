// Usage: `require('carmi/loader!./file.carmi')`
// or just setup as a default loader for `.carmi.js$` files

'use strict';

const {compile} = require('carmi');
const esm = require('esm');

module.exports = function CarmiLoader() {
  const callback = this.async();
  const srcPath = this.getDependencies()[0];
  const requiredPreCarmi = new Set(Object.keys(require.cache));
  const loader = esm(module);
  compile(loader(srcPath), {compiler: 'optimizing', format: 'cjs'})
    .then(compiledCode => {
      Object.keys(require.cache).forEach(key => {
        if (!requiredPreCarmi.has(key)) {
          // Clear user loaded modules from require.cache
          delete require.cache[key];

          // Add those modules as loader dependencies
          // See https://webpack.js.org/contribute/writing-a-loader/#loader-dependencies
          this.addDependency(key);
        }
      });
      callback(null, compiledCode);
    })
    .catch(err => callback(err));
};
