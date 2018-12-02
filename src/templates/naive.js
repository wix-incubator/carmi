function base() {
  function $NAME($model, $funcLib, $batchingStrategy) {
    const $res = { $model };
    const $listeners = new Set();

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
      return Object.keys(src).reduce((acc, key) => {
        const newKey = func(src[key], key, context);
        acc[newKey] = acc[newKey] || [];
        acc[newKey].push(src[key]);
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
      return Array.from(Object.values(src));
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

    /* ALL_EXPRESSIONS */
    let $inBatch = false;
    let $batchPending = [];

    function recalculate() {
      if ($inBatch) {
        return;
      }
      /* DERIVED */
      $listeners.forEach(callback => callback());
    }

    function $setter(func) {
      return (...args) => {
        if (!$inBatch && $batchingStrategy) {
          $batchingStrategy.call($res);
          $inBatch = true;
        }
        if ($inBatch) {
          $batchPending.push({func, args})
        } else {
          func.apply($res, args);
          recalculate();
        }
      }
    }

    Object.assign(
      $res,
      {
        /* SETTERS */
      },
      {
        $startBatch: () => {
          $inBatch = true;
        },
        $endBatch: () => {
          $inBatch = false;
          $batchPending.forEach(({func, args}) => {
            func.apply($res, args);
          });
          $batchPending = [];
          recalculate();
        },
        $runInBatch: func => {
          this.$startBatch();
          func();
          this.$endBatch();
        },
        $addListener: func => {
          $listeners.add(func);
        },
        $removeListener: func => {
          $listeners.delete(func);
        },
        $setBatchingStrategy: func => {
          $batchingStrategy = func;
        },
        /* DEBUG */
        $ast: () => {
          return $AST;
        },
        $source: () => {
          return /* SOURCE_FILES */;
        }
        /* DEBUG-END */
      }
    );
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

function recursiveMapValues() {
  function $FUNCNAME(val, key, context, loop) {
    return $EXPR1;
  }
}

module.exports = { base, func, topLevel, recursiveMapValues, recursiveMap };
