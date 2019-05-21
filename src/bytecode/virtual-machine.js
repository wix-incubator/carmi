const {
  $numberInline,
  $booleanInline,
  $stringRef,
  $numberRef,
  $expressionRef,
  $condRef,
  $root,
  $topLevel,
  $loop,
  $context,
  $val,
  $key,
  $arg0,
  $arg1,
  $arg2,
  $arg3,
  $arg4,
  $arg5,
  $arg6,
  $arg7,
  $arg8,
  $arg9,
  $null,
  Verbs,
  VerbsCount,
  $setter,
  $push,
  $splice,
  setterTypesCount
} = require('./bytecode-enums');

const bytecodeFunctions = require('./bytecode-functions');

const LengthMask = (1 << 16) - 1;
const BUFFERS_COUNT = 7;

const unimplementedVerb = () => {};
const verbFuncs = new Array(VerbsCount).fill(unimplementedVerb);
Object.keys(Verbs).forEach(v => {
  if (bytecodeFunctions[v]) {
    verbFuncs[Verbs[v]] = bytecodeFunctions[v];
  }
});

verbFuncs[Verbs.$parseInt] = function $parseInt($offset, $length) {
  this.processValue(this.$expressions[++$offset]);
  let radix = 10;
  if ($length > 2) {
    this.processValue(this.$expressions[++$offset]);
    radix = this.$stack.pop();
  }
  this.$stack.push(parseInt(this.$stack.pop(), radix));
};

verbFuncs[Verbs.$and] = function $and($offset, $length) {
  for (let i = 1; i < $length; i++) {
    this.processValue(this.$expressions[$offset + i]);
    if (i === $length - 1 || !this.$stack[this.$stack.length - 1]) {
      this.$conds[this.$conds.length - 1].set($offset, i);
      break;
    } else {
      this.$stack.pop();
    }
  }
};

verbFuncs[Verbs.$or] = function $or($offset, $length) {
  for (let i = 1; i < $length; i++) {
    this.processValue(this.$expressions[$offset + i]);
    if (i === $length - 1 || this.$stack[this.$stack.length - 1]) {
      this.$conds[this.$conds.length - 1].set($offset, i);
      break;
    } else {
      this.$stack.pop();
    }
  }
};

verbFuncs[Verbs.$ternary] = function $ternary($offset, $length) {
  this.processValue(this.$expressions[$offset + 1]);
  if (this.$stack.pop()) {
    this.$conds[this.$conds.length - 1].set($offset, 2);
    this.processValue(this.$expressions[$offset + 2]);
  } else {
    this.$conds[this.$conds.length - 1].set($offset, 3);
    this.processValue(this.$expressions[$offset + 3]);
  }
};

verbFuncs[Verbs.$func] = function $func($offset, $length) {
  this.$conds.push(new Map());
  this.processValue(this.$expressions[$offset + 1]);
  this.processValue(this.$expressions[$offset + 2]);
  this.$conds.pop();
  this.$keys.pop();
};

const recursiveCacheFunc = () => new Map();

const emptyObj = () => ({});
const emptyArr = () => [];

verbFuncs[Verbs.$recursiveMapValues] = function $recursiveMapValues($offset, $length) {
  this.$functions.push(this.$expressions[++$offset]);
  this.processValue(this.$expressions[++$offset]);
  const src = this.$stack.pop();
  this.$collections.push(src);

  if ($length === 3) {
    this.$contexts.push(null);
  } else {
    this.processValue(this.$expressions[++$offset]);
    const contextArray = this.getEmptyArray($offset - $length);
    if (contextArray.length) {
      this.setOnArray(contextArray, 0, this.$stack.pop(), false);
    } else {
      contextArray[0] = this.$stack.pop();
    }
    this.$contexts.push(contextArray);
  }

  const $storage = this.initOutput($offset, emptyObj, recursiveCacheFunc);
  const $out = $storage[1];
  const $invalidatedKeys = $storage[2];
  const $new = $storage[3];
  const $dependencyMap = $storage[4];
  if ($new) {
    Object.keys(src).forEach(key => $invalidatedKeys.add(key));
    Object.keys(src).forEach(key => {
      this.$keys.push(key);
      this.collectionRecursiveFunction();
      this.$stack.pop();
    });
  } else {
    this.cascadeRecursiveInvalidations($invalidatedKeys, $dependencyMap);
    $invalidatedKeys.forEach(key => {
      this.$keys.push(key);
      this.collectionRecursiveFunction();
      this.$stack.pop();
    });
  }
  $invalidatedKeys.clear();
  this.$stack.push($out);
  this.$functions.pop();
  this.$collections.pop();
  this.$currentSets.pop();
  this.$contexts.pop();
};

