/* eslint-disable arrow-body-style */

const {createUtils} = require('./utils')

const createLibrary = (model) => {
  const {
    ensurePath,
    getAssignableObject,
    applySetter
  } = createUtils(model)

  const mapValues = (func, src, context) => {
    return Object.keys(src).reduce((acc, key) => {
      acc[key] = func(src[key], key, context);
      return acc;
    }, {});
  }

  const filterBy = (func, src, context) => {
    return Object.keys(src).reduce((acc, key) => {
      if (func(src[key], key, context)) {
        acc[key] = src[key];
      }
      return acc;
    }, {});
  }

  const groupBy = (func, src, context) => {
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

  const mapKeys = (func, src, context) => {
    return Object.keys(src).reduce((acc, key) => {
      const newKey = func(src[key], key, context);
      acc[newKey] = src[key];
      return acc;
    }, {});
  }

  const map = (func, src, context) => {
    return src.map((val, key) => func(val, key, context));
  }

  const any = (func, src, context) => {
    return src.some((val, key) => func(val, key, context));
  }

  const filter = (func, src, context) => {
    return src.filter((val, key) => func(val, key, context));
  }

  const anyValues = (func, src, context) => {
    return Object.keys(src).some(key => func(src[key], key, context));
  }

  const keyBy = (func, src, context) => {
    return src.reduce((acc, val, key) => {
      acc[func(val, key, context)] = val;
      return acc;
    }, {});
  }

  const keys = (src) => {
    return Array.from(Object.keys(src));
  }

  const values = (src) => {
    return Array.isArray(src) ? src : Array.from(Object.values(src));
  }

  const assign = (src) => {
    return Object.assign({}, ...src);
  }

  const size = (src) => {
    return Array.isArray(src) ? src.length : Object.keys(src).length;
  }

  const isEmpty = (src) => {
    return Array.isArray(src) ? src.length === 0 : Object.keys(src).length === 0;
  }

  const last = (src) => {
    return src[src.length - 1];
  }

  const range = (end, start = 0, step = 1) => {
    const res = [];
    // eslint-disable-next-line no-unmodified-loop-condition
    for (let val = start; step > 0 && val < end || step < 0 && val > end; val += step) {
      res.push(val);
    }
    return res;
  }

  const defaults = (src) => {
    return Object.assign({}, ...[...src].reverse());
  }

  const loopFunction = (resolved, res, func, src, context, key) => {
    if (!resolved[key]) {
      resolved[key] = true;
      res[key] = src.hasOwnProperty(key) ? func(src[key], key, context, loopFunction.bind(null, resolved, res, func, src, context)) : undefined;
    }
    return res[key];
  }

  const sum = (src) => {
    return src.reduce((sum, val) => sum + val, 0)
  }

  const flatten = (src) => {
    return [].concat(...src)
  }

  const recursiveMap = (func, src, context) => {
    const res = [];
    const resolved = src.map(x => false);
    src.forEach((val, key) => {
      loopFunction(resolved, res, func, src, context, key);
    });
    return res;
  }

  const recursiveMapValues = (func, src, context) => {
    const res = {};
    const resolved = {};
    Object.keys(src).forEach(key => resolved[key] = false);
    Object.keys(src).forEach(key => {
      loopFunction(resolved, res, func, src, context, key);
    });
    return res;
  }

  const set = (path, value) => {
    ensurePath(path)
    applySetter(getAssignableObject(path, path.length - 1), path[path.length - 1], value)
  }

  const splice = (pathWithKey, len, ...newItems) => {
    ensurePath(pathWithKey)
    const key = pathWithKey[pathWithKey.length - 1]
    const path = pathWithKey.slice(0, pathWithKey.length - 1)
    const arr = getAssignableObject(path, path.length)
    arr.splice(key, len, ...newItems)
  }

  const push = (path, value) => {
    ensurePath([...path, 0])
    const arr = getAssignableObject(path, path.length)
    splice([...path, arr.length], 0, value)
  }


  return {
    any,
    anyValues,
    assign,
    defaults,
    filter,
    filterBy,
    flatten,
    groupBy,
    isEmpty,
    keyBy,
    keys,
    last,
    loopFunction,
    map,
    mapKeys,
    mapValues,
    push,
    range,
    recursiveMap,
    recursiveMapValues,
    set,
    size,
    splice,
    sum,
    values
  }
}

module.exports = {createLibrary};
