const _ = require('lodash');

function getIn(obj, ...path) {
    return _.reduce(path, (acc, val) => {
      return acc.ternary(acc.get(val), acc)
    }, obj);
}

module.exports = { getIn };
