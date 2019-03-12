const _ = require('lodash')
const typedoc = require('typedoc')

const INTERFACE = 256
const METHOD = 2048

const getJSON = (src) =>
	_.chain(new typedoc.Application({
		exclude: '**/node_modules/**',
		ignoreCompilerErrors: true,
		includeDeclarations: true
	}))
	.thru((app) => app
		.convert([src])
		.toObject()
	)
	//.tap((v) => require('fs').writeFileSync('./full.json', JSON.stringify(v, false, 4)))
	.get('children[0].children')
	.filter(({comment}) => comment)
	//.tap((v) => require('fs').writeFileSync('./tmp.json', JSON.stringify(v, false, 4)))
	.value()

module.exports = { getJSON }//: () => require('./tmp.json') }
