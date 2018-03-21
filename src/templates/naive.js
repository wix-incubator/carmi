function base() {
  function $NAME($model) {
    const $res = { $model };

    function mapValues(arg0, arg1, context) {
      return Object.keys(arg1).reduce((acc, key) => {
        acc[key] = arg0(arg1[key], key, context);
        return acc;
      }, {});
    }

    function filterBy(arg0, arg1, context) {
      return Object.keys(arg1).reduce((acc, key) => {
        if (arg0(arg1[key], key, context)) {
          acc[key] = arg1[key];
        }
        return acc;
      }, {});
    }

    function groupBy(arg0, arg1, context) {
      return Object.keys(arg1).reduce((acc, key) => {
        const newKey = arg0(arg1[key], key, context);
        acc[newKey] = acc[newKey] || [];
        acc[newKey].push(arg1[key]);
        return acc;
      }, {});
    }

    function mapKeys(arg0, arg1, context) {
      return Object.keys(arg1).reduce((acc, key) => {
        const newKey = arg0(arg1[key], key, context);
        acc[newKey] = arg1[key];
        return acc;
      }, {});
    }

    /* ALL_EXPRESSIONS */

    function recalculate() {
      /* DERIVED */
    }
    Object.assign($res, {
      /* SETTERS */
    });
    recalculate();
    return $res;
  }
}

function func() {
  function $FUNCNAME(arg0, arg1, context) {
    return $EXPR1;
  }
}

function topLevel() {
  function $$FUNCNAME() {
    return $EXPR;
  }
}

module.exports = { base, func, topLevel };
