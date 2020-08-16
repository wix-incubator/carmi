'use strict'

const {TokenTypeData} = require('./lang');
const {chain, or, and} = require('./frontend');

function getIn(obj, path) {
  const pathGetters = [obj].concat(path.map((_part, index) => path.slice(0, index + 1).reduce((acc, part) => acc.get(part), obj)))
  return and(...pathGetters);
}

function has(obj, key) {
  return obj.get(key).isUndefined().not()
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
  return chain([a, b]).flatten()
}

function uniq(arr) {
  return arr
    .keyBy(x => x)
    .keys()
}

function intersection(a, b) {
  const array = a.uniq().concat(b.uniq())

  return array
    .keyBy((_, idx) => idx)
    .groupBy(val => val)
    .filterBy(val => val.keys().size().gt(1))
    .keys()
}

function find(collection, predicate, givenCtx) {
  return collection.values().filter((val, key, ctx) => predicate(val, key, ctx), givenCtx || null).get(0)
}

function join(arr, separator) {
  return reduce(arr, (acc, value, index) => index.eq(0).ternary(acc.plus(value), acc.plus(separator).plus(value)), '')
}

function append(arr, value) {
  return chain([arr, [value]]).flatten()
  //return arr.size().plus(1).range().map(v => v.lt(arr.size()).ternary(arr.get(v), value))
}

function simpleSet(base, key, value) {
  return chain([base, {[key]: value}]).assign()
}

function setIn(obj, path, value) {
  if (!Array.isArray(path) || path.length === 0) {
    throw new Error('only set with array paths');
  }
  path.forEach(val => {
    if (typeof val !== 'string') {
      throw new Error('all path parts in set should be strings');
    }
  })


  const currentValues = path.map((part, index) =>
    or(getIn(obj, path.slice(0, index)), chain({}))
  )

  return path.reduceRight((acc, part, index) => simpleSet(currentValues[index], part, acc), value)
}

function head(array) {
  return array.get(0)
}

function reverse(array) {
  return array.map((item, index, scopedArray) => scopedArray.get(scopedArray.size().minus(index.plus(1))), array)
}

function includesValue(collection, val) {
  if (typeof val === 'boolean' || typeof val === 'number' || typeof val === 'string') {
    return collection.anyValues((item, key, ctx) => item.eq(val))
  }
  return collection.anyValues((item, key, ctx) => item.eq(ctx), val)
}

function includes(collection, val) {
  if (typeof val === 'boolean' || typeof val === 'number' || typeof val === 'string') {
    return collection.any((item, key, ctx) => item.eq(val))
  }
  return collection.any((item, key, ctx) => item.eq(ctx), val)
}

function findIndex(collection, predicate) {
  const filtered = collection.map((item, index) => predicate(item, index).ternary(index, chain(-1))).filter(item => item.gt(-1));
  return filtered.size().ternary(
    filtered.get(0),
    -1
  );
}

function pick(obj, arr) {
  const projection = Object.assign({}, ...arr.map(key => ({[key]: obj.get(key)})));
  return chain(projection).filterBy(item => item.isUndefined().not());
}

function every(array, predicate) {
  return array.any((val, key, context) => predicate(val, key, context).not()).not()
}

function compact(array) {
  return array.filter(value => value)
}

function switchCase(obj, caseTuples, defaultCase) {
  return (caseTuples || []).reduce(
    (result, caseTuple) => obj.eq(caseTuple[0]).ternary(
      caseTuple[1],
      result
    ),
    typeof defaultCase === 'undefined' ? chain(null) : chain(defaultCase)
  )
}

function conditionalTrace(obj, condition) {
  return condition.ternary(
    obj.trace(),
    obj
  )
}

function conditionalBreakpoint(obj, condition) {
  return condition.ternary(
    obj.breakpoint(),
    obj
  )
}

function tapTrace(obj, tapFn) {
  return or(tapFn(obj).trace().ternary(chain(false), chain(false)), obj)
}

const sugarApi = {
  getIn,
  includes,
  assignIn,
  reduce,
  uniq,
  intersection,
  concat,
  find,
  join,
  append,
  setIn,
  pick,
  findIndex,
  includesValue,
  has,
  reverse,
  head,
  every,
  simpleSet,
  compact,
  switch: switchCase,
  conditionalTrace,
  conditionalBreakpoint,
  tapTrace
};

Object.keys(sugarApi).forEach(key => {
  if (TokenTypeData[key]) {
    throw new Error(`There is a builtin token with this sugar name ${key}`);
  }
});

module.exports = sugarApi;
