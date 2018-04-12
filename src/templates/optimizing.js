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

    const invalidate = ($targetObj, $targetKey) => {
      if (!$targetObj || typeof $targetObj !== 'object') {
        return;
      }
      if (!$invalidatedMap.has($targetObj)) {
        $invalidatedMap.set($targetObj, new Set());
      }
      const $invalidatedSet = $invalidatedMap.get($targetObj);
      if ($invalidatedSet.has($targetKey)) {
        return; // already invalidated
      }
      $invalidatedSet.add($targetKey);
      if ($parentObjectMap.has($targetObj)) {
        invalidate($parentObjectMap.get($targetObj), $parentKeyMap.get($targetObj));
      }
    };

    const track = ($targetObj, $targetKey, $sourceObj, $sourceKey) => {
      if (!$sourceObj || !$targetObj) {
        return;
      }
      if (!$trackingMap.has($sourceObj)) {
        $trackingMap.set($sourceObj, {});
      }
      const $track = $trackingMap.get($sourceObj);
      $track[$sourceKey] = $track.hasOwnProperty($sourceKey) ? $track[$sourceKey] : new Map();
      if (!$track[$sourceKey].has($targetObj)) {
        $track[$sourceKey].set($targetObj, new Set());
      }
      $track[$sourceKey].get($targetObj).add($targetKey);
      if (!$trackedMap.has($targetObj)) {
        $trackedMap.set($targetObj, {});
      }
      const $tracked = $trackedMap.get($targetObj);
      $tracked[$targetKey] = $tracked[$targetKey] || [];
      $tracked[$targetKey].push({ $sourceKey, $sourceObj });
    };

    const untrack = ($targetObj, $targetKey) => {
      const $tracked = $trackedMap.get($targetObj);
      if (!$tracked || !$tracked[$targetKey]) {
        return;
      }
      $tracked[$targetKey].forEach(({ $sourceObj, $sourceKey }) => {
        const $trackingSource = $trackingMap.get($sourceObj);
        $trackingSource[$sourceKey].get($targetObj).delete($targetKey);
      });
      delete $tracked[$targetKey];
    };

    function triggerInvalidations($sourceObj, $sourceKey) {
      if (!$trackingMap.has($sourceObj)) {
        return;
      }
      const $track = $trackingMap.get($sourceObj);
      if ($track.hasOwnProperty($sourceKey)) {
        $track[$sourceKey].forEach(($targetKeySet, $targetObj) => {
          $targetKeySet.forEach($targetKey => invalidate($targetObj, $targetKey));
        });
      }
      if ($track.hasOwnProperty($wildcard)) {
        $track[$wildcard].forEach(($targetKeySet, $targetObj) => {
          $targetKeySet.forEach($targetKey => invalidate($targetObj, $sourceKey));
        });
      }
    }

    function forObject($targetObj, $targetKey, arg0, arg1, context) {
      $targetObj[$targetKey] = $targetObj[$targetKey] || {};
      if (!$parentObjectMap.has($targetObj[$targetKey])) {
        $parentObjectMap.set($targetObj[$targetKey], $targetObj);
        $parentKeyMap.set($targetObj[$targetKey], $targetKey);
      }
      const invalidKeys = $invalidatedMap.has($targetObj[$targetKey])
        ? $invalidatedMap.get($targetObj[$targetKey])
        : Object.keys(arg1);
      $invalidatedMap.set($targetObj[$targetKey], new Set());
      invalidKeys.forEach(key => {
        arg0(arg1, key, $targetObj[$targetKey], context);
      });
      return $targetObj[$targetKey];
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
    $res.$FUNCNAME = $EXPR;
    $invalidatedRoots.delete('$FUNCNAME');
    /* TRACKING */
    return $res.$FUNCNAME;
  }
}

function mapValues() {
  function $FUNCNAME(src, arg1, acc, context) {
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
  function $FUNCNAME(src, arg1, acc, context) {
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

module.exports = { base, topLevel, mapValues, filterBy };
