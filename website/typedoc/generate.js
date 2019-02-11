const fs = require('fs')
const path = require('path')

const _ = require('lodash')

const { getJSON } = require('./interpret')

_(process.argv[2] || path.resolve(__dirname, '../../typings/index.d.ts'))
	.thru(source => getJSON(source))
	.thru(object => JSON.stringify(object, false, 2))
	.thru(res => [path.resolve(__dirname, '../static/carmi.json'), res])
	.tap((val) => fs.writeFileSync(...val))
	.commit()