verbFuncs[Verbs.$recursiveMap] = function $recursiveMap($offset, $length) {
  this.$functions.push(this.$expressions[++$offset]);
  this.processValue(this.$expressions[++$offset]);
  const src = this.$stack.pop();
  this.$collections.push(src);

  if ($length === 3) {
    this.$contexts.push(null);
  } else {
    this.processValue(this.$expressions[++$offset]);
    const contextArray = this.getEmptyArray($offset - $length);
    if (contextArray.length) {
      this.setOnArray(contextArray, 0, this.$stack.pop(), false);
    } else {
      contextArray[0] = this.$stack.pop();
    }
    this.$contexts.push(contextArray);
  }

  const $storage = this.initOutput($offset, emptyArr, recursiveCacheFunc);
  const $out = $storage[1];
  const $invalidatedKeys = $storage[2];
  const $new = $storage[3];
  const $dependencyMap = $storage[4];
  if ($new) {
    for (let key = 0; key < src.length; key++) {
      $invalidatedKeys.add(key);
    }
    for (let key = 0; key < src.length; key++) {
      this.$keys.push(key);
      this.collectionRecursiveFunction();
      this.$stack.pop();
    }
  } else {
    this.cascadeRecursiveInvalidations($invalidatedKeys, $dependencyMap);
    $invalidatedKeys.forEach(key => {
      this.$keys.push(key);
      this.collectionRecursiveFunction();
      this.$stack.pop();
    });
  }
  $invalidatedKeys.clear();
  this.$stack.push($out);
  this.$functions.pop();
  this.$collections.pop();
  this.$currentSets.pop();
  this.$contexts.pop();
};

verbFuncs[Verbs.$recur] = function $recur($offset, $length) {
  this.processValue(this.$expressions[++$offset]);
  const stackDepth = this.$stack.pop();
  this.processValue(this.$expressions[++$offset]);
  const nextKey = this.$stack.pop();
  const prevKey = this.$keys[stackDepth];
  const $invalidatedKeys = this.$currentSets[stackDepth];
  const $dependencyMap = $invalidatedKeys.$cache[4];
  if (!$dependencyMap.has(nextKey)) {
    $dependencyMap.set(nextKey, []);
  }
  $dependencyMap.get(nextKey).push([this.$currentSets[this.$currentSets.length - 1], this.$keys[this.$keys.length - 1]]);

  this.$functions.push(this.$functions[stackDepth - 1]);
  this.$collections.push(this.$collections[stackDepth - 1]);
  this.$contexts.push(this.$contexts[stackDepth - 1]);
  this.$currentSets.push($invalidatedKeys);
  this.$keys.push(nextKey);
  this.collectionRecursiveFunction();
  this.$functions.pop();
  this.$collections.pop();
  this.$currentSets.pop();
  this.$contexts.pop();
};

verbFuncs[Verbs.$trackPath] = function $trackPath($offset, $length) {
  let $tracked = null;
  for (let i = 1; i < $length; i += 2) {
    if (!$tracked) {
      $tracked = [this.$currentSets[this.$currentSets.length - 1], this.$keys[this.$keys.length - 1]];
    }
    this.processValue(this.$expressions[$offset + i]);
    const $cond = this.$stack.pop();
    if ($cond) {
      let valueAndType = this.$expressions[$offset + i + 1];
      const path = [];
      let cnt = 1;
      while ((valueAndType & 31) === $expressionRef) {
        cnt++;
        const getterIndex = valueAndType >> 5;
        const getterOffset = this.$expressionOffsets[getterIndex];
        this.processValue(this.$expressions[getterOffset + 1]);
        valueAndType = this.$expressions[getterOffset + 2]
      }
      if ((valueAndType & 31) === $context) { /// PATHS to context have 0 prefix
        cnt++;
        this.$stack.push(0);
        this.$stack.push(this.$contexts[this.$contexts.length - 1])
      } else {
        this.processValue(valueAndType);
      }
      for (let i = 0; i < cnt; i++) {
        path.push(this.$stack.pop());
      }

      // console.log(valueAndType & 31, path);
      this.trackPath($tracked, path);
    }
  }
}

