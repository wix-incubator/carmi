function base() {
  function $NAME($model, $funcLib) {
    'use strict';
    const $res = { $model };
    const $trackingMap = new WeakMap();
    const $trackedMap = new WeakMap();
    const $invalidatedMap = new WeakMap();
    const $parentObjectMap = new WeakMap();
    const $parentKeyMap = new WeakMap();
    const $invalidatedRoots = new Set();
    const $wildcard = '*****';
    let $tainted = new WeakSet();
    $invalidatedMap.set($res, $invalidatedRoots);

    const collectAllItems = (res, obj, prefix) => {
      if (typeof obj !== 'object') {
        return;
      }
      res.set(obj, prefix);
      const keys = Array.isArray(obj) ? new Array(obj.length).fill().map((_, idx) => idx) : Object.keys(obj);
      keys.forEach(idx => {
        const child = obj[idx];
        if (typeof child === 'object') {
          collectAllItems(res, child, `${prefix}.${idx}`);
        }
      });
    };

    const serialize = (all, obj) => {
      if (all.has(obj)) {
        return all.get(obj);
      } else if (obj instanceof WeakMap) {
        return Array.from(all.keys()).reduce((acc, item) => {
          if (obj.has(item)) {
            acc[all.get(item)] = serialize(all, obj.get(item));
          }
          return acc;
        }, {});
      } else if (obj instanceof Map) {
        return Array.from(obj.keys()).reduce((acc, item) => {
          if (all.has(item)) {
            acc[all.get(item)] = serialize(all, obj.get(item));
          } else {
            acc[item] = serialize(all, obj.get(item));
          }
          return acc;
        }, {});
      } else if (obj instanceof Set || obj instanceof Array) {
        return Array.from(obj).map(x => (all.has(x) ? all.get(x) : serialize(all, x)));
      } else if (typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
          acc[key] = serialize(all, obj[key]);
          return acc;
        }, {});
      } else {
        return obj;
      }
    };

    const debug = () => {
      const all = new Map();
      collectAllItems(all, $model, '$model');
      collectAllItems(all, $res, '$res');
      console.log(`Found ${all.size} records`);
      console.log(JSON.stringify(serialize(all, { $trackingMap, $invalidatedMap }), null, 2));
    };

    const invalidate = ($targetKeySet, $targetKey) => {
      if ($targetKeySet.has($targetKey)) {
        return;
      }
      $targetKeySet.add($targetKey);
      if ($parentObjectMap.has($targetKeySet)) {
        invalidate($parentObjectMap.get($targetKeySet), $parentKeyMap.get($targetKeySet));
      }
    };

    const track = ($targetKeySet, $targetKey, $sourceObj, $sourceKey) => {
      if (!$sourceObj || !$targetKeySet) {
        return;
      }
      if (!$trackingMap.has($sourceObj)) {
        $trackingMap.set($sourceObj, {});
      }
      const $track = $trackingMap.get($sourceObj);
      $track[$sourceKey] = $track.hasOwnProperty($sourceKey) ? $track[$sourceKey] : new Map();
      if (!$track[$sourceKey].has($targetKeySet)) {
        $track[$sourceKey].set($targetKeySet, new Set());
      }
      $track[$sourceKey].get($targetKeySet).add($targetKey);
      if (!$trackedMap.has($targetKeySet)) {
        $trackedMap.set($targetKeySet, {});
      }
      const $tracked = $trackedMap.get($targetKeySet);
      $tracked[$targetKey] = $tracked[$targetKey] || [];
      $tracked[$targetKey].push({ $sourceKey, $sourceObj });
    };

    const untrack = ($targetKeySet, $targetKey) => {
      const $tracked = $trackedMap.get($targetKeySet);
      if (!$tracked || !$tracked[$targetKey]) {
        return;
      }
      $tracked[$targetKey].forEach(({ $sourceObj, $sourceKey }) => {
        const $trackingSource = $trackingMap.get($sourceObj);
        $trackingSource[$sourceKey].get($targetKeySet).delete($targetKey);
      });
      delete $tracked[$targetKey];
    };

    function triggerInvalidations($sourceObj, $sourceKey) {
      if (!$trackingMap.has($sourceObj)) {
        return;
      }
      const $track = $trackingMap.get($sourceObj);
      if ($track.hasOwnProperty($sourceKey)) {
        $track[$sourceKey].forEach(($targetInvalidatedKeys, $targetKeySet) => {
          $targetInvalidatedKeys.forEach($targetKey => invalidate($targetKeySet, $targetKey));
        });
      }
      if ($track.hasOwnProperty($wildcard)) {
        $track[$wildcard].forEach(($targetInvalidatedKeys, $targetKeySet) => {
          $targetInvalidatedKeys.forEach($targetKey => invalidate($targetKeySet, $sourceKey));
        });
      }
    }

    function initOutput($targetObj, $targetKey, src, func, createDefaultValue) {
      let $new = false;
      func.output = func.output || new WeakMap();
      if (!func.output.has($targetObj)) {
        func.output.set($targetObj, new WeakMap());
      }
      const $targetOutputs = func.output.get($targetObj);
      if (!$targetOutputs.has(src)) {
        $targetOutputs.set(src, {});
      }
      const $targetSources = $targetOutputs.get(src);
      if (!$targetSources.hasOwnProperty($targetKey)) {
        $targetSources[$targetKey] = createDefaultValue();
        const $parentInvalidatedKeys = $invalidatedMap.get($targetObj);
        const $invalidatedKeys = new Set();
        $parentObjectMap.set($invalidatedKeys, $parentInvalidatedKeys);
        $parentKeyMap.set($invalidatedKeys, $targetKey);
        $invalidatedMap.set($targetSources[$targetKey], $invalidatedKeys);
        track($invalidatedKeys, $wildcard, src, $wildcard);
        $new = true;
      }
      const $out = $targetSources[$targetKey];
      return { $out, $new };
    }

    const emptyObj = () => {
      return {};
    };
    const emptyArr = () => [];

    function forObject($targetObj, $targetKey, func, src, context) {
      const { $out, $new } = initOutput($targetObj, $targetKey, src, func, emptyObj);
      const $invalidatedKeys = $invalidatedMap.get($out);
      (($new && Object.keys(src)) || $invalidatedKeys).forEach(key => {
        func($invalidatedKeys, src, key, $out, context);
      });
      $invalidatedKeys.clear();
      return $out;
    }

    function forArray($targetObj, $targetKey, func, src, context) {
      const { $out, $new } = initOutput($targetObj, $targetKey, src, func, emptyArr);
      const $invalidatedKeys = $invalidatedMap.get($out);
      if ($new) {
        for (let key = 0; key < src.length; key++) {
          func($invalidatedKeys, src, key, $out, context);
        }
      } else {
        $invalidatedKeys.forEach(key => {
          func($invalidatedKeys, src, key, $out, context);
        });
      }
      $invalidatedKeys.clear();
      return $out;
    }

    const $keyByCache = new WeakMap();

    function keyByArray($targetObj, $targetKey, func, src, context) {
      const { $out, $new } = initOutput($targetObj, $targetKey, src, func, emptyObj);
      const $invalidatedKeys = $invalidatedMap.get($out);
      if ($new) {
        $keyByCache.set($out, []);
      }
      const $idxToKey = $keyByCache.get($out);
      if ($new) {
        for (let key = 0; key < src.length; key++) {
          func($invalidatedKeys, $idxToKey, src, key, $out, context);
        }
      } else {
        const keysPendingDelete = new Set();
        $invalidatedKeys.forEach(key => keysPendingDelete.add($idxToKey[key]));
        $invalidatedKeys.forEach(key => {
          keysPendingDelete.delete(func($invalidatedKeys, $idxToKey, src, key, $out, context));
        });
        keysPendingDelete.forEach(key => {
          triggerInvalidations($out, key);
          delete $out[key];
        });
      }
      $idxToKey.length = src.length;
      $invalidatedKeys.clear();
      return $out;
    }

    const $filterCache = new WeakMap();

    function filterArray($targetObj, $targetKey, func, src, context) {
      const { $out, $new } = initOutput($targetObj, $targetKey, src, func, emptyArr);
      const $invalidatedKeys = $invalidatedMap.get($out);
      if ($new) {
        $filterCache.set($out, [0]);
      }
      const $idxToIdx = $filterCache.get($out);
      if ($new) {
        for (let key = 0; key < src.length; key++) {
          func($invalidatedKeys, $idxToIdx, src, key, $out, context);
        }
      } else {
        let firstIndex = Number.MAX_SAFE_INTEGER;
        $invalidatedKeys.forEach(key => (firstIndex = Math.min(firstIndex, key)));
        for (let key = firstIndex; key < src.length; key++) {
          func($invalidatedKeys, $idxToIdx, src, key, $out, context);
        }
        $idxToIdx.length = src.length + 1;
        for (let key = $idxToIdx[$idxToIdx.length - 1]; key < $out.length; key++) {
          triggerInvalidations($out, key);
        }
        $out.length = $idxToIdx[$idxToIdx.length - 1];
      }
      $invalidatedKeys.clear();
      return $out;
    }

    function anyObject($targetObj, $targetKey, func, src, context) {
      const { $out, $new } = initOutput($targetObj, $targetKey, src, func, emptyArr);
      const $invalidatedKeys = $invalidatedMap.get($out);
      // $out has at most 1 key - the one that stopped the previous run because it was truthy
      if ($new) {
        Object.keys(src).forEach(key => $invalidatedKeys.add(key));
      }
      const $prevStop = $out.length > 0 ? $out[0] : false;
      if ($prevStop) {
        if ($invalidatedKeys.has($prevStop)) {
          $invalidatedKeys.delete($prevStop);
          if (func($invalidatedKeys, src, $prevStop, $out, context)) {
            return true;
          } else {
            $out.length = 0;
          }
        } else {
          return true;
        }
      }
      for (let key of $invalidatedKeys) {
        $invalidatedKeys.delete(key);
        if (func($invalidatedKeys, src, key, $out, context)) {
          $out[0] = key;
          return true;
        }
      }
      return false;
    }

    function anyArray($targetObj, $targetKey, func, src, context) {
      const { $out, $new } = initOutput($targetObj, $targetKey, src, func, emptyArr);
      const $invalidatedKeys = $invalidatedMap.get($out);
      // $out has at most 1 key - the one that stopped the previous run because it was truthy
      if ($new) {
        for (let key = 0; key < src.length; key++) {
          $invalidatedKeys.add(key);
        }
      }
      const $prevStop = $out.length > 0 ? $out[0] : -1;
      if ($prevStop !== -1) {
        if ($invalidatedKeys.has($prevStop)) {
          $invalidatedKeys.delete($prevStop);
          if (func($invalidatedKeys, src, $prevStop, $out, context)) {
            return true;
          } else {
            $out.length = 0;
          }
        } else {
          return true;
        }
      }
      for (let key of $invalidatedKeys) {
        $invalidatedKeys.delete(key);
        if (func($invalidatedKeys, src, key, $out, context)) {
          $out[0] = key;
          return true;
        }
      }
      return false;
    }

    /* ALL_EXPRESSIONS */
    let $inBatch = false;
    function recalculate() {
      if ($inBatch) {
        return;
      }
      /* DERIVED */
      $tainted = new WeakSet();
    }
    Object.assign(
      $res,
      {
        /* SETTERS */
      },
      {
        $startBatch: () => ($inBatch = true),
        $endBatch: () => {
          $inBatch = false;
          recalculate();
        }
      }
    );
    recalculate();
    return $res;
  }
}

