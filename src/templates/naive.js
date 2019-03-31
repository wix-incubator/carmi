function base() {
  function $NAME($model, $funcLibRaw, $batchingStrategy) {
    let $funcLib = $funcLibRaw

    if ($DEBUG_MODE) {
    $funcLib = (!$funcLibRaw || typeof Proxy === 'undefined') ? $funcLibRaw : new Proxy($funcLibRaw, {
      get: (target, functionName) => {
        if (target[functionName]) {
          return target[functionName]
        }

        throw new TypeError(`Trying to call undefined function: ${functionName} `)
    }})
  }

  function mathFunction(name, source) {
    return arg => {
      const type = typeof arg
      if (type !== 'number') {
        throw new TypeError(`Trying to call ${JSON.stringify(arg)}.${name}. Expects number, received ${type} at ${source}`)
      }

      return Math[name](arg)
    }
  }

  function checkTypes(input, name, types, functionName, source) {
    function checkType(type) {
      const isArray = Array.isArray(input)
      return type == 'array' && isArray || (type === typeof input && !isArray)
    }

    if (types.some(checkType)) {
      return
    }

    const asString = typeof input === 'object' ? JSON.stringify(input) : input

    throw new TypeError(`${functionName} expects ${types.join('/')}. ${name} at ${source}: ${asString}.${functionName}`)
  }

  const $res = { $model };
    const $listeners = new Set();
    /* LIBRARY */
    /* ALL_EXPRESSIONS */
    let $inBatch = false;
    let $batchPending = [];
    let $inRecalculate = false;

    function recalculate() {
      if ($inBatch) {
        return;
      }
      $inRecalculate = true;
      /* DERIVED */
      /* RESET */
      $listeners.forEach(callback => callback());
      $inRecalculate = false;
      if ($batchPending.length) {
        $res.$endBatch();
      }
    }

    function ensurePath(path) {
      if (path.length < 2) {
        return
      }

      if (path.length > 2) {
        ensurePath(path.slice(0, path.length - 1))
      }

      const lastObjectKey = path[path.length - 2]

      const assignable = getAssignableObject(path, path.length - 2)
      if (assignable[lastObjectKey]) {
        return
      }
      const lastType = typeof path[path.length - 1]
      assignable[lastObjectKey] = lastType === 'number' ? [] : {}
    }

    function getAssignableObject(path, index) {
      return path.slice(0, index).reduce((agg, p) => agg[p], $model)
    }

    function push(path, value) {
      ensurePath([...path, 0])
      const arr = getAssignableObject(path, path.length)
      splice([...path, arr.length], 0, value)
    }

    function applySetter(object, key, value) {
      if (typeof value === 'undefined') {
        delete object[key]
      } else {
        object[key] = value;
      }
    }

    function $setter(func, ...args) {
      if ($inBatch || $inRecalculate || $batchingStrategy) {
        $batchPending.push({ func, args });
        if ((!$inBatch && !$inRecalculate) && $batchingStrategy) {
          $inBatch = true;
          $batchingStrategy.call($res);
        }
      } else {
        func.apply($res, args);
        recalculate();
      }
    }

    Object.assign(
      $res,
      {$SETTERS},
      {
        $startBatch: () => {
          $inBatch = true;
        },
        $endBatch: () => {
          $inBatch = false;
          if ($batchPending.length) {
            $batchPending.forEach(({ func, args }) => {
              func.apply($res, args);
            });
            $batchPending = [];
            recalculate();
          }
        },
        $runInBatch: func => {
          $res.$startBatch();
          func();
          $res.$endBatch();
        },
        $addListener: func => {
          $listeners.add(func);
        },
        $removeListener: func => {
          $listeners.delete(func);
        },
        $setBatchingStrategy: func => {
          $batchingStrategy = func;
        }
      }
    );

    if ($DEBUG_MODE) {
      Object.assign($res, {
        $ast: () => { return $AST },
        $source: () => null
      })
    }
    recalculate();
    return $res;
  }
}

function func() {
  function $FUNCNAME(val, key, context) {
      return $EXPR1;
  }
}

function topLevel() {
  function $$FUNCNAME() {
    return $EXPR;
  }
}

function recursiveMap() {
  function $FUNCNAME(val, key, context, loop) {
      return $EXPR1;
  }
}

function helperFunc() {
  function $ROOTNAME($FN_ARGS) {
    return $EXPR1;
  }
}

function recursiveMapValues() {
  function $FUNCNAME(val, key, context, loop) {
    return $EXPR1;
  }
}

function library() {
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

  function range(end, start = 0, step = 1) {
    const res = [];
    for (let val = start; (step > 0 && val < end) || (step < 0 && val > end); val += step) {
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
    Object.keys(src).forEach(key => (resolved[key] = false));
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
}

module.exports = { base, library, func, topLevel, helperFunc, recursiveMapValues, recursiveMap };