const settersFuncs = new Array(setterTypesCount).fill();
settersFuncs[$setter] = function $setter(path, value) {
  let $target = this.$model;
  for (let i = 0; i < path.length - 1; i++) {
    const pathPart = path[i];
    if (typeof $target[pathPart] !== 'object') {
      $target[pathPart] = typeof path[i + 1] === 'number' ? [] : {};
    }
    this.triggerInvalidations($target, pathPart, false);
    $target = $target[pathPart];
  }
  if (Array.isArray($target)) {
    this.setOnArray($target, path[path.length - 1], value, false);
  } else if (typeof value === 'undefined') {
    this.deleteOnObject($target, path[path.length - 1]);
  } else {
    this.setOnObject($target, path[path.length - 1], value, false);
  }
};

settersFuncs[$push] = function $push(path, value) {
  let $target = this.$model;
  path.push(0);
  for (let i = 0; i < path.length - 1; i++) {
    const pathPart = path[i];
    if (typeof $target[pathPart] !== 'object') {
      $target[pathPart] = typeof path[i + 1] === 'number' ? [] : {};
    }
    if (i !== path.length - 1) {
      this.triggerInvalidations($target, pathPart, false);
      $target = $target[pathPart];
    }
  }
  this.setOnArray($target, $target.length, value, false);
};

settersFuncs[$splice] = function $splice(path, start, len, ...newItems) {
  let $target = this.$model;
  path.push(start);
  for (let i = 0; i < path.length - 1; i++) {
    const pathPart = path[i];
    if (typeof $target[pathPart] !== 'object') {
      $target[pathPart] = typeof path[i + 1] === 'number' ? [] : {};
    }
    if (i !== path.length - 1) {
      this.triggerInvalidations($target, pathPart, false);
      $target = $target[pathPart];
    }
  }
  const copy = $target.slice(start);
  copy.splice(0, len, ...newItems);
  if (copy.length < $target.length - start) {
    this.truncateArray($target, copy.length + start);
  }
  for (let i = 0; i < copy.length; i++) {
    this.setOnArray($target, i + start, copy[i], false);
  }
};

function wrapSetter(func, ...args) {
  if (this.$inBatch || this.$inRecalculate || this.$batchingStrategy) {
    this.$batchPending.push({func, args});
    if (!this.$inBatch && !this.$inRecalculate && this.$batchingStrategy) {
      this.$inBatch = true;
      this.$batchingStrategy.call(this.$res);
    }
  } else {
    func.apply(this.$res, args);
    this.recalculate();
  }
}

class VirtualMachineInstance {
  static getTypedArrayByIndex($bytecode, index, bytesPerItem) {
    const bytecodeOffsets = new Uint32Array($bytecode, 0, BUFFERS_COUNT * 4 + 4);
    switch (bytesPerItem) {
      case 1:
        return new Uint8Array(
          $bytecode,
          bytecodeOffsets[index],
          (bytecodeOffsets[index + 1] - bytecodeOffsets[index]) / bytesPerItem
        );
      case 2:
        return new Uint16Array(
          $bytecode,
          bytecodeOffsets[index],
          (bytecodeOffsets[index + 1] - bytecodeOffsets[index]) / bytesPerItem
        );
      case 4:
        return new Uint32Array(
          $bytecode,
          bytecodeOffsets[index],
          (bytecodeOffsets[index + 1] - bytecodeOffsets[index]) / bytesPerItem
        );
    }
  }

