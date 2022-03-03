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
        }
      })
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
      $inRecalculate = false;
      if ($batchPending.length) {
        $res.$endBatch();
      } else {
        $listeners.forEach(callback => callback());
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
      { $SETTERS },
      {
        $startBatch: () => {
          $inBatch = true;
        },
        $endBatch: () => {
          if ($inRecalculate) {
            throw new Error('Can not end batch in the middle of a batch');
          }
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
          if ($inRecalculate) {
            func();
          } else {
            $res.$startBatch();
            func();
            $res.$endBatch();
          }
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
  const {
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
    push,
  } = createLibrary($model);
}

module.exports = { base, library, func, topLevel, helperFunc, recursiveMapValues, recursiveMap };
