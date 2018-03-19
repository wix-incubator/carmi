function base() {
  function $NAME($model) {
    'use strict';
    const $res = { $model };
    const $trackingMap = new WeakMap();
    const $trackedMap = new WeakMap();
    const $invalidatedMap = new WeakMap();
    const $parentMap = new WeakMap();
    const $invalidatedRoots = new Set();
    $invalidatedMap.set($res, $invalidatedRoots);

    const invalidate = ($targetObj, $targetKey) => {
      if (!$targetObj) {
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
      if ($parentMap.has($targetObj)) {
        const $parentData = $parentMap.get($targetObj);
        invalidate($parentData.$targetObj, $parentData.$targetKey);
      }
    };

    const track = ($targetObj, $targetKey, $sourceObj, $sourceKey) => {
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
      if (!$track.hasOwnProperty($sourceKey)) {
        return;
      }
      $track[$sourceKey].forEach(($targetKeySet, $targetObj) => {
        $targetKeySet.forEach($targetKey => invalidate($targetObj, $targetKey));
      });
    }

    function forObject($targetObj, $targetKey, arg0, arg1) {
      $targetObj[$targetKey] = $targetObj[$targetKey] || {};
      if (!$parentMap.has($targetObj[$targetKey])) {
        $parentMap.set($targetObj[$targetKey], { $targetObj, $targetKey });
      }
      const invalidKeys = $invalidatedMap.has($targetObj[$targetKey])
        ? $invalidatedMap.get($targetObj[$targetKey])
        : Object.keys(arg1);
      $invalidatedMap.set($targetObj[$targetKey], new Set());
      invalidKeys.forEach(key => {
        arg0(arg1, key, $targetObj[$targetKey]);
      });
      return $targetObj[$targetKey];
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
  function $FUNCNAME(src, arg1, acc) {
    let $changed = false;
    /* PRETRACKING */
    const arg0 = src[arg1];
    if (!src.hasOwnProperty(arg1) && acc.hasOwnProperty(arg1)) {
      delete acc[arg1];
      $changed = true;
    } else {
      const res = $EXPR1;
      $changed = res !== acc[arg1];
      acc[arg1] = res;
    }
    /* TRACKING */
  }
}

function filterBy() {
  function $FUNCNAME(src, arg1, acc) {
    let $changed = false;
    /* PRETRACKING */
    const arg0 = src[arg1];
    if (!src.hasOwnProperty(arg1) && acc.hasOwnProperty(arg1)) {
      delete acc[arg1];
      $changed = true;
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