  constructor($constants, $globals, $bytecode, $model, $funcLib, $batchingStrategy) {
    this.$strings = $constants.$strings;
    this.$numbers = $constants.$numbers;
    this.$globals = $globals;
    const header = VirtualMachineInstance.getTypedArrayByIndex($bytecode, 0, 4);
    this.$topLevelsExpressions = VirtualMachineInstance.getTypedArrayByIndex($bytecode, 1, 4);
    this.$topLevelsNames = VirtualMachineInstance.getTypedArrayByIndex($bytecode, 2, 4);
    this.$topLevelsTracking = VirtualMachineInstance.getTypedArrayByIndex($bytecode, 3, 4);
    this.$expressionOffsets = VirtualMachineInstance.getTypedArrayByIndex($bytecode, 4, 4);
    this.$expressions = VirtualMachineInstance.getTypedArrayByIndex($bytecode, 5, 4);
    this.$topLevelsCount = header[0];
    this.$model = $model;
    this.$funcLib = $funcLib;
    this.$funcLibRaw = $funcLib;
    this.$batchingStrategy = $batchingStrategy;
    this.$listeners = [];
    this.$inBatch = false;
    this.$inRecalculate = false;
    this.$batchPending = [];
    this.$topLevels = [];
    this.$keys = [];
    this.$collections = [];
    this.$contexts = [];
    this.$functions = [];
    this.$stack = [];
    this.$currentSets = [];
    this.$conds = [];
    this.$res = {
      $model,
      $startBatch: () => {
        this.$inBatch = true;
      },
      $endBatch: () => {
        this.$inBatch = false;
        if (this.$batchPending.length) {
          this.$batchPending.forEach(({func, args}) => {
            func.apply(this, args);
          });
          this.$batchPending = [];
          this.recalculate();
        }
      },
      $runInBatch: func => {
        this.$res.$startBatch();
        func();
        this.$res.$endBatch();
      },
      $addListener: func => {
        this.$listeners.add(func);
      },
      $removeListener: func => {
        this.$listeners.delete(func);
      },
      $setBatchingStrategy: func => {
        $batchingStrategy = func;
      }
    };
    // this.$verbs = verbFuncs.map(f => f.bind(this));
    this.$trackingMap = new WeakMap();
    this.$trackingWildcards = new WeakMap();
    this.$invalidatedMap = new WeakMap();
    this.$invalidatedRoots = new Set();
    this.$invalidatedRoots.$subKeys = {};
    this.$invalidatedRoots.$parentKey = null;
    this.$invalidatedRoots.$parent = null;
    this.$invalidatedRoots.$tracked = {};
    this.$invalidatedRoots.$cache = [null, this.$topLevels, this.$invalidatedRoots, true, null];
    this.$first = true;
    this.$tainted = new Set();
    this.buildSetters(VirtualMachineInstance.getTypedArrayByIndex($bytecode, 6, 4));
    this.updateDerived();
  }

  processValue(valueAndType) {
    const type = valueAndType & 31;
    const value = valueAndType >> 5;
    switch (type) {
      case $numberInline:
        this.$stack.push(value);
        break;
      case $booleanInline:
        this.$stack.push(value === 1);
        break;
      case $stringRef:
        this.$stack.push(this.$strings[value]);
        break;
      case $numberRef:
        this.$stack.push(this.$numbers[value]);
        break;
      case $expressionRef:
        this.processExpression(value);
        break;
      case $condRef:
        this.$stack.push(this.$conds[this.$conds.length - 1].get(value) || 0);
        break;
      case $root:
        this.$stack.push(this.$model);
        break;
      case $topLevel:
        this.$stack.push(this.$topLevels);
        break;
      case $loop:
        this.$stack.push(this.$currentSets.length - 1);
        break;
      case $context:
        this.$stack.push(this.$contexts[this.$contexts.length - 1][0]);
        break;
      case $val:
        this.$stack.push(this.$collections[this.$collections.length - 1][this.$keys[this.$keys.length - 1]]);
        break;
      case $key:
        this.$stack.push(this.$keys[this.$keys.length - 1]);
        break;
      case $null:
        this.$stack.push(null);
        break;
    }
  }

