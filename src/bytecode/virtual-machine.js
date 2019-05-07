const {
  $numberInline,
  $booleanInline,
  $stringRef,
  $numberRef,
  $expressionRef,
  $root,
  $topLevel,
  $loop,
  $context,
  $val,
  $key,
  $null,
  Verbs,
  VerbsCount
} = require('./bytecode-enums');

const simpleFunctions = require('./bytecode-functions');

const LengthMask = (1 << 16) - 1;

const unimplementedVerb = () => {};
const verbFuncs = new Array(VerbsCount).fill(unimplementedVerb);
Object.keys(Verbs).forEach(v => {
  if (simpleFunctions[v]) {
    verbFuncs[Verbs[v]] = simpleFunctions[v];
  }
});
/*
verbFuncs[Verbs.mapValues] = function $mapValues($offset, $length) {
  this.processValue(this.$expressions[$offset + 2]);
  if ($length === 3) {
    this.$stack.push(null);
  } else {
    this.processValue(this.$expressions[$offset + 3]);
  }
  this.$functions.push(this.$expressions[$offset + 1]);
  this.$contexts.push(this.$stack.pop());
  this.$collections.push(this.$stack.pop());
  const res = {};
  const src = this.$collections[this.$collections.length - 1];
  Object.keys(src).forEach(key => {
    this.$keys.push(key);
    this.collectionFunction();
    this.$keys.pop();
    res[key] = this.$stack.pop();
  });
  this.$stack.push(res);
};*/

verbFuncs[Verbs.$ternary] = function $ternary($offset, $length) {
  this.processValue(this.$expressions[$offset + 1]);
  if (this.$stack.pop()) {
    this.processValue(this.$expressions[$offset + 2]);
  } else {
    this.processValue(this.$expressions[$offset + 3]);
  }
};

verbFuncs[Verbs.$func] = function $func($offset, $length) {
  this.processValue(this.$expressions[$offset + 1]);
  this.$keys.pop();
};

// console.log(verbFuncs);

class VirtualMachineInstance {
  constructor($constants, $bytecode, $model, $funcLib, $batchingStrategy) {
    this.$strings = $constants.$strings;
    this.$numbers = $constants.$numbers;
    const header = new Uint32Array($bytecode, 0, 12);
    this.$topLevelsExpressions = new Uint32Array($bytecode, 12, header[0]);
    this.$topLevelsNames = new Uint32Array($bytecode, 12 + header[0] * 4, header[0]);
    this.$expressionOffsets = new Uint32Array($bytecode, 12 + header[0] * 8, header[1]);
    this.$expressions = new Uint32Array($bytecode, 12 + header[0] * 8 + header[1] * 4, header[2]);
    this.$topLevelsCount = header[0];
    this.$model = $model;
    this.$funcLib = $funcLib;
    this.$funcLibRaw = $funcLib;
    this.$batchingStrategy = $batchingStrategy;
    this.$topLevels = [];
    this.$keys = [];
    this.$collections = [];
    this.$contexts = [];
    this.$functions = [];
    this.$stack = [];
    this.$tracked = [];
    this.$res = {};
    // this.$verbs = verbFuncs.map(f => f.bind(this));
    this.$trackingMap = new WeakMap();
    this.$trackingWildcards = new WeakMap();
    this.$invalidatedMap = new WeakMap();
    this.$invalidatedRoots = new Set();
    this.$invalidatedRoots.$subKeys = {};
    this.$invalidatedRoots.$parentKey = null;
    this.$invalidatedRoots.$parent = null;
    this.$invalidatedRoots.$tracked = {};
    this.$first = true;
    this.$tainted = new WeakSet();
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
      case $root:
        this.$stack.push(this.$model);
        break;
      case $topLevel:
        this.$stack.push(this.$topLevels);
        break;
      case $loop:
        this.$stack.push(this.$functions.length);
        break;
      case $context:
        this.$stack.push(this.$contexts[this.$contexts.length - 1]);
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
    // console.log(verb, this.$stack);
  }

  updateDerived() {
    for (let i = 0; i < this.$topLevelsCount; i++) {
      this.$tracked.push([this.$invalidatedRoots, i]);
      this.processExpression(this.$topLevelsExpressions[i]);
      this.$tracked.pop();
      this.$topLevels[i] = this.$stack.pop();
      if (this.$topLevelsNames[i]) {
        this.$res[this.$strings[this.$topLevelsNames[i]]] = this.$topLevels[i];
      }
    }
  }

  collectionFunction() {
    this.processExpression(this.$functions[this.$functions.length - 1] >> 5);
  }

  getAssignableObject(path, index) {
    return path.slice(0, index).reduce((agg, p) => agg[p], this.$model)
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
  
      if ($hard || $target[$key] !== $val || $val && typeof $val === 'object' && this.$tainted.has($val) || !$target.hasOwnProperty($key) && $target[$key] === undefined) {
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
  
      if ($hard || $key >= $target.length || $target[$key] !== $val || $val && typeof $target[$key] === 'object' && this.$tainted.has($val)) {
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
    const $tracked = this.$tracked[this.$tracked.length - 1];
    const src = this.$collections[this.$collections.length - 1];
    const subKeys = $tracked[0].$subKeys;
    const $cachePerTargetKey = subKeys[$tracked[1]] = subKeys[$tracked[1]] || new Map();
    let $cachedByFunc = $cachePerTargetKey.get(func);
  
    if (!$cachedByFunc) {
      const $resultObj = createDefaultValue();
      const $cacheValue = createCacheValue();
      const $invalidatedKeys = new Set();
      $invalidatedKeys.$subKeys = {};
      $invalidatedKeys.$parentKey = $tracked[1];
      $invalidatedKeys.$parent = $tracked[0];
      $invalidatedKeys.$tracked = {};
      this.$invalidatedMap.set($resultObj, $invalidatedKeys);
      $cachedByFunc = [null, $resultObj, $invalidatedKeys, true, $cacheValue];
      $cachePerTargetKey.set(func, $cachedByFunc);
    } else {
      $cachedByFunc[3] = false;
    }
  
    const $invalidatedKeys = $cachedByFunc[2];
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
  getEmptyArray($tracked, token) {
    const subKeys = $tracked[0].$subKeys;
    const $cachePerTargetKey = subKeys[$tracked[1]] = subKeys[$tracked[1]] || new Map();
  
    if (!$cachePerTargetKey.has(token)) {
      $cachePerTargetKey.set(token, []);
    }
  
    return $cachePerTargetKey.get(token);
  }
  getEmptyObject($tracked, token) {
    const subKeys = $tracked[0].$subKeys;
    const $cachePerTargetKey = subKeys[$tracked[1]] = subKeys[$tracked[1]] || new Map();
  
    if (!$cachePerTargetKey.has(token)) {
      $cachePerTargetKey.set(token, {});
    }
  
    return $cachePerTargetKey.get(token);
  }
  invalidatePath(path) {
    path.forEach((part, index) => {
      this.triggerInvalidations(this.getAssignableObject(path, index), part, index === path.length - 1);
    });
  }
}

module.exports = VirtualMachineInstance;
