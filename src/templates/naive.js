function base() {
  function $NAME($model) {
    const res = { $model };

    function mapValues(arg0, arg1) {
      return Object.keys(arg1).reduce((acc, key) => {
        acc[key] = arg0(arg1[key]);
        return acc;
      }, {});
    }

    function filterBy(arg0, arg1) {
      return Object.keys(arg1).reduce((acc, key) => {
        if (arg0(arg1[key])) {
          acc[key] = arg1[key];
        }
        return acc;
      }, {});
    }

    function groupBy(arg0, arg1) {
      return Object.keys(arg1).reduce((acc, key) => {
        const newKey = arg0(arg1[key]);
        acc[newKey] = acc[newKey] || [];
        acc[newKey].push(arg1[key]);
        return acc;
      }, {});
    }

    function mapKeys(arg0, arg1) {
      return Object.keys(arg1).reduce((acc, key) => {
        const newKey = arg0(arg1[key]);
        acc[newKey] = arg1[key];
        return acc;
      }, {});
    }

    /* ALL_EXPRESSIONS */

    function recalculate() {
      /* DERIVED */
    }
    Object.assign(res, {
      /* SETTERS */
    });
    recalculate();
    return res;
  }
}

function func() {
  function $FUNCNAME(arg0, arg1) {
    return $EXPR1;
  }
}

function topLevel() {
  function $$FUNCNAME(arg0, arg1) {
    return $EXPR;
  }
}

module.exports = { base, func, topLevel };
