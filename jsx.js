const {chain} = require('./index');

function createElement(...args) {
  return chain([...args]).call('createElement');
}

module.exports = {createElement};
