function createLibrary({ensurePath, applySetter, getAssignableObject}) {
  function mapValues(func, src, context) {
    return Object.keys(src).reduce((acc, key) => {
      acc[key] = func(src[key], key, context);
      return acc;
    }, {});
  }

  function filterBy(func, src, context) {
    return Object.keys(src).reduce((acc, key) => {
      if (func(src[key], key, context)) {
        acc[key] = src[key];
      }
      return acc;
    }, {});
  }

  function groupBy(func, src, context) {
    if (Array.isArray(src)) {
      throw new Error('groupBy only works on objects');
    }
    return Object.keys(src).reduce((acc, key) => {
      const newKey = func(src[key], key, context);
      acc[newKey] = acc[newKey] || {};
      acc[newKey][key] = src[key];
      return acc;
    }, {});
  }

  function mapKeys(func, src, context) {
    return Object.keys(src).reduce((acc, key) => {
      const newKey = func(src[key], key, context);
      acc[newKey] = src[key];
      return acc;
    }, {});
  }

  function map(func, src, context) {
    return src.map((val, key) => func(val, key, context));
  }

  function any(func, src, context) {
    return src.some((val, key) => func(val, key, context));
  }

  function filter(func, src, context) {
    return src.filter((val, key) => func(val, key, context));
  }

  function anyValues(func, src, context) {
    return Object.keys(src).some(key => func(src[key], key, context));
  }

  function keyBy(func, src, context) {
    return src.reduce((acc, val, key) => {
      acc[func(val, key, context)] = val;
      return acc;
    }, {});
  }

  function keys(src) {
    return Array.from(Object.keys(src));
  }

  function values(src) {
    return Array.isArray(src) ? src : Array.from(Object.values(src));
  }

  function assign(src) {
    return Object.assign({}, ...src);
  }

  function size(src) {
    return Array.isArray(src) ? src.length : Object.keys(src).length;
  }

  function isEmpty(src) {
    return Array.isArray(src) ? src.length === 0 : Object.keys(src).length === 0;
  }

  function last(src) {
    return src[src.length - 1];
  }

  function range(end, start = 0, step = 1) {
    const res = [];
    // eslint-disable-next-line no-unmodified-loop-condition
    for (let val = start; step > 0 && val < end || step < 0 && val > end; val += step) {
      res.push(val);
    }
    return res;
  }

  function defaults(src) {
    return Object.assign({}, ...[...src].reverse());
  }

  function loopFunction(resolved, res, func, src, context, key) {
    if (!resolved[key]) {
      resolved[key] = true;
      res[key] = func(src[key], key, context, loopFunction.bind(null, resolved, res, func, src, context));
    }
    return res[key];
  }

  function sum(src) {
    return src.reduce((sum, val) => sum + val, 0)
  }

  function flatten(src) {
    return [].concat(...src)
  }

  function recursiveMap(func, src, context) {
    const res = [];
    const resolved = src.map(x => false);
    src.forEach((val, key) => {
      loopFunction(resolved, res, func, src, context, key);
    });
    return res;
  }

  function recursiveMapValues(func, src, context) {
    const res = {};
    const resolved = {};
    Object.keys(src).forEach(key => resolved[key] = false);
    Object.keys(src).forEach(key => {
      loopFunction(resolved, res, func, src, context, key);
    });
    return res;
  }

  function set(path, value) {
    ensurePath(path)
    applySetter(getAssignableObject(path, path.length - 1), path[path.length - 1], value)
  }

  function splice(pathWithKey, len, ...newItems) {
    ensurePath(pathWithKey)
    const key = pathWithKey[pathWithKey.length - 1]
    const path = pathWithKey.slice(0, pathWithKey.length - 1)
    const arr = getAssignableObject(path, path.length)
    arr.splice(key, len, ...newItems)
  }

  return {
    mapValues,
    filterBy,
    groupBy,
    mapKeys,
    map,
    any,
    filter,
    anyValues,
    keyBy,
    keys,
    values,
    assign,
    size,
    isEmpty,
    last,
    range,
    defaults,
    loopFunction,
    sum,
    flatten,
    recursiveMap,
    recursiveMapValues,
    set,
    splice,
  }
}

module.exports = {createLibrary};
