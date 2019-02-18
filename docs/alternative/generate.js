require('babel-register')
const fs = require('fs')
const path = require('path')


const { main, home } = require('./templates')



fs.writeFileSync(
	path.resolve(__dirname, '../../website/pages/api.html'),
	main({
		title: 'Carmi API',
		children: home({ data: require('../../website/static/carmi.json') })
	})
)