function topLevel() {
  $invalidatedRoots.add('$FUNCNAME');
  function $$FUNCNAMEBuild() {
    /* PRETRACKING */
    const acc = $res;
    const key = '$FUNCNAME';
    const prevValue = $res.$FUNCNAME;
    const $invalidatedKeys = $invalidatedRoots;
    $res.$FUNCNAME = $EXPR;
    const $changed =
      prevValue !== $res.$FUNCNAME || (typeof $res.$FUNCNAME === 'object' && $tainted.has($res.$FUNCNAME));
    $invalidatedRoots.delete('$FUNCNAME');
    /* TRACKING */
    /* INVALIDATES */
    if ($changed) {
      triggerInvalidations(acc, key);
    }
    /* INVALIDATES-END */
    return $res.$FUNCNAME;
  }
}

function mapValues() {
  function $FUNCNAME($invalidatedKeys, src, key, acc, context) {
    let $changed = false;
    /* PRETRACKING */
    const val = src[key];
    if (!src.hasOwnProperty(key)) {
      if (acc.hasOwnProperty(key)) {
        delete acc[key];
        $changed = true;
      }
    } else {
      const res = $EXPR1;
      $changed = res !== acc[key] || (typeof res === 'object' && $tainted.has(res));
      acc[key] = res;
      /* TRACKING */
    }
    /* INVALIDATES */
    if ($changed) {
      triggerInvalidations(acc, key);
    }
    /* INVALIDATES-END */
  }
}

