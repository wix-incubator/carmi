const _ = require('lodash');

module.exports = function(chain) {
    function getIn(obj, path) {
        return _.reduce(path, (acc, val) => {
            return acc.ternary(acc.get(val), acc)
        }, obj);
    }

    function includes(collection, val) {
        return collection.anyValues(item => item.eq(val));
    }

    function assignIn(obj, args) {
        return chain([
            obj,
            ...args
        ]).assign();
    }

    function reduce(collection, predicate, initialValue) {
        return collection.size().eq(0).ternary(
            initialValue,
            collection.recursiveMap((loop, value, index) => 
                predicate(index.eq(0).ternary(
                    initialValue, index.minus(1).recur(loop)), value, index))
                .get(collection.size().minus(1)))
    }

    function concat(a, b) {
        return a.size().plus(b.size()).range().map(v => v.lt(a.size()).ternary(a.get(v), b.get(v.minus(a.size()))))
    }

    function find(collection, predicate, ctx) {
      return collection.values().filter((val, key) => predicate(val, key, ctx)).get(0)
    }

    function join(arr, seperator) {
      return reduce(arr, (acc, value, index) => index.eq(0).ternary(acc.plus(value), acc.plus(seperator).plus(value)), '')
    }

    function sum(arr) {
        return reduce(arr, (acc, value) => acc.plus(value), 0)
    }

    function append(arr, value) {
      return concat(arr, chain([value]))
    }

    function associate(obj, path, value) {
      const simpleSet = (key, value) => assignIn(chain({}), [chain({placeholder: key}).mapKeys(() => key).mapValues(() => value)])

      if(_.isEmpty(path)) {
        return obj
      }

      const safePath = _.isString(path) ? _.split(path, '.') : path
      const transformedPath = _(safePath).transform((acc, key, index) => index === 0 ? acc.push([key]) :  acc.push(_.concat(acc[index - 1], [key])), []).reverse()

      const values = transformedPath.reduce((acc, innerPath, index) => {
        const originalValue = obj.getIn(innerPath).ternary(obj.getIn(innerPath), chain({}))
        acc.push(simpleSet(_.last(innerPath), index === 0 ? value : assignIn(originalValue, [acc[index - 1]])))

        return acc
      }, [])

      return assignIn(obj, [_.last(values)])
    }

    return { getIn, includes, assignIn, reduce, concat, find, join, sum, append, associate };
};