  processExpression(exprIndex) {
    const offset = this.$expressionOffsets[exprIndex];
    const verbAndLength = this.$expressions[offset];
    const length = verbAndLength & LengthMask;
    const verb = verbAndLength >> 16;
    verbFuncs[verb].call(this, offset, length);
    // this.$verbs[verb](offset, length);
  }

  updateDerived() {
    this.$currentSets.push(this.$invalidatedRoots);
    for (let i = 0; i < this.$topLevelsCount; i++) {
      if (this.$first || this.$invalidatedRoots.has(i)) {
        this.$keys.push(i);
        this.$conds.push(new Map());
        this.processExpression(this.$topLevelsExpressions[i]);
        this.processExpression(this.$topLevelsTracking[i]);
        this.$keys.pop();
        this.$conds.pop();
        this.setOnArray(this.$topLevels, i, this.$stack.pop(), this.$first);
        if (!this.$first) {
          this.$invalidatedRoots.delete(i);
        }
        if (this.$topLevelsNames[i]) {
          this.$res[this.$strings[this.$topLevelsNames[i]]] = this.$topLevels[i];
        }
      }
    }
    this.$currentSets.pop(this.$invalidatedRoots);
    this.$first = false;
    this.$tainted = new Set();
  }

  recalculate() {
    if (this.$inBatch) {
      return;
    }
    this.$inRecalculate = true;
    this.updateDerived();
    this.$listeners.forEach(callback => callback());
    this.$inRecalculate = false;
    if (this.$batchPending.length) {
      this.$res.$endBatch();
    }
  }

  collectionFunction() {
    this.processExpression(this.$functions[this.$functions.length - 1] >> 5);
  }

  collectionRecursiveFunction() {
    const $invalidatedKeys = this.$currentSets[this.$currentSets.length - 1];
    const key = this.$keys[this.$keys.length - 1];
    const $cache = $invalidatedKeys.$cache;
    const $out = $cache[1];
    const $new = $cache[3];
    const src = this.$collections[this.$collections.length - 1];
    if ($invalidatedKeys.has(key)) {
      $invalidatedKeys.delete(key);
      if (Array.isArray($out)) {
        if (key >= src.length) {
          this.truncateArray($out, src.length);
          $out.length = src.length;
          this.$keys.pop();
        } else {
          this.processExpression(this.$functions[this.$functions.length - 1] >> 5);
          this.setOnArray($out, key, this.$stack.pop(), $new);
        }
      } else if (!src.hasOwnProperty(key)) {
        if ($out.hasOwnProperty(key)) {
          this.deleteOnObject($out, key, $new);
        }
        this.$keys.pop();
      } else {
        this.processExpression(this.$functions[this.$functions.length - 1] >> 5);
        this.setOnObject($out, key, this.$stack.pop(), $new);
      }
    } else {
      this.$keys.pop();
    }
    this.$stack.push($out[key]);
  }

  cascadeRecursiveInvalidations($invalidatedKeys, $dependencyMap) {
    $invalidatedKeys.forEach(key => {
      if ($dependencyMap.has(key)) {
        $dependencyMap.get(key).forEach($tracked => {
          this.invalidate($tracked[0], $tracked[1]);
        });
        $dependencyMap.delete(key);
      }
    });
  }

  generateSetter($setters, $offset) {
    return (...args) => {
      const $length = $setters[$offset] & LengthMask;
      const $setterType = $setters[$offset] >> 16;
      const path = [];
      let maxArgs = 0;
      for (let i = 0; i < $length; i++) {
        const valueAndType = $setters[$offset + i + 2];
        const type = valueAndType & 31;
        const value = valueAndType >> 5;
        switch (type) {
          case $numberInline:
            path.push(value);
            break;
          case $booleanInline:
            path.push(value === 1);
            break;
          case $stringRef:
            path.push(this.$strings[value]);
            break;
          case $numberRef:
            path.push(this.$numbers[value]);
            break;
          case $arg0:
          case $arg1:
          case $arg2:
          case $arg3:
          case $arg4:
          case $arg5:
          case $arg6:
          case $arg7:
          case $arg8:
          case $arg9:
            path.push(args[type - $arg0]);
            maxArgs = Math.max(maxArgs, type - $arg0 + 1);
            break;
        }
      }
      args = args.slice(maxArgs);
      settersFuncs[$setterType].apply(this, [path].concat(args));
    };
  }

