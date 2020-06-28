const carmi = require('./index')
const path = require('path')
const fs = require('fs-extra')
const {isUpToDate, getDependenciesHashes, analyzeDependencies} = require('./src/analyze-dependencies')
const getCacheFilePath = require('./src/get-cache-file-path')
const wrapModule = require('./src/wrap-module')
const base64ArrayBuffer = require('./bytecode/base64-arraybuffer')
const {CACHE_SCENARIOS} = require('./src/cache-scenarios')
const {defaults} = require('lodash')

require('@babel/register')({
	rootMode: 'upward',
	extensions: ['.ts', '.js'],
	ignore: [/node_modules/],
	envName: 'carmi'
})

module.exports = function processCarmi(options) {
	options = defaults(options, {
		compiler: 'optimizing',
		debug: false,
		'type-check': false,
		format: 'iife',
		name: 'model',
		prettier: false,
		'no-cache': false,
		'cache-scenario': CACHE_SCENARIOS.mtime,
		'no-coverage': false,
		ast: false
	})

	const statsFilePath = getCacheFilePath({
		path: options.source
	})

	const dependencies = analyzeDependencies(options.source, statsFilePath)
	const encoding = options.compiler === 'bytecode' ? null : 'utf-8'

	const dependenciesHashes =
		options['cache-scenario'] === CACHE_SCENARIOS.gitHash ? getDependenciesHashes(dependencies) : null

	const cacheFilePath = getCacheFilePath({
		path: options.source,
		debug: options.debug,
		format: options.format,
		prettier: options.prettier,
		dependenciesHashes,
		name: options.name
	})

	fs.outputJSONSync(statsFilePath, dependencies)

	let code

	// We are using fallback to mtime check if scenario is `git-hash`, but getting hashes was resulted in error.
	const upToDate = Boolean(dependenciesHashes) || isUpToDate(dependencies, cacheFilePath)
	const useCache = !options['no-cache'] && fs.existsSync(cacheFilePath) && upToDate

  if (useCache) {
		// return from cache
		code = fs.readFileSync(cacheFilePath, encoding)
	} else {
		// run carmi and generate cache
		let model

		try {
			model = require(options.source)
		} catch (e) {
			console.error(`failed to require ${options.source} ${e.stack}`)
			throw e
		}

		code = carmi.compile(model, options)
	}

	if (options['no-coverage'] && typeof code === 'string') {
		code = `/* istanbul ignore file */
  ${code}`
	}

	if (!options['no-cache']) {
		fs.outputFileSync(cacheFilePath, code, encoding)
  }

	if (typeof code !== 'string' && options.format !== 'binary') {
		code = wrapModule(
			options.format,
			`require('carmi/bytecode/carmi-instance')('${base64ArrayBuffer.encode(code)}')`,
			name
		)
	}

  if (options['no-coverage'] && typeof code === 'string') {
		code = `/* istanbul ignore file */
  ${code}`
	}

  return {code, dependencies};
}
