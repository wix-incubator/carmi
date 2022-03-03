function library() {
  const {
		any,
		anyValues,
		array,
		assign,
		bind,
		call,
		defaults,
		filter,
		filterBy,
		flatten,
		groupBy,
		isEmpty,
		keyBy,
		keys,
		last,
		map,
		mapKeys,
		mapValues,
        object,
		push,
		range,
		recursiveMap,
		recursiveMapValues,
		set,
		size,
		splice,
		sum,
    trackPath,
		values,
		updateModel,
		resetTainted
  } = createLibrary(
    $res,
    $funcLib,
    $funcLibRaw
  )

}

function topLevel() {
  function $$FUNCNAMEBuild($tracked) {
    /* PRETRACKING */
    /* TYPE_CHECK */
    const newValue = $EXPR;
    /* TRACKING */
    return newValue
  }
}

function object() {
  const $FUNCNAMEArgs = [
    /*ARGS*/
  ];
}

function array() {
}

function func() {
  function $FUNCNAME($tracked, key, val, context) {
    /* PRETRACKING */
    const res = $EXPR1;
    /* TRACKING */
    return res;
  }
}

function recursiveFunc() {
  function $FUNCNAME($tracked, key, val, context, loop) {
    /* PRETRACKING */
    const res = $EXPR1;
    /* TRACKING */
    return res;
  }
}

function helperFunc() {
  function $ROOTNAME($tracked$FN_ARGS) {
    /* PRETRACKING */
    const res = $EXPR1;
    /* TRACKING */
    return res;
  }
}

const base = require('./naive').base;

function updateDerived() {
  const builderFunctions = [/*BUILDER_FUNCS*/];
  const builderNames = [/*BUILDER_NAMES*/];

  const updateDerived = () => updateModel($COUNT_GETTERS, builderFunctions, $topLevel, builderNames)
}

module.exports = {
  base,
  library,
  topLevel,
  updateDerived,
  recursiveMap: recursiveFunc,
  recursiveMapValues: recursiveFunc,
  helperFunc,
  object,
  array,
  func
};
