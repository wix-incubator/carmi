function library() {
  const { library, createInvalidatedSet } = require('carmi/src/lib/optimizing')
  const $trackingMap = new WeakMap();
  const $trackingWildcards = new WeakMap();
  const $invalidatedMap = new WeakMap();
  const $invalidatedRoots = createInvalidatedSet(null, null)
  let $first = true;
  let $tainted = new WeakSet();
  $invalidatedMap.set($res, $invalidatedRoots);
  const {
    updateTainted,
    untrack,
    invalidate,
    setOnObject,
    deleteOnObject,
    setOnArray,
    truncateArray,
    track,
    trackPath,
    triggerInvalidations,
    initOutput,
    emptyObj,
    emptyArr,
    nullFunc,
    mapValuesOpt,
    filterByOpt,
    mapOpt,
    recursiveSteps,
    cascadeRecursiveInvalidations,
    recursiveCacheFunc,
    recursiveMapOpt,
    recursiveMapValuesOpt,
    keyByOpt,
    mapKeysOpt,
    filterCacheFunc,
    filterOpt,
    anyOpt,
    anyValuesOpt,
    groupByOpt,
    valuesOrKeysCacheFunc,
    valuesOpt,
    keysOpt,
    getEmptyArray,
    getEmptyObject,
    array,
    object,
    call,
    bind,
    assignOpt,
    defaultsOpt,
    flattenOpt,
    size,
    isEmpty,
    last,
    sumOpt,
    range,
    invalidatePath,
    set,
    splice
  } = library({
    $trackingMap,
    $trackingWildcards,
    $invalidatedMap,
    $tainted,
    $res,
    $funcLib,
    $funcLibRaw,
    getAssignableObject,
    ensurePath,
    applySetter
  })

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
  function updateDerived() {
    for (let i = 0; i < $COUNT_GETTERS; i++) {
      if ($first || $invalidatedRoots.has(i)) {
        const newValue = builderFunctions[i]([$invalidatedRoots, i]);
        setOnArray($topLevel, i, newValue, $first);
        if (!$first) {
          $invalidatedRoots.delete(i);
        }
        if (builderNames[i]) {
          $res[builderNames[i]] = newValue;
        }
      }
    }
  }
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