  buildSetters($setters) {
    let $offset = 0;
    while ($offset < $setters.length) {
      this.$res[this.$strings[$setters[$offset + 1]]] = wrapSetter.bind(this, this.generateSetter($setters, $offset));
      $offset += ($setters[$offset] & LengthMask) + 2;
    }
  }

  getAssignableObject(path, index) {
    return path.slice(0, index).reduce((agg, p) => agg[p], this.$model);
  }

  //// AUTO-GENERATED
  untrack($targetKeySet, $targetKey) {
    const $tracked = $targetKeySet.$tracked;
    if (!$tracked || !$tracked[$targetKey]) {
      return;
    }
    const $trackedByKey = $tracked[$targetKey];
    for (let i = 0; i < $trackedByKey.length; i += 3) {
      const $trackingSource = this.$trackingMap.get($trackedByKey[i]);
      $trackingSource[$trackedByKey[i + 1]].delete($trackedByKey[i + 2]);
    }
    delete $tracked[$targetKey];
  }

  invalidate($targetKeySet, $targetKey) {
    if ($targetKeySet.has($targetKey)) {
      return;
    }
    $targetKeySet.add($targetKey);
    this.untrack($targetKeySet, $targetKey);
    if ($targetKeySet.$parent) {
      this.invalidate($targetKeySet.$parent, $targetKeySet.$parentKey);
    }
  }

  setOnObject($target, $key, $val, $new) {
    let $changed = false;
    let $hard = false;
    if (!$new) {
      if (typeof $target[$key] === 'object' && $target[$key] && $target[$key] !== $val) {
        $hard = true;
      }
      if (
        $hard ||
        $target[$key] !== $val ||
        $val && typeof $val === 'object' && this.$tainted.has($val) ||
        !$target.hasOwnProperty($key) && $target[$key] === undefined
      ) {
        $changed = true;
        this.triggerInvalidations($target, $key, $hard);
      }
    }
    $target[$key] = $val;
  }

  deleteOnObject($target, $key, $new) {
    let $hard = false;
    if (!$new) {
      if (typeof $target[$key] === 'object' && $target[$key]) {
        $hard = true;
      }
      this.triggerInvalidations($target, $key, $hard);
      const $invalidatedKeys = this.$invalidatedMap.get($target);
      if ($invalidatedKeys) {
        delete $invalidatedKeys.$subKeys[$key];
      }
    }
    delete $target[$key];
  }

  setOnArray($target, $key, $val, $new) {
    let $hard = false;
    if (!$new) {
      if (typeof $target[$key] === 'object' && $target[$key] && $target[$key] !== $val) {
        $hard = true;
      }
      if (
        $hard ||
        $key >= $target.length ||
        $target[$key] !== $val ||
        $val && typeof $target[$key] === 'object' && this.$tainted.has($val)
      ) {
        this.triggerInvalidations($target, $key, $hard);
      }
    }

    $target[$key] = $val;
  }

  truncateArray($target, newLen) {
    for (let i = newLen; i < $target.length; i++) {
      this.triggerInvalidations($target, i, true);
    }

    $target.length = newLen;
  }

  track($target, $sourceObj, $sourceKey, $soft) {
    if (!this.$trackingMap.has($sourceObj)) {
      this.$trackingMap.set($sourceObj, {});
    }
    const $track = this.$trackingMap.get($sourceObj);
    $track[$sourceKey] = $track[$sourceKey] || new Map();
    $track[$sourceKey].set($target, $soft);
    const $tracked = $target[0].$tracked;
    $tracked[$target[1]] = $tracked[$target[1]] || [];
    $tracked[$target[1]].push($sourceObj, $sourceKey, $target);
  }

