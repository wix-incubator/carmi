// Usage: `require('carmi/loader!./file.carmi')`
// or just setup as a default loader for `.carmi.js$` files

'use strict';

const path = require('path')
const execa = require('execa')
const dargs = require('dargs')
const tempy = require('tempy')

module.exports = function CarmiLoader() {
  const statsPath = tempy.file({extension: 'js'})

  const options = {
    source: this.getDependencies()[0],
    stats: statsPath,
    format: 'esm',
  }

  const {stdout: compiled} = execa.sync('npx', ['carmi', ...dargs(options)]);

  require(statsPath).forEach(filePath => {
    this.addDependency(filePath)
  });

  return compiled;
};
