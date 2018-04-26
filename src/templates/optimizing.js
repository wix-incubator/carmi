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

    function initOutput($targetObj, $targetKey, src, callback, createDefaultValue) {
      let $new = false;
      callback.output = callback.output || new WeakMap();
      if (!callback.output.has($targetObj)) {
        callback.output.set($targetObj, new WeakMap());
      }
      const $targetOutputs = callback.output.get($targetObj);
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

    function forObject($targetObj, $targetKey, callback, src, context) {
      const { $out, $new } = initOutput($targetObj, $targetKey, src, callback, emptyObj);
      const $invalidatedKeys = $invalidatedMap.get($out);
      (($new && Object.keys(src)) || $invalidatedKeys).forEach(key => {
        callback($invalidatedKeys, src, key, $out, context);
      });
      $invalidatedKeys.clear();
      return $out;
    }

    function forArray($targetObj, $targetKey, callback, src, context) {
      const { $out, $new } = initOutput($targetObj, $targetKey, src, callback, emptyArr);
      const $invalidatedKeys = $invalidatedMap.get($out);
      if ($new) {
        for (let key = 0; key < src.length; key++) {
          callback($invalidatedKeys, src, key, $out, context);
        }
      } else {
        $invalidatedKeys.forEach(key => {
          callback($invalidatedKeys, src, key, $out, context);
        });
      }
      $invalidatedKeys.clear();
      return $out;
    }

    function anyArray($targetObj, $targetKey, callback, src, context) {
      const { $out, $new } = initOutput($targetObj, $targetKey, src, callback, emptyArr);
      const $invalidatedKeys = $invalidatedMap.get($out);
      // $out has at most 1 key - the one that stopped the previous run because it was truthy
      if ($new) {
        for (let key = 0; key < src.length; key++) {
          $invalidatedKeys.add(key);
        }
      }
      const $prevStop = $out.length > 0 ? $out[0] : false;
      if ($prevStop) {
        if ($invalidatedKeys.has($prevStop)) {
          $invalidatedKeys.delete($prevStop);
          if (callback($invalidatedKeys, src, $prevStop, $out, context)) {
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
        if (callback($invalidatedKeys, src, key, $out, context)) {
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
    const arg1 = '$FUNCNAME';
    const $changed = true;
    const $invalidatedKeys = $invalidatedRoots;
    $res.$FUNCNAME = $EXPR;
    $invalidatedRoots.delete('$FUNCNAME');
    /* TRACKING */
    return $res.$FUNCNAME;
  }
}

function mapValues() {
  function $FUNCNAME($invalidatedKeys, src, arg1, acc, context) {
    let $changed = false;
    /* PRETRACKING */
    const arg0 = src[arg1];
    if (!src.hasOwnProperty(arg1)) {
      if (acc.hasOwnProperty(arg1)) {
        delete acc[arg1];
        $changed = true;
      }
    } else {
      const res = $EXPR1;
      $changed = res !== acc[arg1];
      acc[arg1] = res;
    }
    /* TRACKING */
  }
}

function filterBy() {
  function $FUNCNAME($invalidatedKeys, src, arg1, acc, context) {
    let $changed = false;
    /* PRETRACKING */
    const arg0 = src[arg1];
    if (!src.hasOwnProperty(arg1)) {
      if (acc.hasOwnProperty(arg1)) {
        delete acc[arg1];
        $changed = true;
      }
    } else {
      const res = $EXPR1;
      if (res) {
        $changed = acc[arg1] !== arg0;
        acc[arg1] = arg0;
      } else if (acc.hasOwnProperty(arg1)) {
        delete acc[arg1];
        $changed = true;
      }
    }
    /* TRACKING */
  }
}

function map() {
  function $FUNCNAME($invalidatedKeys, src, arg1, acc, context) {
    let $changed = false;
    /* PRETRACKING */
    const arg0 = src[arg1];
    if (arg1 > src.length) {
      $changed = true;
      if (acc.length > arg1) {
        acc.length = src.length;
      }
    } else {
      const res = $EXPR1;
      $changed = res !== acc[arg1];
      acc[arg1] = res;
    }
    /* TRACKING */
  }
}

function any() {
  function $FUNCNAME($invalidatedKeys, src, arg1, acc, context) {
    let $changed = false;
    /* PRETRACKING */
    const arg0 = src[arg1];
    let res = false;
    if (arg1 > src.length) {
      $changed = true;
    } else {
      res = $EXPR1;
      $changed = acc[0] !== arg1;
    }
    /* TRACKING */
    return res;
  }
}

module.exports = { base, topLevel, mapValues, filterBy, map, any };