  trackPath($target, $path) {
    const $end = $path.length - 2;
    let $current = $path[0];
    for (let i = 0; i <= $end; i++) {
      this.track($target, $current, $path[i + 1], i !== $end);
      $current = $current[$path[i + 1]];
    }
  }

  triggerInvalidations($sourceObj, $sourceKey, $hard) {
    this.$tainted.add($sourceObj);
    const $track = this.$trackingMap.get($sourceObj);
    if ($track && $track.hasOwnProperty($sourceKey)) {
      $track[$sourceKey].forEach(($soft, $target) => {
        if (!$soft || $hard) {
          this.invalidate($target[0], $target[1]);
        }
      });
    }
    if (this.$trackingWildcards.has($sourceObj)) {
      this.$trackingWildcards.get($sourceObj).forEach($targetInvalidatedKeys => {
        this.invalidate($targetInvalidatedKeys, $sourceKey);
      });
    }
  }

  initOutput(func, createDefaultValue, createCacheValue) {
    const $parent = this.$currentSets[this.$currentSets.length - 1];
    const $currentKey = this.$keys[this.$keys.length - 1];
    const src = this.$collections[this.$collections.length - 1];
    const subKeys = $parent.$subKeys;
    const $cachePerTargetKey = subKeys[$currentKey] = subKeys[$currentKey] || new Map();
    let $cachedByFunc = $cachePerTargetKey.get(func); //null; //$cachePerTargetKey.get(func);
    if (!$cachedByFunc) {
      const $resultObj = createDefaultValue();
      const $cacheValue = createCacheValue();
      const $invalidatedKeys = new Set();
      $invalidatedKeys.$subKeys = {};
      $invalidatedKeys.$parentKey = $currentKey;
      $invalidatedKeys.$parent = $parent;
      $invalidatedKeys.$tracked = {};
      this.$invalidatedMap.set($resultObj, $invalidatedKeys);
      $cachedByFunc = [null, $resultObj, $invalidatedKeys, true, $cacheValue];
      $invalidatedKeys.$cache = $cachedByFunc;
      $cachePerTargetKey.set(func, $cachedByFunc);
    } else {
      $cachedByFunc[3] = false;
    }
    const $invalidatedKeys = $cachedByFunc[2];
    this.$currentSets.push($invalidatedKeys);
    const $prevSrc = $cachedByFunc[0];
    if ($prevSrc !== src) {
      if ($prevSrc) {
        // prev mapped to a different collection
        this.$trackingWildcards.get($prevSrc).delete($invalidatedKeys);
        if (Array.isArray($prevSrc)) {
          $prevSrc.forEach((_item, index) => $invalidatedKeys.add(index));
        } else {
          Object.keys($prevSrc).forEach(key => $invalidatedKeys.add(key));
        }
        if (Array.isArray(src)) {
          src.forEach((_item, index) => $invalidatedKeys.add(index));
        } else {
          Object.keys(src).forEach(key => $invalidatedKeys.add(key));
        }
      }
      if (!this.$trackingWildcards.has(src)) {
        this.$trackingWildcards.set(src, new Set());
      }
      this.$trackingWildcards.get(src).add($invalidatedKeys);
      $cachedByFunc[0] = src;
    }
    return $cachedByFunc;
  }

  getEmptyArray(token) {
    const subKeys = this.$currentSets[this.$currentSets.length - 1].$subKeys;
    const currentKey = this.$keys[this.$keys.length - 1];
    const $cachePerTargetKey = subKeys[currentKey] = subKeys[currentKey] || new Map();

    if (!$cachePerTargetKey.has(token)) {
      $cachePerTargetKey.set(token, []);
    }
    return $cachePerTargetKey.get(token);
    // return [];
  }

  getEmptyObject(token) {
    const subKeys = this.$currentSets[this.$currentSets.length - 1].$subKeys;
    const currentKey = this.$keys[this.$keys.length - 1];
    const $cachePerTargetKey = subKeys[currentKey] = subKeys[currentKey] || new Map();
    if (!$cachePerTargetKey.has(token)) {
      $cachePerTargetKey.set(token, {});
    }
    return $cachePerTargetKey.get(token);
    // return {};
  }
}

module.exports = VirtualMachineInstance;
