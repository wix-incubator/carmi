function base() {
  function $NAME($model /*: Model*/, $funcLib /*: FuncLib*/) {
    const $res = {};
    $res.$model = $model;

    function readOnly /*::<S>*/(src /*: S*/) /*: $ReadOnly<S>*/ {
      return src;
    }

    function annotate /*::<S>*/(src /*:  S */, id /*: number */) /*: S */ {
      return src;
    }

    function mapValues /*:: <S, T>*/(
      func /*: (val: S, key: string, context: any) => T*/,
      src /*: { [string]: S }*/,
      context /*: any*/
    ) /*: { [string]: T }*/ {
      return Object.keys(src).reduce((acc, key) => {
        acc[key] = func(src[key], key, context);
        return acc;
      }, {});
    }

    function filterBy /*:: <S>*/(
      func /*: (val: S, key: string, context: any) => boolean*/,
      src /*: { [string]: S }*/,
      context /*: any*/
    ) /*: { [string]: S }*/ {
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
    function recalculate() /*:void */ {
      /* DERIVED */
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
  function $$FUNCNAMEBuild() /*:void*/ {
    $res.$FUNCNAME = readOnly($EXPR);
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

module.exports = { base, func, topLevel, recursiveMap, recursiveMapValues };
