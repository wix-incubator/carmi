function library() {
  function toConsumableArray(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    } else {
      return Array.from(arr);
    }
  };
  var $trackingMap = new WeakMap();
  var $trackingWildcards = new WeakMap();
  var $invalidatedMap = new WeakMap();
  var $invalidatedRoots = new Set();
  $invalidatedRoots.$subKeys = {};
  $invalidatedRoots.$parentKey = null;
  $invalidatedRoots.$parent = null;
  $invalidatedRoots.$tracked = {};
  var $first = true;
  var $tainted = new WeakSet();
  $invalidatedMap.set($res, $invalidatedRoots);

  function untrack($targetKeySet, $targetKey) {
    var $tracked = $targetKeySet.$tracked;

    if (!$tracked || !$tracked[$targetKey]) {
      return;
    }

    var $trackedByKey = $tracked[$targetKey];

    for (var i = 0; i < $trackedByKey.length; i += 3) {
      var $trackingSource = $trackingMap.get($trackedByKey[i]);
      $trackingSource[$trackedByKey[i + 1]].delete($trackedByKey[i + 2]);
    }

    delete $tracked[$targetKey];
  }

  function invalidate($targetKeySet, $targetKey) {
    if ($targetKeySet.has($targetKey)) {
      return;
    }

    $targetKeySet.add($targetKey);
    untrack($targetKeySet, $targetKey);

    if ($targetKeySet.$parent) {
      invalidate($targetKeySet.$parent, $targetKeySet.$parentKey);
    }
  }

  function setOnObject($target, $key, $val, $new) {
    var $changed = false;
    var $hard = false;

    if (!$new) {
      if (typeof $target[$key] === 'object' && $target[$key] && $target[$key] !== $val) {
        $hard = true;
      }

      if ($hard || $target[$key] !== $val || $val && typeof $val === 'object' && $tainted.has($val) || !$target.hasOwnProperty($key) && $target[$key] === undefined) {
        $changed = true;
        triggerInvalidations($target, $key, $hard);
      }
    }

    $target[$key] = $val;
  }

  function deleteOnObject($target, $key, $new) {
    var $hard = false;

    if (!$new) {
      if (typeof $target[$key] === 'object' && $target[$key]) {
        $hard = true;
      }

      triggerInvalidations($target, $key, $hard);
      var $invalidatedKeys = $invalidatedMap.get($target);

      if ($invalidatedKeys) {
        delete $invalidatedKeys.$subKeys[$key];
      }
    }

    delete $target[$key];
  }

  function setOnArray($target, $key, $val, $new) {
    var $hard = false;

    if (!$new) {
      if (typeof $target[$key] === 'object' && $target[$key] && $target[$key] !== $val) {
        $hard = true;
      }

      if ($hard || $key >= $target.length || $target[$key] !== $val || $val && typeof $target[$key] === 'object' && $tainted.has($val)) {
        triggerInvalidations($target, $key, $hard);
      }
    }

    $target[$key] = $val;
  }

  function truncateArray($target, newLen) {
    for (var i = newLen; i < $target.length; i++) {
      triggerInvalidations($target, i, true);
    }

    $target.length = newLen;
  }

  function track($target, $sourceObj, $sourceKey, $soft) {
    if (!$trackingMap.has($sourceObj)) {
      $trackingMap.set($sourceObj, {});
    }

    var $track = $trackingMap.get($sourceObj);
    $track[$sourceKey] = $track[$sourceKey] || new Map();
    $track[$sourceKey].set($target, $soft);
    var $tracked = $target[0].$tracked;
    $tracked[$target[1]] = $tracked[$target[1]] || [];
    $tracked[$target[1]].push($sourceObj, $sourceKey, $target);
  }

  function trackPath($target, $path) {
    var $end = $path.length - 2;
    var $current = $path[0];

    for (var i = 0; i <= $end; i++) {
      track($target, $current, $path[i + 1], i !== $end);
      $current = $current[$path[i + 1]];
    }
  }

  function triggerInvalidations($sourceObj, $sourceKey, $hard) {
    $tainted.add($sourceObj);
    var $track = $trackingMap.get($sourceObj);

    if ($track && $track.hasOwnProperty($sourceKey)) {
      $track[$sourceKey].forEach(function ($soft, $target) {
        if (!$soft || $hard) {
          invalidate($target[0], $target[1]);
        }
      });
    }

    if ($trackingWildcards.has($sourceObj)) {
      $trackingWildcards.get($sourceObj).forEach(function ($targetInvalidatedKeys) {
        invalidate($targetInvalidatedKeys, $sourceKey);
      });
    }
  }

  function initOutput($tracked, src, func, createDefaultValue, createCacheValue) {
    var subKeys = $tracked[0].$subKeys;
    var $cachePerTargetKey = subKeys[$tracked[1]] = subKeys[$tracked[1]] || new Map();
    var $cachedByFunc = $cachePerTargetKey.get(func);

    if (!$cachedByFunc) {
      var $resultObj = createDefaultValue();
      var $cacheValue = createCacheValue();

      var _$invalidatedKeys = new Set();

      _$invalidatedKeys.$subKeys = {};
      _$invalidatedKeys.$parentKey = $tracked[1];
      _$invalidatedKeys.$parent = $tracked[0];
      _$invalidatedKeys.$tracked = {};
      $invalidatedMap.set($resultObj, _$invalidatedKeys);
      $cachedByFunc = [null, $resultObj, _$invalidatedKeys, true, $cacheValue];
      $cachePerTargetKey.set(func, $cachedByFunc);
    } else {
      $cachedByFunc[3] = false;
    }

    var $invalidatedKeys = $cachedByFunc[2];
    var $prevSrc = $cachedByFunc[0];

    if ($prevSrc !== src) {
      if ($prevSrc) {
        // prev mapped to a different collection
        $trackingWildcards.get($prevSrc).delete($invalidatedKeys);

        if (Array.isArray($prevSrc)) {
          $prevSrc.forEach(function (_item, index) {
            return $invalidatedKeys.add(index);
          });
        } else {
          Object.keys($prevSrc).forEach(function (key) {
            return $invalidatedKeys.add(key);
          });
        }

        if (Array.isArray(src)) {
          src.forEach(function (_item, index) {
            return $invalidatedKeys.add(index);
          });
        } else {
          Object.keys(src).forEach(function (key) {
            return $invalidatedKeys.add(key);
          });
        }
      }

      if (!$trackingWildcards.has(src)) {
        $trackingWildcards.set(src, new Set());
      }

      $trackingWildcards.get(src).add($invalidatedKeys);
      $cachedByFunc[0] = src;
    }

    return $cachedByFunc;
  }

  var emptyObj = function emptyObj() {
    return {};
  };

  var emptyArr = function emptyArr() {
    return [];
  };

  var nullFunc = function nullFunc() {
    return null;
  };

  function mapValuesOpt($tracked, identifier, func, src, context) {
    var $storage = initOutput($tracked, src, identifier, emptyObj, nullFunc);
    var $out = $storage[1];
    var $invalidatedKeys = $storage[2];
    var $new = $storage[3];
    ($new && Object.keys(src) || $invalidatedKeys).forEach(function (key) {
      if (!src.hasOwnProperty(key)) {
        if ($out.hasOwnProperty(key)) {
          deleteOnObject($out, key, $new);
        }
      } else {
        var res = func([$invalidatedKeys, key], key, src[key], context);
        setOnObject($out, key, res, $new);
      }
    });
    $invalidatedKeys.clear();
    return $out;
  }

  function filterByOpt($tracked, identifier, func, src, context) {
    var $storage = initOutput($tracked, src, identifier, emptyObj, nullFunc);
    var $out = $storage[1];
    var $invalidatedKeys = $storage[2];
    var $new = $storage[3];
    ($new && Object.keys(src) || $invalidatedKeys).forEach(function (key) {
      if (!src.hasOwnProperty(key)) {
        if ($out.hasOwnProperty(key)) {
          deleteOnObject($out, key, $new);
        }
      } else {
        var res = func([$invalidatedKeys, key], key, src[key], context);

        if (res) {
          setOnObject($out, key, src[key], $new);
        } else if ($out.hasOwnProperty(key)) {
          deleteOnObject($out, key, $new);
        }
      }
    });
    $invalidatedKeys.clear();
    return $out;
  }

  function mapOpt($tracked, identifier, func, src, context) {
    var $storage = initOutput($tracked, src, identifier, emptyArr, nullFunc);
    var $out = $storage[1];
    var $invalidatedKeys = $storage[2];
    var $new = $storage[3];

    if ($new) {
      for (var key = 0; key < src.length; key++) {
        var res = func([$invalidatedKeys, key], key, src[key], context);
        setOnArray($out, key, res, $new);
      }
    } else {
      $invalidatedKeys.forEach(function (key) {
        if (key < src.length) {
          var _res = func([$invalidatedKeys, key], key, src[key], context);

          setOnArray($out, key, _res, $new);
        }
      });

      if ($out.length > src.length) {
        truncateArray($out, src.length);
      }
    }

    $invalidatedKeys.clear();
    return $out;
  }

  function recursiveSteps(key, $tracked) {
    var $dependencyMap = this.$dependencyMap,
        $currentStack = this.$currentStack,
        $invalidatedKeys = this.$invalidatedKeys,
        $out = this.$out,
        func = this.func,
        src = this.src,
        context = this.context,
        $new = this.$new;

    if ($currentStack.length > 0) {
      if (!$dependencyMap.has(key)) {
        $dependencyMap.set(key, []);
      }

      $dependencyMap.get(key).push($tracked);
    }

    if ($invalidatedKeys.has(key)) {
      $currentStack.push(key);

      if (Array.isArray($out)) {
        if (key >= src.length) {
          setOnArray($out, key, undefined, $new);
          $out.length = src.length;
        } else {
          var newVal = func([$invalidatedKeys, key], key, src[key], context, this);
          setOnArray($out, key, newVal, $new);
        }
      } else {
        if (!src.hasOwnProperty(key)) {
          if ($out.hasOwnProperty(key)) {
            deleteOnObject($out, key, $new);
          }
        } else {
          var _newVal = func([$invalidatedKeys, key], key, src[key], context, this);

          setOnObject($out, key, _newVal, $new);
        }
      }

      $invalidatedKeys.delete(key);
      $currentStack.pop();
    }

    return $out[key];
  }

  function cascadeRecursiveInvalidations($loop) {
    var $dependencyMap = $loop.$dependencyMap,
        $invalidatedKeys = $loop.$invalidatedKeys;
    $invalidatedKeys.forEach(function (key) {
      if ($dependencyMap.has(key)) {
        $dependencyMap.get(key).forEach(function ($tracked) {
          invalidate($tracked[0], $tracked[1]);
        });
        $dependencyMap.delete(key);
      }
    });
  }

  var recursiveCacheFunc = function recursiveCacheFunc() {
    return {
      $dependencyMap: new Map(),
      $currentStack: [],
      recursiveSteps: recursiveSteps
    };
  };

  function recursiveMapOpt($tracked, identifier, func, src, context) {
    var $storage = initOutput($tracked, src, identifier, emptyArr, recursiveCacheFunc);
    var $out = $storage[1];
    var $invalidatedKeys = $storage[2];
    var $new = $storage[3];
    var $loop = $storage[4];
    $loop.$invalidatedKeys = $invalidatedKeys;
    $loop.$out = $out;
    $loop.context = context;
    $loop.func = func;
    $loop.src = src;
    $loop.$new = $new;

    if ($new) {
      for (var key = 0; key < src.length; key++) {
        $invalidatedKeys.add(key);
      }

      for (var _key = 0; _key < src.length; _key++) {
        $loop.recursiveSteps(_key, [$invalidatedKeys, _key]);
      }
    } else {
      cascadeRecursiveInvalidations($loop);
      $invalidatedKeys.forEach(function (key) {
        $loop.recursiveSteps(key, [$invalidatedKeys, key]);
      });
    }

    $invalidatedKeys.clear();
    return $out;
  }

  function recursiveMapValuesOpt($tracked, identifier, func, src, context) {
    var $storage = initOutput($tracked, src, identifier, emptyObj, recursiveCacheFunc);
    var $out = $storage[1];
    var $invalidatedKeys = $storage[2];
    var $new = $storage[3];
    var $loop = $storage[4];
    $loop.$invalidatedKeys = $invalidatedKeys;
    $loop.$out = $out;
    $loop.context = context;
    $loop.func = func;
    $loop.src = src;
    $loop.$new = $new;

    if ($new) {
      Object.keys(src).forEach(function (key) {
        return $invalidatedKeys.add(key);
      });
      Object.keys(src).forEach(function (key) {
        return $loop.recursiveSteps(key, $invalidatedKeys, key);
      });
    } else {
      cascadeRecursiveInvalidations($loop);
      $invalidatedKeys.forEach(function (key) {
        $loop.recursiveSteps(key, $invalidatedKeys, key);
      });
    }

    $invalidatedKeys.clear();
    return $out;
  }

  function keyByOpt($tracked, identifier, func, src, context) {
    var $storage = initOutput($tracked, src, identifier, emptyObj, emptyArr);
    var $out = $storage[1];
    var $invalidatedKeys = $storage[2];
    var $new = $storage[3];
    var $cache = $storage[4];

    if ($new) {
      $cache.indexToKey = [];
      $cache.keyToIndices = {};

      for (var index = 0; index < src.length; index++) {
        var key = '' + func([$invalidatedKeys, index], index, src[index], context);
        $cache.indexToKey[index] = key;
        $cache.keyToIndices[key] = $cache.keyToIndices[key] || new Set();
        $cache.keyToIndices[key].add(index);
        setOnObject($out, key, src[index], $new);
      }
    } else {
      var keysPendingDelete = new Set();
      $invalidatedKeys.forEach(function (index) {
        if (index < $cache.indexToKey.length) {
          var _key2 = $cache.indexToKey[index];

          $cache.keyToIndices[_key2].delete(index);

          if ($cache.keyToIndices[_key2].size === 0) {
            delete $cache.keyToIndices[_key2];
            keysPendingDelete.add(_key2);
          }
        }
      });
      $invalidatedKeys.forEach(function (index) {
        if (index < src.length) {
          var _key3 = '' + func([$invalidatedKeys, index], index, src[index], context);

          $cache.indexToKey[index] = _key3;
          keysPendingDelete.delete(_key3);
          $cache.keyToIndices[_key3] = $cache.keyToIndices[_key3] || new Set();

          $cache.keyToIndices[_key3].add(index);

          setOnObject($out, _key3, src[index], $new);
        }
      });
      keysPendingDelete.forEach(function (key) {
        deleteOnObject($out, key, $new);
      });
    }

    $cache.indexToKey.length = src.length;
    $invalidatedKeys.clear();
    return $out;
  }

  function mapKeysOpt($tracked, identifier, func, src, context) {
    var $storage = initOutput($tracked, src, identifier, emptyObj, emptyObj);
    var $out = $storage[1];
    var $invalidatedKeys = $storage[2];
    var $new = $storage[3];
    var $keyToKey = $storage[4];

    if ($new) {
      Object.keys(src).forEach(function (key) {
        var newKey = func([$invalidatedKeys, key], key, src[key], context);
        setOnObject($out, newKey, src[key], $new);
        $keyToKey[key] = newKey;
      });
    } else {
      var keysPendingDelete = new Set();
      $invalidatedKeys.forEach(function (key) {
        if ($keyToKey.hasOwnProperty(key)) {
          keysPendingDelete.add($keyToKey[key]);
          delete $keyToKey[key];
        }
      });
      $invalidatedKeys.forEach(function (key) {
        if (src.hasOwnProperty(key)) {
          var newKey = func([$invalidatedKeys, key], key, src[key], context);
          setOnObject($out, newKey, src[key], $new);
          $keyToKey[key] = newKey;
          keysPendingDelete.delete(newKey);
        }
      });
      keysPendingDelete.forEach(function (key) {
        deleteOnObject($out, key, $new);
      });
    }

    $invalidatedKeys.clear();
    return $out;
  }

  var filterCacheFunc = function filterCacheFunc() {
    return [0];
  };

  function filterOpt($tracked, identifier, func, src, context) {
    var $storage = initOutput($tracked, src, identifier, emptyArr, filterCacheFunc);
    var $out = $storage[1];
    var $invalidatedKeys = $storage[2];
    var $new = $storage[3];
    var $idxToIdx = $storage[4];

    if ($new) {
      for (var key = 0; key < src.length; key++) {
        var passed = !!func([$invalidatedKeys, key], key, src[key], context);
        var prevItemIdx = $idxToIdx[key];
        var nextItemIdx = passed ? prevItemIdx + 1 : prevItemIdx;
        $idxToIdx[key + 1] = nextItemIdx;

        if (nextItemIdx !== prevItemIdx) {
          setOnArray($out, prevItemIdx, src[key], $new);
        }
      }
    } else {
      var firstIndex = Number.MAX_SAFE_INTEGER;
      $invalidatedKeys.forEach(function (key) {
        return firstIndex = Math.min(firstIndex, key);
      });

      for (var _key4 = firstIndex; _key4 < src.length; _key4++) {
        var _passed = !!func([$invalidatedKeys, _key4], _key4, src[_key4], context);

        var _prevItemIdx = $idxToIdx[_key4];

        var _nextItemIdx = _passed ? _prevItemIdx + 1 : _prevItemIdx;

        $idxToIdx[_key4 + 1] = _nextItemIdx;

        if (_nextItemIdx !== _prevItemIdx) {
          setOnArray($out, _prevItemIdx, src[_key4], $new);
        }
      }

      $idxToIdx.length = src.length + 1;
      truncateArray($out, $idxToIdx[$idxToIdx.length - 1]);
    }

    $invalidatedKeys.clear();
    return $out;
  }

  function anyOpt($tracked, identifier, func, src, context) {
    var $storage = initOutput($tracked, src, identifier, emptyArr, nullFunc);
    var $out = $storage[1];
    var $invalidatedKeys = $storage[2];
    var $new = $storage[3]; // $out has at most 1 key - the one that stopped the previous run because it was truthy

    if ($new) {
      for (var key = 0; key < src.length; key++) {
        $invalidatedKeys.add(key);
      }
    }

    var $prevStop = $out.length > 0 ? $out[0] : -1;

    if ($prevStop >= 0 && $prevStop < src.length) {
      if ($invalidatedKeys.has($prevStop)) {
        $invalidatedKeys.delete($prevStop);
        var passedTest = func([$invalidatedKeys, $prevStop], $prevStop, src[$prevStop], context);

        if (!passedTest) {
          $out.length = 0;
        }
      }
    } else {
      $out.length = 0;
    }

    if ($out.length === 0) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = $invalidatedKeys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _key5 = _step.value;
          $invalidatedKeys.delete(_key5);

          if (_key5 >= 0 && _key5 < src.length) {
            var match = func([$invalidatedKeys, _key5], _key5, src[_key5], context);

            if (match) {
              $out[0] = _key5;
              break;
            }
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }

    return $out.length === 1;
  }

  function anyValuesOpt($tracked, identifier, func, src, context) {
    var $storage = initOutput($tracked, src, identifier, emptyArr, nullFunc);
    var $out = $storage[1];
    var $invalidatedKeys = $storage[2];
    var $new = $storage[3]; // $out has at most 1 key - the one that stopped the previous run because it was truthy

    if ($new) {
      Object.keys(src).forEach(function (key) {
        return $invalidatedKeys.add(key);
      });
    }

    var $prevStop = $out.length > 0 ? $out[0] : null;

    if ($prevStop !== null && src.hasOwnProperty($prevStop)) {
      if ($invalidatedKeys.has($prevStop)) {
        $invalidatedKeys.delete($prevStop);
        var passedTest = func([$invalidatedKeys, $prevStop], $prevStop, src[$prevStop], context);

        if (!passedTest) {
          $out.length = 0;
        }
      }
    } else {
      $out.length = 0;
    }

    if ($out.length === 0) {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = $invalidatedKeys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var key = _step2.value;
          $invalidatedKeys.delete(key);

          if (src.hasOwnProperty(key)) {
            var match = func([$invalidatedKeys, key], key, src[key], context);

            if (match) {
              $out[0] = key;
              break;
            }
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }

    return $out.length === 1;
  }

  function groupByOpt($tracked, identifier, func, src, context) {
    var $storage = initOutput($tracked, src, identifier, emptyObj, emptyObj);
    var $out = $storage[1];
    var $invalidatedKeys = $storage[2];
    var $new = $storage[3];
    var $keyToKey = $storage[4];

    if (Array.isArray(src)) {
      throw new Error('groupBy only works on objects');
    }

    if ($new) {
      Object.keys(src).forEach(function (key) {
        var res = '' + func([$invalidatedKeys, key], key, src[key], context);
        $keyToKey[key] = res;

        if (!$out[res]) {
          setOnObject($out, res, {}, $new);
        }

        setOnObject($out[res], key, src[key], $new);
      });
    } else {
      var keysPendingDelete = {};
      $invalidatedKeys.forEach(function (key) {
        if ($keyToKey[key]) {
          keysPendingDelete[$keyToKey[key]] = keysPendingDelete[$keyToKey[key]] || new Set();
          keysPendingDelete[$keyToKey[key]].add(key);
        }
      });
      $invalidatedKeys.forEach(function (key) {
        if (!src.hasOwnProperty(key)) {
          delete $keyToKey[key];
          return;
        }

        var res = '' + func([$invalidatedKeys, key], key, src[key], context);
        $keyToKey[key] = res;

        if (!$out[res]) {
          $out[res] = {};
        }

        setOnObject($out[res], key, src[key], $new);
        setOnObject($out, res, $out[res], $new);

        if (keysPendingDelete.hasOwnProperty(res)) {
          keysPendingDelete[res].delete(key);
        }
      });
      Object.keys(keysPendingDelete).forEach(function (res) {
        if (keysPendingDelete[res].size > 0) {
          keysPendingDelete[res].forEach(function (key) {
            deleteOnObject($out[res], key, $new);
          });

          if (Object.keys($out[res]).length === 0) {
            deleteOnObject($out, res, $new);
          } else {
            setOnObject($out, res, $out[res], $new);
          }
        }
      });
    }

    $invalidatedKeys.clear();
    return $out;
  }

  var valuesOrKeysCacheFunc = function valuesOrKeysCacheFunc() {
    return {
      $keyToIdx: {},
      $idxToKey: []
    };
  };

  function valuesOpt($tracked, src, identifier) {
    var $storage = initOutput($tracked, src, identifier, emptyArr, valuesOrKeysCacheFunc);
    var $out = $storage[1];
    var $invalidatedKeys = $storage[2];
    var $new = $storage[3];
    var _$storage$ = $storage[4],
        $keyToIdx = _$storage$.$keyToIdx,
        $idxToKey = _$storage$.$idxToKey;

    if ($new) {
      Object.keys(src).forEach(function (key, idx) {
        $out[idx] = src[key];
        $idxToKey[idx] = key;
        $keyToIdx[key] = idx;
      });
    } else {
      var $deletedKeys = [];
      var $addedKeys = [];
      var $touchedKeys = [];
      $invalidatedKeys.forEach(function (key) {
        if (src.hasOwnProperty(key) && !$keyToIdx.hasOwnProperty(key)) {
          $addedKeys.push(key);
        } else if (!src.hasOwnProperty(key) && $keyToIdx.hasOwnProperty(key)) {
          $deletedKeys.push(key);
        } else {
          if ($keyToIdx.hasOwnProperty(key)) {
            setOnObject($out, $keyToIdx[key], src[key], $new);
          }
        }
      });

      if ($addedKeys.length < $deletedKeys.length) {
        $deletedKeys.sort(function (a, b) {
          return $keyToIdx[a] - $keyToIdx[b];
        });
      }

      var $finalOutLength = $out.length - $deletedKeys.length + $addedKeys.length; // keys both deleted and added fill created holes first

      for (var i = 0; i < $addedKeys.length && i < $deletedKeys.length; i++) {
        var $addedKey = $addedKeys[i];
        var $deletedKey = $deletedKeys[i];
        var $newIdx = $keyToIdx[$deletedKey];
        delete $keyToIdx[$deletedKey];
        $keyToIdx[$addedKey] = $newIdx;
        $idxToKey[$newIdx] = $addedKey;
        setOnArray($out, $newIdx, src[$addedKey], $new);
      } // more keys added - append to end


      for (var _i = $deletedKeys.length; _i < $addedKeys.length; _i++) {
        var _$addedKey = $addedKeys[_i];
        var _$newIdx = $out.length;
        $keyToIdx[_$addedKey] = _$newIdx;
        $idxToKey[_$newIdx] = _$addedKey;
        setOnArray($out, _$newIdx, src[_$addedKey], $new);
      } // more keys deleted - move non deleted items at the tail to the location of deleted


      var $deletedNotMoved = $deletedKeys.slice($addedKeys.length);
      var $deletedNotMovedSet = new Set($deletedKeys.slice($addedKeys.length));
      var $keysToMoveInside = new Set($idxToKey.slice($finalOutLength).filter(function (key) {
        return !$deletedNotMovedSet.has(key);
      }));
      var $savedCount = 0;

      for (var $tailIdx = $finalOutLength; $tailIdx < $out.length; $tailIdx++) {
        var $currentKey = $idxToKey[$tailIdx];

        if ($keysToMoveInside.has($currentKey)) {
          // need to move this key to one of the pending delete
          var $switchedWithDeletedKey = $deletedNotMoved[$savedCount];
          var _$newIdx2 = $keyToIdx[$switchedWithDeletedKey];
          setOnArray($out, _$newIdx2, src[$currentKey], $new);
          $keyToIdx[$currentKey] = _$newIdx2;
          $idxToKey[_$newIdx2] = $currentKey;
          delete $keyToIdx[$switchedWithDeletedKey];
          $savedCount++;
        } else {
          delete $keyToIdx[$currentKey];
        }
      }

      truncateArray($out, $finalOutLength);
      $idxToKey.length = $out.length;
      $invalidatedKeys.clear();
    }

    return $out;
  }

  function keysOpt($tracked, src, identifier) {
    var $storage = initOutput($tracked, src, identifier, emptyArr, valuesOrKeysCacheFunc);
    var $out = $storage[1];
    var $invalidatedKeys = $storage[2];
    var $new = $storage[3];
    var _$storage$2 = $storage[4],
        $keyToIdx = _$storage$2.$keyToIdx,
        $idxToKey = _$storage$2.$idxToKey;

    if ($new) {
      Object.keys(src).forEach(function (key, idx) {
        $out[idx] = key;
        $idxToKey[idx] = key;
        $keyToIdx[key] = idx;
      });
    } else {
      var $deletedKeys = [];
      var $addedKeys = [];
      var $touchedKeys = [];
      $invalidatedKeys.forEach(function (key) {
        if (src.hasOwnProperty(key) && !$keyToIdx.hasOwnProperty(key)) {
          $addedKeys.push(key);
        } else if (!src.hasOwnProperty(key) && $keyToIdx.hasOwnProperty(key)) {
          $deletedKeys.push(key);
        } else {
          if ($keyToIdx.hasOwnProperty(key)) {
            setOnObject($out, $keyToIdx[key], key, $new);
          }
        }
      });

      if ($addedKeys.length < $deletedKeys.length) {
        $deletedKeys.sort(function (a, b) {
          return $keyToIdx[a] - $keyToIdx[b];
        });
      }

      var $finalOutLength = $out.length - $deletedKeys.length + $addedKeys.length; // keys both deleted and added fill created holes first

      for (var i = 0; i < $addedKeys.length && i < $deletedKeys.length; i++) {
        var $addedKey = $addedKeys[i];
        var $deletedKey = $deletedKeys[i];
        var $newIdx = $keyToIdx[$deletedKey];
        delete $keyToIdx[$deletedKey];
        $keyToIdx[$addedKey] = $newIdx;
        $idxToKey[$newIdx] = $addedKey;
        setOnArray($out, $newIdx, $addedKey, $new);
      } // more keys added - append to end


      for (var _i2 = $deletedKeys.length; _i2 < $addedKeys.length; _i2++) {
        var _$addedKey2 = $addedKeys[_i2];
        var _$newIdx3 = $out.length;
        $keyToIdx[_$addedKey2] = _$newIdx3;
        $idxToKey[_$newIdx3] = _$addedKey2;
        setOnArray($out, _$newIdx3, _$addedKey2, $new);
      } // more keys deleted - move non deleted items at the tail to the location of deleted


      var $deletedNotMoved = $deletedKeys.slice($addedKeys.length);
      var $deletedNotMovedSet = new Set($deletedKeys.slice($addedKeys.length));
      var $keysToMoveInside = new Set($idxToKey.slice($finalOutLength).filter(function (key) {
        return !$deletedNotMovedSet.has(key);
      }));
      var $savedCount = 0;

      for (var $tailIdx = $finalOutLength; $tailIdx < $out.length; $tailIdx++) {
        var $currentKey = $idxToKey[$tailIdx];

        if ($keysToMoveInside.has($currentKey)) {
          // need to move this key to one of the pending delete
          var $switchedWithDeletedKey = $deletedNotMoved[$savedCount];
          var _$newIdx4 = $keyToIdx[$switchedWithDeletedKey];
          setOnArray($out, _$newIdx4, $currentKey, $new);
          $keyToIdx[$currentKey] = _$newIdx4;
          $idxToKey[_$newIdx4] = $currentKey;
          delete $keyToIdx[$switchedWithDeletedKey];
          $savedCount++;
        } else {
          delete $keyToIdx[$currentKey];
        }
      }

      truncateArray($out, $finalOutLength);
      $idxToKey.length = $out.length;
      $invalidatedKeys.clear();
    }

    return $out;
  }

  function getEmptyArray($tracked, token) {
    var subKeys = $tracked[0].$subKeys;
    var $cachePerTargetKey = subKeys[$tracked[1]] = subKeys[$tracked[1]] || new Map();

    if (!$cachePerTargetKey.has(token)) {
      $cachePerTargetKey.set(token, []);
    }

    return $cachePerTargetKey.get(token);
  }

  function getEmptyObject($tracked, token) {
    var subKeys = $tracked[0].$subKeys;
    var $cachePerTargetKey = subKeys[$tracked[1]] = subKeys[$tracked[1]] || new Map();

    if (!$cachePerTargetKey.has(token)) {
      $cachePerTargetKey.set(token, {});
    }

    return $cachePerTargetKey.get(token);
  }

  function array($tracked, newVal, identifier, len) {
    var res = getEmptyArray($tracked, identifier);
    var $new = res.length === 0;

    for (var i = 0; i < len; i++) {
      setOnArray(res, i, newVal[i], $new);
    }

    return res;
  }

  function object($tracked, valsList, identifier, keysList) {
    var res = getEmptyObject($tracked, identifier);
    var $new = keysList.length && !res.hasOwnProperty(keysList[0]);

    for (var i = 0; i < keysList.length; i++) {
      var name = keysList[i];
      setOnObject(res, name, valsList[i], $new);
    }

    return res;
  }

  function call($tracked, newVal, identifier, len) {
    var arr = getEmptyArray($tracked, identifier);
    var $new = arr.length === 0;

    if ($new) {
      arr.push([]);
    }

    var args = arr[0];

    for (var i = 0; i < len; i++) {
      setOnArray(args, i, newVal[i], $new);
    }

    if (arr.length === 1 || $tainted.has(args)) {
      arr[1] = $funcLib[args[0]].apply($res, args.slice(1));
    }

    return arr[1];
  }

  function bind($tracked, newVal, identifier, len) {
    var arr = getEmptyArray($tracked, identifier);

    if (arr.length === 0) {
      arr.push([]);
    }

    var args = arr[0];

    for (var i = 0; i < len; i++) {
      args[i] = newVal[i];
    }

    if (arr.length === 1) {
      arr[1] = function () {
        var fn = $funcLibRaw[args[0]] || $res[args[0]];

        for (var _len = arguments.length, extraArgs = new Array(_len), _key6 = 0; _key6 < _len; _key6++) {
          extraArgs[_key6] = arguments[_key6];
        }

        return fn.apply($res, args.slice(1).concat(extraArgs));
      };
    }

    return arr[1];
  }

  function assignOpt($tracked, src, identifier) {
    var $storage = initOutput($tracked, src, identifier, emptyObj, nullFunc);
    var $out = $storage[1];
    var $invalidatedKeys = $storage[2];
    var $new = $storage[3];

    if ($new) {
      Object.assign.apply(Object, [$out].concat(toConsumableArray(src)));
    } else {
      var res = Object.assign.apply(Object, [{}].concat(toConsumableArray(src)));
      Object.keys(res).forEach(function (key) {
        setOnObject($out, key, res[key], $new);
      });
      Object.keys($out).forEach(function (key) {
        if (!res.hasOwnProperty(key)) {
          deleteOnObject($out, key, $new);
        }
      });
      $invalidatedKeys.clear();
    }

    return $out;
  }

  function defaultsOpt($tracked, src, identifier) {
    var $storage = initOutput($tracked, src, identifier, emptyObj, nullFunc);
    var $out = $storage[1];
    var $invalidatedKeys = $storage[2];
    var $new = $storage[3];
    src = toConsumableArray(src).reverse();

    if ($new) {
      Object.assign.apply(Object, [$out].concat(toConsumableArray(src)));
    } else {
      var res = Object.assign.apply(Object, [{}].concat(toConsumableArray(src)));
      Object.keys(res).forEach(function (key) {
        setOnObject($out, key, res[key], $new);
      });
      Object.keys($out).forEach(function (key) {
        if (!res.hasOwnProperty(key)) {
          deleteOnObject($out, key, $new);
        }
      });
      $invalidatedKeys.clear();
    }

    return $out;
  }

  function flattenOpt($tracked, src, identifier) {
    var $storage = initOutput($tracked, src, identifier, emptyArr, emptyArr);
    var $out = $storage[1];
    var $invalidatedKeys = $storage[2];
    var $new = $storage[3];
    var $cache = $storage[4];
    var length = src.length;
    var initialLength = $out.length;

    if ($new) {
      for (var pos = 0, i = 0; i < length; i += 1) {
        $cache[i] = src[i].length;

        for (var j = 0; j < $cache[i]; j += 1) {
          $out[pos + j] = src[i][j];
        }

        pos += $cache[i];
      }
    } else {
      (function () {
        var pos = 0;

        for (var key = 0; key < length; key += 1) {
          var partLen = src[key].length;

          if ($invalidatedKeys.has(key)) {
            if ($cache[key] && $cache[key] === partLen) {
              src[key].forEach(function (value, index) {
                return setOnArray($out, pos + index, value, $new);
              });
              pos += $cache[key];
            } else {
              for (; key < length; key += 1) {
                partLen = src[key].length;
                src[key].forEach(function (value, index) {
                  return setOnArray($out, pos + index, value, $new);
                });
                $cache[key] = partLen;
                pos += partLen;
              }
            }
          } else {
            pos += partLen;
          }
        }

        $invalidatedKeys.clear();
        initialLength !== pos && truncateArray($out, pos);
      })();
    }

    return $out;
  }

  function sizeOpt($tracked, src, identifier) {
    var $storage = initOutput($tracked, src, identifier, emptyArr, nullFunc);
    var $out = $storage[1];
    var $invalidatedKeys = $storage[2];
    var $new = $storage[3];

    if ($new) {
      $out[0] = Array.isArray(src) ? src.length : Object.keys(src).length;
    }

    if (!$new) {
      $out[0] = Array.isArray(src) ? src.length : Object.keys(src).length;
      $invalidatedKeys.clear();
    }

    return $out[0];
  }

  function sumOpt($tracked, src, identifier) {
    var $storage = initOutput($tracked, src, identifier, emptyArr, emptyArr);
    var $out = $storage[1];
    var $invalidatedKeys = $storage[2];
    var $new = $storage[3];
    var $cache = $storage[4];
    var length = src.length;

    if ($new) {
      $cache[0] = 0;
      $cache[1] = [];

      for (var i = 0; i < length; i++) {
        $cache[0] += src[i];
        $cache[1][i] = src[i];
      }
    } else {
      $invalidatedKeys.forEach(function (key) {
        var cached = $cache[1][key] || 0;
        var live = src[key] || 0;
        $cache[0] = $cache[0] - cached + live;
        $cache[1][key] = live;
      });
      $cache[1].length = length;
      $invalidatedKeys.clear();
    }

    $out[0] = $cache[0];
    return $out[0];
  }

  function range($tracked, end, start, step, identifier) {
    var $out = getEmptyArray($tracked, identifier);
    var res;

    if ($out.length === 0) {
      res = [];
      $out.push(res);

      for (var val = start; step > 0 && val < end || step < 0 && val > end; val += step) {
        res.push(val);
      }
    } else {
      var len = 0;
      res = $out[0];

      for (var _val = start; step > 0 && _val < end || step < 0 && _val > end; _val += step) {
        setOnArray(res, len, _val, false);
        len++;
      }

      if (res.length > len) {
        truncateArray(res, len);
      }
    }

    return res;
  }

  function invalidatePath(path) {
    path.forEach(function (part, index) {
      triggerInvalidations(getAssignableObject(path, index), part, index === path.length - 1);
    });
  }

  function set(path, value) {
    ensurePath(path);
    invalidatePath(path);
    applySetter(getAssignableObject(path, path.length - 1), path[path.length - 1], value);
  }

  function splice(pathWithKey, len) {
    ensurePath(pathWithKey);
    var key = pathWithKey[pathWithKey.length - 1];
    var path = pathWithKey.slice(0, pathWithKey.length - 1);
    var arr = getAssignableObject(path, path.length);
    var origLength = arr.length;

    for (var _len2 = arguments.length, newItems = new Array(_len2 > 2 ? _len2 - 2 : 0), _key7 = 2; _key7 < _len2; _key7++) {
      newItems[_key7 - 2] = arguments[_key7];
    }

    var end = len === newItems.length ? key + len : Math.max(origLength, origLength + newItems.length - len);

    for (var i = key; i < end; i++) {
      triggerInvalidations(arr, i, true);
    }

    invalidatePath(pathWithKey);
    arr.splice.apply(arr, [key, len].concat(newItems));
  }
}

