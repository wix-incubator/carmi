function base() {
  function $NAME($model, $funcLibRaw, $batchingStrategy) {
    var $funcLib = $funcLibRaw;

    if ($DEBUG_MODE) {
      $funcLib = !$funcLibRaw || typeof Proxy === 'undefined' ? $funcLibRaw : new Proxy($funcLibRaw, {
        get: function get(target, functionName) {
          if (target[functionName]) {
            return target[functionName];
          }

          throw new TypeError("Trying to call undefined function: ".concat(functionName, " "));
        }
      });
    }

    function mathFunction(name, source) {
      return function (arg) {
        var type = babelHelpers.typeof(arg);

        if (type !== 'number') {
          throw new TypeError("Trying to call ".concat(JSON.stringify(arg), ".").concat(name, ". Expects number, received ").concat(type, " at ").concat(source));
        }

        return Math[name](arg);
      };
    }

    function checkTypes(input, name, types, functionName, source) {
      function checkType(type) {
        var isArray = Array.isArray(input);
        return type == 'array' && isArray || type === babelHelpers.typeof(input) && !isArray;
      }

      if (types.some(checkType)) {
        return;
      }

      var asString = babelHelpers.typeof(input) === 'object' ? JSON.stringify(input) : input;
      throw new TypeError("".concat(functionName, " expects ").concat(types.join('/'), ". ").concat(name, " at ").concat(source, ": ").concat(asString, ".").concat(functionName));
    }

    var $res = {
      $model
    };
    var $listeners = new Set();
    /* LIBRARY */

    /* ALL_EXPRESSIONS */

    var $inBatch = false;
    var $batchPending = [];
    var $inRecalculate = false;

    function recalculate() {
      if ($inBatch) {
        return;
      }

      $inRecalculate = true;
      /* DERIVED */

      /* RESET */

      $listeners.forEach(function (callback) {
        return callback();
      });
      $inRecalculate = false;

      if ($batchPending.length) {
        $res.$endBatch();
      }
    }

    function ensurePath(path) {
      if (path.length < 2) {
        return;
      }

      if (path.length > 2) {
        ensurePath(path.slice(0, path.length - 1));
      }

      var lastObjectKey = path[path.length - 2];
      var assignable = getAssignableObject(path, path.length - 2);

      if (assignable[lastObjectKey]) {
        return;
      }

      var lastType = babelHelpers.typeof(path[path.length - 1]);
      assignable[lastObjectKey] = lastType === 'number' ? [] : {};
    }

    function getAssignableObject(path, index) {
      return path.slice(0, index).reduce(function (agg, p) {
        return agg[p];
      }, $model);
    }

    function push(path, value) {
      ensurePath([].concat(babelHelpers.toConsumableArray(path), [0]));
      var arr = getAssignableObject(path, path.length);
      splice([].concat(babelHelpers.toConsumableArray(path), [arr.length]), 0, value);
    }

    function applySetter(object, key, value) {
      if (typeof value === 'undefined') {
        delete object[key];
      } else {
        object[key] = value;
      }
    }

    function $setter(func) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      if ($inBatch || $inRecalculate || $batchingStrategy) {
        $batchPending.push({
          func: func,
          args: args
        });

        if (!$inBatch && !$inRecalculate && $batchingStrategy) {
          $inBatch = true;
          $batchingStrategy.call($res);
        }
      } else {
        func.apply($res, args);
        recalculate();
      }
    }

    Object.assign($res, {
      $SETTERS
    }, {
      $startBatch: function $startBatch() {
        $inBatch = true;
      },
      $endBatch: function $endBatch() {
        $inBatch = false;

        if ($batchPending.length) {
          $batchPending.forEach(function (_ref) {
            var func = _ref.func,
                args = _ref.args;
            func.apply($res, args);
          });
          $batchPending = [];
          recalculate();
        }
      },
      $runInBatch: function $runInBatch(func) {
        $res.$startBatch();
        func();
        $res.$endBatch();
      },
      $addListener: function $addListener(func) {
        $listeners.add(func);
      },
      $removeListener: function $removeListener(func) {
        $listeners.delete(func);
      },
      $setBatchingStrategy: function $setBatchingStrategy(func) {
        $batchingStrategy = func;
      }
    });

    if ($DEBUG_MODE) {
      Object.assign($res, {
        $ast: function $ast() {
          return $AST;
        },
        $source: function $source() {
          return null;
        }
      });
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
    return Object.keys(src).reduce(function (acc, key) {
      acc[key] = func(src[key], key, context);
      return acc;
    }, {});
  }

  function filterBy(func, src, context) {
    return Object.keys(src).reduce(function (acc, key) {
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

    return Object.keys(src).reduce(function (acc, key) {
      var newKey = func(src[key], key, context);
      acc[newKey] = acc[newKey] || {};
      acc[newKey][key] = src[key];
      return acc;
    }, {});
  }

  function mapKeys(func, src, context) {
    return Object.keys(src).reduce(function (acc, key) {
      var newKey = func(src[key], key, context);
      acc[newKey] = src[key];
      return acc;
    }, {});
  }

  function map(func, src, context) {
    return src.map(function (val, key) {
      return func(val, key, context);
    });
  }

  function any(func, src, context) {
    return src.some(function (val, key) {
      return func(val, key, context);
    });
  }

  function filter(func, src, context) {
    return src.filter(function (val, key) {
      return func(val, key, context);
    });
  }

  function anyValues(func, src, context) {
    return Object.keys(src).some(function (key) {
      return func(src[key], key, context);
    });
  }

  function keyBy(func, src, context) {
    return src.reduce(function (acc, val, key) {
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
    return Object.assign.apply(Object, [{}].concat(babelHelpers.toConsumableArray(src)));
  }

  function size(src) {
    return Array.isArray(src) ? src.length : Object.keys(src).length;
  }

  function range(end) {
    var start = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var step = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
    var res = [];

    for (var val = start; step > 0 && val < end || step < 0 && val > end; val += step) {
      res.push(val);
    }

    return res;
  }

  function defaults(src) {
    return Object.assign.apply(Object, [{}].concat(babelHelpers.toConsumableArray(babelHelpers.toConsumableArray(src).reverse())));
  }

  function loopFunction(resolved, res, func, src, context, key) {
    if (!resolved[key]) {
      resolved[key] = true;
      res[key] = func(src[key], key, context, loopFunction.bind(null, resolved, res, func, src, context));
    }

    return res[key];
  }

  function sum(src) {
    return src.reduce(function (sum, val) {
      return sum + val;
    }, 0);
  }

  function flatten(src) {
    var _ref2;

    return (_ref2 = []).concat.apply(_ref2, babelHelpers.toConsumableArray(src));
  }

  function recursiveMap(func, src, context) {
    var res = [];
    var resolved = src.map(function (x) {
      return false;
    });
    src.forEach(function (val, key) {
      loopFunction(resolved, res, func, src, context, key);
    });
    return res;
  }

  function recursiveMapValues(func, src, context) {
    var res = {};
    var resolved = {};
    Object.keys(src).forEach(function (key) {
      return resolved[key] = false;
    });
    Object.keys(src).forEach(function (key) {
      loopFunction(resolved, res, func, src, context, key);
    });
    return res;
  }

  function set(path, value) {
    ensurePath(path);
    applySetter(getAssignableObject(path, path.length - 1), path[path.length - 1], value);
  }

  function splice(pathWithKey, len) {
    ensurePath(pathWithKey);
    var key = pathWithKey[pathWithKey.length - 1];
    var path = pathWithKey.slice(0, pathWithKey.length - 1);
    var arr = getAssignableObject(path, path.length);

    for (var _len2 = arguments.length, newItems = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
      newItems[_key2 - 2] = arguments[_key2];
    }

    arr.splice.apply(arr, [key, len].concat(newItems));
  }
}

module.exports = {
  base: base,
  library: library,
  func: func,
  topLevel: topLevel,
  helperFunc: helperFunc,
  recursiveMapValues: recursiveMapValues,
  recursiveMap: recursiveMap
};
