const _ = require('lodash');

function getIn(obj, path) {
    return _.reduce(path, (acc, val) => {
      return acc.ternary(acc.get(val), acc)
    }, obj);
}

function includes(collection, val) {
  return collection.anyValues(item => item.eq(val));
}

function head(array) {
    return array.get(0)
}

function last(array) {
    return array.get(array.size().minus(1))
}

function reverse(array) {
    return array.map((item, index) => array.get(array.size().minus(index.plus(1))))
}

module.exports = { getIn, includes, head, last, reverse };
