require('babel-register')
const fs = require('fs')
const path = require('path')

const _ = require('lodash')

const { getJSON } = require('./interpret')

const { main, home } = require('./templates')

const source = process.argv[2] || 'typings/index.d.ts'

fs.writeFileSync(
	path.resolve(__dirname, '../../website/pages/en/api.html'),
	main({
		title: 'Carmi API',
		children: home({ data: getJSON(source) })
	})
)
