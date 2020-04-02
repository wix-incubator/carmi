// Usage: `require('carmi/loader!./file.carmi')`
// or just setup as a default loader for `.carmi.js$` files

'use strict';

const execa = require('execa')
const dargs = require('dargs')
const tempy = require('tempy')
const {readFileSync} = require('fs')
const loaderUtils = require('loader-utils')

module.exports = function CarmiLoader() {
  const callback = this.async()
  const statsPath = tempy.file({extension: 'json'})
  const tempOutputPath = tempy.file({extension: 'js'})
  const loaderOptions = loaderUtils.getOptions(this) || {}

  const options = {
    source: this.getDependencies()[0],
    stats: statsPath,
    format: 'cjs',
    output: tempOutputPath,
    ...loaderOptions
  }

  let compiled;

  execa('node', [require.resolve('./bin/carmi'), ...dargs(options)])
    .then(() => {
      compiled = readFileSync(tempOutputPath, 'utf8')
    })
    .finally(() => {
      Object.keys(require(statsPath)).forEach(filePath => {
        // Add those modules as loader dependencies
        // See https://webpack.js.org/contribute/writing-a-loader/#loader-dependencies
        this.addDependency(filePath)
      });
    })
    .then(() => {
      callback(null, compiled)
    })
};
