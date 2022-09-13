// dummy variables for templates that will be replaced or added in the generated code
var $DEBUG_MODE, $EXPR, $EXPR1, $SETTERS, $AST, applySetter;

function base() {
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

  function applySetter(object, key, value) {
    if (typeof value === 'undefined') {
      delete object[key]
    } else {
      object[key] = value;
    }
  }

  /* LIBRARY */

  /* ALL_EXPRESSIONS */
  class CarmiModel {
    constructor($model, $funcLibRaw, $batchingStrategy) {
      this.$model = $model
      this.$batchingStrategy = $batchingStrategy
      this.$listeners = new Set();
      this.$inBatch = false;
      this.$batchPending = [];
      this.$inRecalculate = false;
      this.$res = { $model }
      this.$setters = {$SETTERS}

      if ($funcLibRaw) {
        // bind all methods to the instance and the setters to the instance
        this.$funcLib = Object.entries($funcLibRaw).reduce((agg, [key, value]) => {
          agg[key] = value.bind({...this, ...this.$setters})
          return agg
        }, {})

        if ($DEBUG_MODE) {
          this.$funcLib = new Proxy(this.$funcLib, {
            get: (target, functionName) => {
              if (target[functionName]) {
                return target[functionName]
              }

              throw new TypeError(`Trying to call undefined function: ${String(functionName)} `)
            }
          })
        }
      }

    }

    getAssignableObject(path, index) {
      return path.slice(0, index).reduce((agg, p) => agg[p], this.$model)
    }

    ensurePath(path) {
      if (path.length < 2) {
        return
      }

      if (path.length > 2) {
        this.ensurePath(path.slice(0, path.length - 1))
      }

      const lastObjectKey = path[path.length - 2]

      const assignable = this.getAssignableObject(path, path.length - 2)
      if (assignable[lastObjectKey]) {
        return
      }
      const lastType = typeof path[path.length - 1]
      assignable[lastObjectKey] = lastType === 'number' ? [] : {}
    }

    recalculate() {
      if (this.$inBatch) {
        return
      }
      this.$inRecalculate = true
      /* DERIVED */
      /* RESET */
      this.$inRecalculate = false
      if (this.$batchPending.length) {
        this.$endBatch()
      } else {
        this.$listeners.forEach(callback => callback())
      }
    }
    $startBatch() {
      this.$inBatch = true
    }
    $endBatch() {
      if (this.$inRecalculate) {
        throw new Error('Can not end batch in the middle of a batch')
      }
      this.$inBatch = false
      if (this.$batchPending.length) {
        this.$batchPending.forEach(({ func, args }) => {
          func.apply(this.$res, args)
        })
        this.$batchPending = []
        this.recalculate()
      }
    }
    $setter(func, ...args) {
      if (this.$inBatch || this.$inRecalculate || this.$batchingStrategy) {
        this.$batchPending.push({ func, args })
        if ((!this.$inBatch && !this.$inRecalculate) && this.$batchingStrategy) {
          this.$inBatch = true
          this.$batchingStrategy.call(this)
        }
      } else {
        func.apply(this, args)
        this.recalculate()
      }
    }
    $runInBatch(func) {
      if (this.$inRecalculate) {
        func()
      } else {
        this.$startBatch()
        func()
        this.$endBatch()
      }
    }
    $addListener(func) {
      this.$listeners.add(func)
    }
    $removeListener(func) {
      this.$listeners.delete(func)
    }
    $setBatchingStrategy(func) {
      this.$batchingStrategy = func
    }


  }

  function $NAME($model, $funcLibRaw, $batchingStrategy) {
    const instance = new CarmiModel($model, $funcLibRaw, $batchingStrategy);
    instance.recalculate()

    const publicInstance = Object.assign(
      instance.$res,
      instance.$setters,
      {
        $startBatch: instance.$startBatch.bind(instance),
        $endBatch: instance.$endBatch.bind(instance),
        $addListener: instance.$addListener.bind(instance),
        $removeListener: instance.$removeListener.bind(instance),
        $setBatchingStrategy: instance.$setBatchingStrategy.bind(instance),
        $runInBatch: instance.$runInBatch.bind(instance),
      }
    );

    if ($DEBUG_MODE) {
      Object.assign(publicInstance, {
        $ast: () => { return $AST },
        $source: () => null
      })
    }

    return publicInstance
  }

  module.exports = $NAME
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

  function isEmpty(src) {
    return Array.isArray(src) ? src.length === 0 : Object.keys(src).length === 0;
  }

  function last(src) {
    return src[src.length - 1];
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
      res[key] = src.hasOwnProperty(key) ? func(src[key], key, context, loopFunction.bind(this, resolved, res, func, src, context)) : undefined;
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
      loopFunction.call(this, resolved, res, func, src, context, key);
    });
    return res;
  }

  function recursiveMapValues(func, src, context) {
    const res = {};
    const resolved = {};
    Object.keys(src).forEach(key => (resolved[key] = false));
    Object.keys(src).forEach(key => {
      loopFunction.call(this, resolved, res, func, src, context, key);
    });
    return res;
  }

  function set(path, value) {
    this.ensurePath(path)
    applySetter(this.getAssignableObject(path, path.length - 1), path[path.length - 1], value)
  }

  function splice(pathWithKey, len, ...newItems) {
    this.ensurePath(pathWithKey)
    const key = pathWithKey[pathWithKey.length - 1]
    const path = pathWithKey.slice(0, pathWithKey.length - 1)
    const arr = this.getAssignableObject(path, path.length)
    arr.splice(key, len, ...newItems)
  }

  function push(path, value) {
    this.ensurePath([...path, 0])
    const arr = this.getAssignableObject(path, path.length)
    splice.call(this, [...path, arr.length], 0, value)
  }

}

module.exports = { base, library, func, topLevel, helperFunc, recursiveMapValues, recursiveMap };