function topLevel() {
  function $$FUNCNAMEBuild($tracked) {
    /* PRETRACKING */

    /* TYPE_CHECK */
    var newValue = $EXPR;
    /* TRACKING */

    return newValue;
  }
}

function object() {
  var $FUNCNAMEArgs = [
    /*ARGS*/
  ];
}

function array() {}

function func() {
  function $FUNCNAME($tracked, key, val, context) {
    /* PRETRACKING */
    var res = $EXPR1;
    /* TRACKING */

    return res;
  }
}

function recursiveFunc() {
  function $FUNCNAME($tracked, key, val, context, loop) {
    /* PRETRACKING */
    var res = $EXPR1;
    /* TRACKING */

    return res;
  }
}

function helperFunc() {
  function $ROOTNAME($tracked$FN_ARGS) {
    /* PRETRACKING */
    var res = $EXPR1;
    /* TRACKING */

    return res;
  }
}

var base = require('./naive').base;

function updateDerived() {
  var builderFunctions = [
    /*BUILDER_FUNCS*/
  ];
  var builderNames = [
    /*BUILDER_NAMES*/
  ];

  function updateDerived() {
    for (var i = 0; i < $COUNT_GETTERS; i++) {
      if ($first || $invalidatedRoots.has(i)) {
        var newValue = builderFunctions[i]([$invalidatedRoots, i]);
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
  base: base,
  library: library,
  topLevel: topLevel,
  updateDerived: updateDerived,
  recursiveMap: recursiveFunc,
  recursiveMapValues: recursiveFunc,
  helperFunc: helperFunc,
  object: object,
  array: array,
  func: func
};
