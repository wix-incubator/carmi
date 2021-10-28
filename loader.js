// Usage: `require('carmi/loader!./file.carmi')`
// or just setup as a default loader for `.carmi.js$` files

'use strict'

const execa = require('execa')
const dargs = require('dargs')
const tempy = require('tempy')
const fs = require('fs-extra')
const loaderUtils = require('loader-utils')
const getCacheFilePath = require('./src/get-cache-file-path')
const queue = []

async function addToQueue() {
	const item = {promise: null, resolve: null}
	queue.push(item)
	item.promise = new Promise((resolve) => {
		item.resolve = resolve
	})
	if (queue.length > 1) {
		await queue[queue.length - 2].promise
	}
}

function finish() {
	const item = queue.shift()
	item.resolve()
}

async function CarmiLoader(loader) {
	const callback = loader.async()
	const tempOutputPath = tempy.file({extension: 'js'})
	const loaderOptions = loaderUtils.getOptions(loader) || {}

	const options = {
		source: loader.getDependencies()[0],
		format: 'cjs',
		output: tempOutputPath,
		debug: process.env.NODE_ENV !== 'production',
		...loaderOptions
	}

    options.stats = getCacheFilePath({
       fileType: 'stats',
       path: options.source,
       debug: options.debug,
       format: options.format,
       name: 'model'
    });

	await addToQueue()

	let compiled
	let err = null

	try {
		await execa('node', [require.resolve('./bin/carmi'), ...dargs(options, {ignoreFalse: true})])
		compiled = fs.readFileSync(tempOutputPath, 'utf8')
	} catch (e) {
		err = e || new Error(`Error compiling ${options.source}`)
	} finally {
		fs.readJSONSync(options.stats).forEach((filePath) => {
			// Add those modules as loader dependencies
			// See https://webpack.js.org/contribute/writing-a-loader/#loader-dependencies
			loader.addDependency(filePath)
		})
	}
	finish()
	callback(err, compiled)
}

module.exports = function CarmiLoaderPublic() {
	CarmiLoader(this)
}
