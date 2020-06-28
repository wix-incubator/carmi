// Usage: `require('carmi/loader!./file.carmi')`
// or just setup as a default loader for `.carmi.js$` files

'use strict'

const loaderUtils = require('loader-utils')
const processCarmi = require('./api')

module.exports = function CarmiLoader() {
	const callback = this.async()
	// const statsPath = tempy.file({extension: 'json'})
	// const tempOutputPath = tempy.file({extension: 'js'})
	const loaderOptions = loaderUtils.getOptions(this) || {}

	const options = {
		source: this.getDependencies()[0],
		// stats: statsPath,
		format: 'cjs',
		// output: tempOutputPath,
		...loaderOptions
	}

	try {
		const {code, dependencies} = processCarmi(options)

		Object.keys(require(dependencies)).forEach((filePath) => {
			// Add those modules as loader dependencies
			// See https://webpack.js.org/contribute/writing-a-loader/#loader-dependencies
			this.addDependency(filePath)
		})

		callback(null, code)
	} catch (error) {
		callback(error)
	}
}
