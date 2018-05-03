function base() {
  function $NAME($model, $funcLib) {
    const $res = { $model };

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

    /* ALL_EXPRESSIONS */

    function recalculate() {
      /* DERIVED */
    }
    Object.assign(
      $res,
      {
        /* SETTERS */
      },
      { $startBatch: () => {}, $endBatch: () => {} }
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

module.exports = { base, func, topLevel };
