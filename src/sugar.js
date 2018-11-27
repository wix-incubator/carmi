const _ = require('lodash');

function getIn(obj, path) {
    return _.reduce(path, (acc, val) => {
      return acc.ternary(acc.get(val), acc)
    }, obj);
}

function includes(collection, val) {
  return collection.anyValues(item => item.eq(val));
}

module.exports = { getIn, includes };