function filterBy() {
  function $FUNCNAME($invalidatedKeys, src, key, acc, context) {
    let $changed = false;
    /* PRETRACKING */
    const val = src[key];
    if (!src.hasOwnProperty(key)) {
      if (acc.hasOwnProperty(key)) {
        delete acc[key];
        $changed = true;
      }
    } else {
      const res = $EXPR1;
      if (res) {
        $changed = acc[key] !== val || (typeof val === 'object' && $tainted.has(val));
        acc[key] = val;
      } else if (acc.hasOwnProperty(key)) {
        delete acc[key];
        $changed = true;
      }
      /* TRACKING */
    }
    /* INVALIDATES */
    if ($changed) {
      triggerInvalidations(acc, key);
    }
    /* INVALIDATES-END */
  }
}

function map() {
  function $FUNCNAME($invalidatedKeys, src, key, acc, context) {
    let $changed = false;
    /* PRETRACKING */
    const val = src[key];
    if (key >= src.length) {
      $changed = true;
      if (acc.length >= key) {
        acc.length = src.length;
      }
    } else {
      const res = $EXPR1;
      $changed = res !== acc[key] || (typeof res === 'object' && $tainted.has(res));
      acc[key] = res;
      /* TRACKING */
    }
    /* INVALIDATES */
    if ($changed) {
      triggerInvalidations(acc, key);
    }
    /* INVALIDATES-END */
  }
}

