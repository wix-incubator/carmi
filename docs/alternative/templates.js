const React = require('react')
const Chi = ({s, children}) => <i>{s}{children}</i>
module.exports = {
	main() {
		return <div><Chi s="thisis s">kids<img /></Chi></div>
	}
}
