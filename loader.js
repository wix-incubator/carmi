// Usage: `require('carmi/loader!./file.carmi')`
// or just setup as a default loader for `.carmi.js$` files

'use strict';

const {compile} = require('carmi');

module.exports = function CarmiLoader(content) {
  const requiredPreCarmi = new Set(Object.keys(require.cache));
  const compiledCode = compile(content, {compiler: 'optimizing', format: 'esm'});

  Object.keys(require.cache).forEach(key => {
    if (!requiredPreCarmi.has(key)) {
      // Clear user loaded modules from require.cache
      delete require.cache[key];

      // Add those modules as loader dependencies
      // See https://webpack.js.org/contribute/writing-a-loader/#loader-dependencies
      this.addDependency(key);
    }
  });

    return compiledCode;
};
