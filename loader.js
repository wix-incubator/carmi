// Usage: `require('carmi/loader!./file.carmi')`
// or just setup as a default loader for `.carmi.js$` files

'use strict';

const path = require('path')
const execa = require('execa')
const dargs = require('dargs')
const tempy = require('tempy')
const loaderUtils = require('loader-utils')

module.exports = function CarmiLoader() {
  const statsPath = tempy.file({extension: 'json'})
  const loaderOptions = loaderUtils.getOptions(this) || {};

  const options = {
    source: this.getDependencies()[0],
    stats: statsPath,
    format: 'cjs',
    ...loaderOptions
  }

  const {stdout: compiled} = execa.sync('npx', ['carmi', ...dargs(options)]);

  require(statsPath).forEach(filePath => {
    // Add those modules as loader dependencies
    // See https://webpack.js.org/contribute/writing-a-loader/#loader-dependencies
    this.addDependency(filePath)
  });

  return compiled;
};
