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

    return { getIn, includes, assignIn, reduce, concat };
};

