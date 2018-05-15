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

    const $uniquePersistentObjects = new Map();
    const getUniquePersistenObject = id => {
      if (!$uniquePersistentObjects.has(id)) {
        $uniquePersistentObjects.set(id, {});
      }
      return $uniquePersistentObjects.get(id);
    };

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
      $tainted.add($sourceObj);
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

    function recursiveSteps(key, $localInvalidatedKeys, $localKey) {
      const { $dependencyMap, $currentStack, $invalidatedKeys, $out, func, src, context } = this;
      if ($currentStack.length > 0) {
        const prevKey = $currentStack[$currentStack.length - 1];
        if (!$dependencyMap.has(key)) {
          $dependencyMap.set(key, []);
        }
        $dependencyMap.get(key).push({ $localInvalidatedKeys, $localKey });
      }
      if ($invalidatedKeys.has(key)) {
        $currentStack.push(key);
        $invalidatedKeys.delete(key);
        func($invalidatedKeys, src, key, $out, context, this);
        $currentStack.pop();
      }
      return $out[key];
    }

    function cascadeRecursiveInvalidations($loop) {
      const { $dependencyMap, $invalidatedKeys } = $loop;
      $invalidatedKeys.forEach(key => {
        if ($dependencyMap.has(key)) {
          $dependencyMap.get(key).forEach(({ $localInvalidatedKeys, $localKey }) => {
            invalidate($localInvalidatedKeys, $localKey);
          });
          $dependencyMap.delete(key);
        }
      });
    }

    const $recursiveMapCache = new WeakMap();

    function recursiveMapArray($targetObj, $targetKey, func, src, context) {
      const { $out, $new } = initOutput($targetObj, $targetKey, src, func, emptyArr);
      const $invalidatedKeys = $invalidatedMap.get($out);
      if ($new) {
        $recursiveMapCache.set($out, {
          $dependencyMap: new Map(),
          $currentStack: [],
          $invalidatedKeys,
          $out,
          func,
          src,
          context,
          recursiveSteps
        });
      }
      const $loop = $recursiveMapCache.get($out);
      $loop.context = context;
      if ($new) {
        for (let key = 0; key < src.length; key++) {
          $invalidatedKeys.add(key);
        }
        for (let key = 0; key < src.length; key++) {
          $loop.recursiveSteps(key, $invalidatedKeys, key);
        }
      } else {
        cascadeRecursiveInvalidations($loop);
        $invalidatedKeys.forEach(key => {
          $loop.recursiveSteps(key, $invalidatedKeys, key);
        });
      }
      $invalidatedKeys.clear();
      return $out;
    }

    function recursiveMapObject($targetObj, $targetKey, func, src, context) {
      const { $out, $new } = initOutput($targetObj, $targetKey, src, func, emptyObj);
      const $invalidatedKeys = $invalidatedMap.get($out);
      if ($new) {
        $recursiveMapCache.set($out, {
          $dependencyMap: new Map(),
          $currentStack: [],
          $invalidatedKeys,
          $out,
          func,
          src,
          context,
          recursiveSteps
        });
      }
      const $loop = $recursiveMapCache.get($out);
      $loop.context = context;
      if ($new) {
        Object.keys(src).forEach(key => $invalidatedKeys.add(key));
        Object.keys(src).forEach(key => $loop.recursiveSteps(key, $invalidatedKeys, key));
      } else {
        cascadeRecursiveInvalidations($loop);
        $invalidatedKeys.forEach(key => {
          $loop.recursiveSteps(key, $invalidatedKeys, key);
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

    const $groupByCache = new WeakMap();

    function groupByObject($targetObj, $targetKey, func, src, context) {
      const { $out, $new } = initOutput($targetObj, $targetKey, src, func, emptyObj);
      const $invalidatedKeys = $invalidatedMap.get($out);
      if ($new) {
        $groupByCache.set($out, {});
      }
      const $keyToKey = $groupByCache.get($out);
      if ($new) {
        Object.keys(src).forEach(key => func($invalidatedKeys, $keyToKey, src, key, $out, context));
      } else {
        const keysPendingDelete = {};
        $invalidatedKeys.forEach(key => {
          keysPendingDelete[$keyToKey[key]] = keysPendingDelete[$keyToKey[key]] || new Set();
          keysPendingDelete[$keyToKey[key]].add(key);
        });
        $invalidatedKeys.forEach(key => {
          if (func($invalidatedKeys, $keyToKey, src, key, $out, context)) {
            if (keysPendingDelete.hasOwnProperty($keyToKey[key])) {
              keysPendingDelete[$keyToKey[key]].delete(key);
            }
          }
        });
        Object.keys(keysPendingDelete).forEach(res => {
          if (keysPendingDelete[res].size > 0) {
            keysPendingDelete[res].forEach(key => {
              triggerInvalidations($out[res], key);
              delete $out[res][key];
            });
            triggerInvalidations($out, res);
            if (Object.keys($out[res]).length == 0) {
              delete $out[res];
            }
          }
        });
      }
      $invalidatedKeys.clear();
      return $out;
    }

    const $valuesOrKeysCache = new WeakMap();

    function valuesOrKeysForObject($targetObj, $targetKey, identifier, src, getValues) {
      const { $out, $new } = initOutput($targetObj, $targetKey, src, identifier, emptyArr);
      if ($new) {
        const $keyToIdx = {};
        const $idxToKey = [];
        $valuesOrKeysCache.set($out, { $keyToIdx, $idxToKey });
        Object.keys(src).forEach((key, idx) => {
          $out[idx] = getValues ? src[key] : key;
          $idxToKey[idx] = key;
          $keyToIdx[key] = idx;
        });
      } else {
        const $invalidatedKeys = $invalidatedMap.get($out);
        const { $keyToIdx, $idxToKey } = $valuesOrKeysCache.get($out);
        const $deletedKeys = [];
        const $addedKeys = [];
        const $touchedKeys = [];
        $invalidatedKeys.forEach(key => {
          if (src.hasOwnProperty(key) && !$keyToIdx.hasOwnProperty(key)) {
            $addedKeys.push(key);
          } else if (!src.hasOwnProperty(key) && $keyToIdx.hasOwnProperty(key)) {
            $deletedKeys.push(key);
          } else {
            if ($keyToIdx.hasOwnProperty(key)) {
              triggerInvalidations($out, $keyToIdx[key]);
            }
          }
        });
        if ($addedKeys.length < $deletedKeys.length) {
          $deletedKeys.sort((a, b) => $keyToIdx[a] - $keyToIdx[b]);
        }
        const $finalOutLength = $out.length - $deletedKeys.length + $addedKeys.length;
        // keys both deleted and added fill created holes first
        for (let i = 0; i < $addedKeys.length && i < $deletedKeys.length; i++) {
          const $addedKey = $addedKeys[i];
          const $deletedKey = $deletedKeys[i];
          const $newIdx = $keyToIdx[$deletedKey];
          delete $keyToIdx[$deletedKey];
          $keyToIdx[$addedKey] = $newIdx;
          $idxToKey[$newIdx] = $addedKey;
          $out[$newIdx] = getValues ? src[$addedKey] : $addedKey;
          triggerInvalidations($out, $newIdx);
        }
        // more keys added - append to end
        for (let i = $deletedKeys.length; i < $addedKeys.length; i++) {
          const $addedKey = $addedKeys[i];
          const $newIdx = $out.length;
          $keyToIdx[$addedKey] = $newIdx;
          $idxToKey[$newIdx] = $addedKey;
          $out[$newIdx] = getValues ? src[$addedKey] : $addedKey;
          triggerInvalidations($out, $newIdx);
        }
        // more keys deleted - move non deleted items at the tail to the location of deleted
        const $deletedNotMoved = $deletedKeys.slice($addedKeys.length);
        const $deletedNotMovedSet = new Set($deletedKeys.slice($addedKeys.length));
        const $keysToMoveInside = new Set(
          $idxToKey.slice($finalOutLength).filter(key => !$deletedNotMovedSet.has(key))
        );
        let $savedCount = 0;
        for (let $tailIdx = $finalOutLength; $tailIdx < $out.length; $tailIdx++) {
          const $currentKey = $idxToKey[$tailIdx];
          if ($keysToMoveInside.has($currentKey)) {
            // need to move this key to one of the pending delete
            const $switchedWithDeletedKey = $deletedNotMoved[$savedCount];
            const $newIdx = $keyToIdx[$switchedWithDeletedKey];
            $out[$newIdx] = getValues ? src[$currentKey] : $currentKey;
            $keyToIdx[$currentKey] = $newIdx;
            $idxToKey[$newIdx] = $currentKey;
            delete $keyToIdx[$switchedWithDeletedKey];
            triggerInvalidations($out, $newIdx);
            $savedCount++;
          } else {
            delete $keyToIdx[$currentKey];
          }
          triggerInvalidations($out, $tailIdx);
        }
        $out.length = $finalOutLength;
        $idxToKey.length = $out.length;
        $invalidatedKeys.clear();
      }
      return $out;
    }

    const $arrayCache = new WeakMap();
    function getEmptyArray($invalidatedKeys, key, token) {
      if (!$arrayCache.has($invalidatedKeys)) {
        $arrayCache.set($invalidatedKeys, {});
      }
      const $cacheByKey = $arrayCache.get($invalidatedKeys);
      $cacheByKey[key] = $cacheByKey[key] || new Map();
      if (!$cacheByKey[key].has(token)) {
        $cacheByKey[key].set(token, []);
      }
      return $cacheByKey[key].get(token);
    }

    const $objectCache = new WeakMap();
    function getEmptyObject($invalidatedKeys, key, token) {
      if (!$objectCache.has($invalidatedKeys)) {
        $objectCache.set($invalidatedKeys, {});
      }
      const $cacheByKey = $objectCache.get($invalidatedKeys);
      $cacheByKey[key] = $cacheByKey[key] || new Map();
      if (!$cacheByKey[key].has(token)) {
        $cacheByKey[key].set(token, {});
      }
      return $cacheByKey[key].get(token);
    }

    function assignOrDefaults($targetObj, $targetKey, identifier, src, assign) {
      const { $out, $new } = initOutput($targetObj, $targetKey, src, identifier, emptyObj);
      if (!assign) {
        src = [...src].reverse();
      }
      if ($new) {
        Object.assign($out, ...src);
      } else {
        const $invalidatedKeys = $invalidatedMap.get($out);
        const $keysPendingDelete = new Set(Object.keys($out));
        const res = Object.assign({}, ...src);
        Object.keys(res).forEach(key => {
          $keysPendingDelete.delete(key);
          if ($out[key] !== res[key] || (typeof res[key] === 'object' && $tainted.has(res[key]))) {
            triggerInvalidations($out, key);
          }
          $out[key] = res[key];
        });
        $keysPendingDelete.forEach(key => {
          delete $out[key];
          triggerInvalidations($out, key);
        });
        $invalidatedKeys.clear();
      }
      return $out;
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

function groupBy() {
  function $FUNCNAME($invalidatedKeys, $keyToKey, src, key, acc, context) {
    let $changed = false;
    /* PRETRACKING */
    if (!src.hasOwnProperty(key)) {
      delete $keyToKey[key];
      return false;
    }
    const val = src[key];
    const res = '' + $EXPR1;
    $keyToKey[key] = res;
    if (!acc.hasOwnProperty(res)) {
      acc[res] = {};
    }
    $changed = val !== acc[res][key] || (typeof val === 'object' && $tainted.has(val));
    acc[res][key] = val;
    /* TRACKING */
    /* INVALIDATES */
    if ($changed) {
      triggerInvalidations(acc[res], key);
      triggerInvalidations(acc, res);
    }
    /* INVALIDATES-END */
    return true;
  }
}
groupBy.collectionFunc = 'groupByObject';

function recursiveMap() {
  function $FUNCNAME($invalidatedKeys, src, key, acc, context, loop) {
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
recursiveMap.collectionFunc = 'recursiveMapArray';

function recursiveMapValues() {
  function $FUNCNAME($invalidatedKeys, src, key, acc, context, loop) {
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
recursiveMapValues.collectionFunc = 'recursiveMapObject';

function object() {
  const $FUNCNAMEToken = getUniquePersistenObject(/*ID*/);
  const $FUNCNAMEKeys = [
    /*ARGS*/
  ];
  const $FUNCNAMELength = $FUNCNAMEKeys.length;
  function $FUNCNAME($invalidatedKeys, key, newVal) {
    let $changed = false;
    const res = getEmptyObject($invalidatedKeys, key, $FUNCNAMEToken);
    for (let i = 0; i < $FUNCNAMELength; i++) {
      let name = $FUNCNAMEKeys[i];
      /* INVALIDATES */
      if (
        res.hasOwnProperty(name) &&
        (res[name] !== newVal[name] || (typeof newVal[name] === 'object' && $tainted.has(newVal[name])))
      ) {
        triggerInvalidations(res, name);
      }
      /* INVALIDATES-END */
      res[name] = newVal[name];
    }
    return res;
  }
}

function array() {
  const $FUNCNAMEToken = getUniquePersistenObject(/*ID*/);
  const $FUNCNAMELength = $ARGS;
  function $FUNCNAME($invalidatedKeys, key, newVal) {
    let $changed = false;
    const res = getEmptyArray($invalidatedKeys, key, $FUNCNAMEToken);
    for (let i = 0; i < $FUNCNAMELength; i++) {
      /* INVALIDATES */
      if (
        res.length === $FUNCNAMELength &&
        (res[i] !== newVal[i] || (typeof newVal[i] === 'object' && $tainted.has(newVal[i])))
      ) {
        triggerInvalidations(res, i);
      }
      /* INVALIDATES-END */
      res[i] = newVal[i];
    }
    return res;
  }
}

module.exports = {
  base,
  topLevel,
  mapValues,
  filterBy,
  map,
  any,
  anyValues,
  keyBy,
  filter,
  groupBy,
  recursiveMap,
  recursiveMapValues,
  object,
  array
};