function any() {
  function $FUNCNAME($invalidatedKeys, src, key, acc, context) {
    let $changed = false;
    /* PRETRACKING */
    const val = src[key];
    let res = false;
    if (key >= src.length) {
      $changed = true;
    } else {
      res = $EXPR1;
      $changed = acc[0] !== key;
    }
    /* TRACKING */
    return res;
  }
}
any.collectionFunc = 'anyArray';

function anyValues() {
  function $FUNCNAME($invalidatedKeys, src, key, acc, context) {
    let $changed = false;
    /* PRETRACKING */
    let res = false;
    const val = src[key];
    if (!src.hasOwnProperty(key)) {
      $changed = true;
    } else {
      res = $EXPR1;
      $changed = acc[0] !== key;
    }
    /* TRACKING */
    return res;
  }
}
anyValues.collectionFunc = 'anyObject';

function keyBy() {
  function $FUNCNAME($invalidatedKeys, $idxToKey, src, key, acc, context) {
    /* PRETRACKING */
    let res = null;
    if (key < src.length) {
      const val = src[key];
      res = '' + $EXPR1;
      const $changed = acc[res] !== val || (typeof val === 'object' && $tainted.has(val));
      acc[res] = val;
      $idxToKey[key] = res;
      /* TRACKING */
      /* INVALIDATES */
      if ($changed) {
        triggerInvalidations(acc, res);
      }
      /* INVALIDATES-END */
    }
    return res;
  }
}
keyBy.collectionFunc = 'keyByArray';

function filter() {
  function $FUNCNAME($invalidatedKeys, $idxToIdx, src, key, acc, context) {
    /* PRETRACKING */
    const val = src[key];
    const res = $EXPR1;
    const prevItemIdx = $idxToIdx[key];
    const nextItemIdx = res ? prevItemIdx + 1 : prevItemIdx;
    let $changed = false;
    if (nextItemIdx !== prevItemIdx) {
      $changed = acc[prevItemIdx] !== val || (typeof val === 'object' && $tainted.has(val));
      acc[prevItemIdx] = val;
    }
    $idxToIdx[key + 1] = nextItemIdx;
    /* TRACKING */
    /* INVALIDATES */
    if ($changed) {
      triggerInvalidations(acc, prevItemIdx);
    }
    /* INVALIDATES-END */
  }
}
filter.collectionFunc = 'filterArray';

module.exports = {
  base,
  topLevel,
  mapValues,
  filterBy,
  map,
  any,
  anyValues,
  keyBy,
  filter
};
