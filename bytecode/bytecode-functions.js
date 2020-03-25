
// array skipped
// object skipped

module.exports.$not = function $not($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
    this.$stack.push(!(arg0));
}
// trace skipped

module.exports.$get = function $get($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
 this.processValue(this.$expressions[++$offset])
  const arg1 = this.$stack.pop();
    this.$stack.push(arg1[arg0]);
}
// mapValues skipped
// map skipped
// recursiveMapValues skipped
// recursiveMap skipped
// any skipped
// keyBy skipped
// filter skipped
// anyValues skipped
// filterBy skipped
// mapKeys skipped
// groupBy skipped
// values skipped
// keys skipped
// flatten skipped
// size skipped
// isEmpty skipped
// last skipped
// sum skipped
// range skipped
// assign skipped
// defaults skipped
// recur skipped
// func skipped
// invoke skipped

module.exports.$eq = function $eq($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
 this.processValue(this.$expressions[++$offset])
  const arg1 = this.$stack.pop();
    this.$stack.push((arg0) === (arg1));
}

module.exports.$gt = function $gt($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
 this.processValue(this.$expressions[++$offset])
  const arg1 = this.$stack.pop();
    this.$stack.push((arg0) > (arg1));
}

module.exports.$lt = function $lt($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
 this.processValue(this.$expressions[++$offset])
  const arg1 = this.$stack.pop();
    this.$stack.push((arg0) < (arg1));
}

module.exports.$gte = function $gte($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
 this.processValue(this.$expressions[++$offset])
  const arg1 = this.$stack.pop();
    this.$stack.push((arg0) >= (arg1));
}

module.exports.$lte = function $lte($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
 this.processValue(this.$expressions[++$offset])
  const arg1 = this.$stack.pop();
    this.$stack.push((arg0) <= (arg1));
}

module.exports.$plus = function $plus($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
 this.processValue(this.$expressions[++$offset])
  const arg1 = this.$stack.pop();
    this.$stack.push((arg0) + (arg1));
}

module.exports.$minus = function $minus($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
 this.processValue(this.$expressions[++$offset])
  const arg1 = this.$stack.pop();
    this.$stack.push((arg0) - (arg1));
}

module.exports.$mult = function $mult($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
 this.processValue(this.$expressions[++$offset])
  const arg1 = this.$stack.pop();
    this.$stack.push((arg0) * (arg1));
}

module.exports.$div = function $div($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
 this.processValue(this.$expressions[++$offset])
  const arg1 = this.$stack.pop();
    this.$stack.push((arg0) / (arg1));
}

module.exports.$mod = function $mod($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
 this.processValue(this.$expressions[++$offset])
  const arg1 = this.$stack.pop();
    this.$stack.push((arg0) % (arg1));
}

module.exports.$breakpoint = function $breakpoint($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
    this.$stack.push(((() => {debugger; return arg0}) ()));
}
// call skipped
// bind skipped
// effect skipped

module.exports.$startsWith = function $startsWith($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
 this.processValue(this.$expressions[++$offset])
  const arg1 = this.$stack.pop();
    this.$stack.push((String.prototype.startsWith).call(arg0, arg1));
}

module.exports.$endsWith = function $endsWith($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
 this.processValue(this.$expressions[++$offset])
  const arg1 = this.$stack.pop();
    this.$stack.push((String.prototype.endsWith).call(arg0, arg1));
}

module.exports.$toUpperCase = function $toUpperCase($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
    this.$stack.push((String.prototype.toUpperCase).call(arg0));
}

module.exports.$toLowerCase = function $toLowerCase($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
    this.$stack.push((String.prototype.toLowerCase).call(arg0));
}

module.exports.$stringLength = function $stringLength($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
    this.$stack.push((arg0).length);
}

module.exports.$floor = function $floor($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
    this.$stack.push((Math.floor)(arg0));
}

module.exports.$ceil = function $ceil($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
    this.$stack.push((Math.ceil)(arg0));
}

module.exports.$round = function $round($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
    this.$stack.push((Math.round)(arg0));
}
// parseInt skipped

module.exports.$parseFloat = function $parseFloat($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
    this.$stack.push(parseFloat(arg0));
}

module.exports.$substring = function $substring($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
 this.processValue(this.$expressions[++$offset])
  const arg1 = this.$stack.pop();
 this.processValue(this.$expressions[++$offset])
  const arg2 = this.$stack.pop();
    this.$stack.push((String.prototype.substring).call(arg0, arg1, arg2));
}

module.exports.$split = function $split($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
 this.processValue(this.$expressions[++$offset])
  const arg1 = this.$stack.pop();
    this.$stack.push((String.prototype.split).call(arg0, arg1));
}

module.exports.$isUndefined = function $isUndefined($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
    this.$stack.push((typeof (arg0) === 'undefined'));
}

module.exports.$isBoolean = function $isBoolean($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
    this.$stack.push((typeof (arg0) === 'boolean'));
}

module.exports.$isString = function $isString($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
    this.$stack.push((typeof (arg0) === 'string'));
}

module.exports.$isNumber = function $isNumber($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
    this.$stack.push((typeof (arg0) === 'number'));
}

module.exports.$isArray = function $isArray($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
    this.$stack.push(Array.isArray(arg0));
}

module.exports.$quote = function $quote($offset, $len) {
 this.processValue(this.$expressions[++$offset])
  const arg0 = this.$stack.pop();
    this.$stack.push(arg0);
}
// trackPath skipped
const emptyObj = () => ({});
const emptyArr = () => [];
const nullFunc = () => null;
const filterCacheFunc = () => [0];
const valuesOrKeysCacheFunc = () => ({
  $keyToIdx: {},
  $idxToKey: []
});
module.exports.$trackPath = function trackPath($offset, $length) {
  const $end = $path.length - 2;
  let $current = $path[0];

  for (let i = 0; i <= $end; i++) {
    this.track($target, $current, $path[i + 1], i !== $end);
    $current = $current[$path[i + 1]];
  }
};
module.exports.$mapValues = function mapValues($offset, $length) {
  const func = this.$expressions[++$offset];
  this.processValue(this.$expressions[++$offset]);

  if ($length === 3) {
    this.$stack.push(null);
  } else {
    this.processValue(this.$expressions[++$offset]);
  }

  if ($length === 3) {
    this.$contexts.push(this.$stack.pop());
  } else {
    const contextArray = this.getEmptyArray(~$offset);

    if (contextArray.length) {
      this.setOnArray(contextArray, 0, this.$stack.pop(), false);
    } else {
      contextArray[0] = this.$stack.pop();
    }

    this.$contexts.push(contextArray);
  }

  let src = this.$stack.pop();
  this.$collections.push(src);
  // eslint-disable-next-line no-undef
  this.$functions.push(func);
  const $storage = this.initOutput($offset - $length, emptyObj, nullFunc);
  const $out = $storage[1];
  const $invalidatedKeys = $storage[2];
  const $new = $storage[3];
  ($new && Object.keys(src) || $invalidatedKeys).forEach(key => {
    if (!src.hasOwnProperty(key)) {
      if ($out.hasOwnProperty(key)) {
        this.deleteOnObject($out, key, $new);
      }
    } else {
      this.$keys.push(key);
      this.collectionFunction();
      const res = this.$stack.pop();
      this.setOnObject($out, key, res, $new);
    }
  });
  $invalidatedKeys.clear();
  this.$stack.push($out)
  this.$functions.pop();
  this.$collections.pop();
  this.$contexts.pop();
  this.$currentSets.pop();
};
module.exports.$filterBy = function filterBy($offset, $length) {
  const func = this.$expressions[++$offset];
  this.processValue(this.$expressions[++$offset]);

  if ($length === 3) {
    this.$stack.push(null);
  } else {
    this.processValue(this.$expressions[++$offset]);
  }

  if ($length === 3) {
    this.$contexts.push(this.$stack.pop());
  } else {
    const contextArray = this.getEmptyArray(~$offset);

    if (contextArray.length) {
      this.setOnArray(contextArray, 0, this.$stack.pop(), false);
    } else {
      contextArray[0] = this.$stack.pop();
    }

    this.$contexts.push(contextArray);
  }

  let src = this.$stack.pop();
  this.$collections.push(src);
  // eslint-disable-next-line no-undef
  this.$functions.push(func);
  const $storage = this.initOutput($offset - $length, emptyObj, nullFunc);
  const $out = $storage[1];
  const $invalidatedKeys = $storage[2];
  const $new = $storage[3];
  ($new && Object.keys(src) || $invalidatedKeys).forEach(key => {
    if (!src.hasOwnProperty(key)) {
      if ($out.hasOwnProperty(key)) {
        this.deleteOnObject($out, key, $new);
      }
    } else {
      this.$keys.push(key);
      this.collectionFunction();
      const res = this.$stack.pop();

      if (res) {
        this.setOnObject($out, key, src[key], $new);
      } else if ($out.hasOwnProperty(key)) {
        this.deleteOnObject($out, key, $new);
      }
    }
  });
  $invalidatedKeys.clear();
  this.$stack.push($out)
  this.$functions.pop();
  this.$collections.pop();
  this.$contexts.pop();
  this.$currentSets.pop();
};
module.exports.$map = function map($offset, $length) {
  const func = this.$expressions[++$offset];
  this.processValue(this.$expressions[++$offset]);

  if ($length === 3) {
    this.$stack.push(null);
  } else {
    this.processValue(this.$expressions[++$offset]);
  }

  if ($length === 3) {
    this.$contexts.push(this.$stack.pop());
  } else {
    const contextArray = this.getEmptyArray(~$offset);

    if (contextArray.length) {
      this.setOnArray(contextArray, 0, this.$stack.pop(), false);
    } else {
      contextArray[0] = this.$stack.pop();
    }

    this.$contexts.push(contextArray);
  }

  let src = this.$stack.pop();
  this.$collections.push(src);
  // eslint-disable-next-line no-undef
  this.$functions.push(func);
  const $storage = this.initOutput($offset - $length, emptyArr, nullFunc);
  const $out = $storage[1];
  const $invalidatedKeys = $storage[2];
  const $new = $storage[3];

  if ($new) {
    for (let key = 0; key < src.length; key++) {
      this.$keys.push(key);
      this.collectionFunction();
      const res = this.$stack.pop();
      this.setOnArray($out, key, res, $new);
    }
  } else {
    $invalidatedKeys.forEach(key => {
      if (key < src.length) {
        this.$keys.push(key);
        this.collectionFunction();
        const res = this.$stack.pop();
        this.setOnArray($out, key, res, $new);
      }
    });

    if ($out.length > src.length) {
      this.truncateArray($out, src.length);
    }
  }

  $invalidatedKeys.clear();
  this.$stack.push($out)
  this.$functions.pop();
  this.$collections.pop();
  this.$contexts.pop();
  this.$currentSets.pop();
};
// recursiveMap skipped from optimizing
// recursiveMapValues skipped from optimizing
module.exports.$keyBy = function keyBy($offset, $length) {
  const func = this.$expressions[++$offset];
  this.processValue(this.$expressions[++$offset]);

  if ($length === 3) {
    this.$stack.push(null);
  } else {
    this.processValue(this.$expressions[++$offset]);
  }

  if ($length === 3) {
    this.$contexts.push(this.$stack.pop());
  } else {
    const contextArray = this.getEmptyArray(~$offset);

    if (contextArray.length) {
      this.setOnArray(contextArray, 0, this.$stack.pop(), false);
    } else {
      contextArray[0] = this.$stack.pop();
    }

    this.$contexts.push(contextArray);
  }

  let src = this.$stack.pop();
  this.$collections.push(src);
  // eslint-disable-next-line no-undef
  this.$functions.push(func);
  const $storage = this.initOutput($offset - $length, emptyObj, emptyArr);
  const $out = $storage[1];
  const $invalidatedKeys = $storage[2];
  const $new = $storage[3];
  const $cache = $storage[4];

  if ($new) {
    $cache.indexToKey = [];
    $cache.keyToIndices = {};

    for (let index = 0; index < src.length; index++) {
      this.$keys.push(index);
      this.collectionFunction();
      const key = '' + this.$stack.pop();
      $cache.indexToKey[index] = key;
      $cache.keyToIndices[key] = $cache.keyToIndices[key] || new Set();
      $cache.keyToIndices[key].add(index);
      this.setOnObject($out, key, src[index], $new);
    }
  } else {
    const keysPendingDelete = new Set();
    $invalidatedKeys.forEach(index => {
      if (index < $cache.indexToKey.length) {
        const key = $cache.indexToKey[index];
        $cache.keyToIndices[key].delete(index);

        if ($cache.keyToIndices[key].size === 0) {
          delete $cache.keyToIndices[key];
          keysPendingDelete.add(key);
        }
      }
    });
    $invalidatedKeys.forEach(index => {
      if (index < src.length) {
        this.$keys.push(index);
        this.collectionFunction();
        const key = '' + this.$stack.pop();
        $cache.indexToKey[index] = key;
        keysPendingDelete.delete(key);
        $cache.keyToIndices[key] = $cache.keyToIndices[key] || new Set();
        $cache.keyToIndices[key].add(index);
        this.setOnObject($out, key, src[index], $new);
      }
    });
    keysPendingDelete.forEach(key => {
      this.deleteOnObject($out, key, $new);
    });
  }

  $cache.indexToKey.length = src.length;
  $invalidatedKeys.clear();
  this.$stack.push($out)
  this.$functions.pop();
  this.$collections.pop();
  this.$contexts.pop();
  this.$currentSets.pop();
};
module.exports.$mapKeys = function mapKeys($offset, $length) {
  const func = this.$expressions[++$offset];
  this.processValue(this.$expressions[++$offset]);

  if ($length === 3) {
    this.$stack.push(null);
  } else {
    this.processValue(this.$expressions[++$offset]);
  }

  if ($length === 3) {
    this.$contexts.push(this.$stack.pop());
  } else {
    const contextArray = this.getEmptyArray(~$offset);

    if (contextArray.length) {
      this.setOnArray(contextArray, 0, this.$stack.pop(), false);
    } else {
      contextArray[0] = this.$stack.pop();
    }

    this.$contexts.push(contextArray);
  }

  let src = this.$stack.pop();
  this.$collections.push(src);
  // eslint-disable-next-line no-undef
  this.$functions.push(func);
  const $storage = this.initOutput($offset - $length, emptyObj, emptyObj);
  const $out = $storage[1];
  const $invalidatedKeys = $storage[2];
  const $new = $storage[3];
  const $keyToKey = $storage[4];

  if ($new) {
    Object.keys(src).forEach(key => {
      this.$keys.push(key);
      this.collectionFunction();
      const newKey = this.$stack.pop();
      this.setOnObject($out, newKey, src[key], $new);
      $keyToKey[key] = newKey;
    });
  } else {
    const keysPendingDelete = new Set();
    $invalidatedKeys.forEach(key => {
      if ($keyToKey.hasOwnProperty(key)) {
        keysPendingDelete.add($keyToKey[key]);
        delete $keyToKey[key];
      }
    });
    $invalidatedKeys.forEach(key => {
      if (src.hasOwnProperty(key)) {
        this.$keys.push(key);
        this.collectionFunction();
        const newKey = this.$stack.pop();
        this.setOnObject($out, newKey, src[key], $new);
        $keyToKey[key] = newKey;
        keysPendingDelete.delete(newKey);
      }
    });
    keysPendingDelete.forEach(key => {
      this.deleteOnObject($out, key, $new);
    });
  }

  $invalidatedKeys.clear();
  this.$stack.push($out)
  this.$functions.pop();
  this.$collections.pop();
  this.$contexts.pop();
  this.$currentSets.pop();
};
module.exports.$filter = function filter($offset, $length) {
  const func = this.$expressions[++$offset];
  this.processValue(this.$expressions[++$offset]);

  if ($length === 3) {
    this.$stack.push(null);
  } else {
    this.processValue(this.$expressions[++$offset]);
  }

  if ($length === 3) {
    this.$contexts.push(this.$stack.pop());
  } else {
    const contextArray = this.getEmptyArray(~$offset);

    if (contextArray.length) {
      this.setOnArray(contextArray, 0, this.$stack.pop(), false);
    } else {
      contextArray[0] = this.$stack.pop();
    }

    this.$contexts.push(contextArray);
  }

  let src = this.$stack.pop();
  this.$collections.push(src);
  // eslint-disable-next-line no-undef
  this.$functions.push(func);
  const $storage = this.initOutput($offset - $length, emptyArr, filterCacheFunc);
  const $out = $storage[1];
  const $invalidatedKeys = $storage[2];
  const $new = $storage[3];
  const $idxToIdx = $storage[4];

  if ($new) {
    for (let key = 0; key < src.length; key++) {
      this.$keys.push(key);
      this.collectionFunction();
      const passed = !!this.$stack.pop();
      const prevItemIdx = $idxToIdx[key];
      const nextItemIdx = passed ? prevItemIdx + 1 : prevItemIdx;
      $idxToIdx[key + 1] = nextItemIdx;

      if (nextItemIdx !== prevItemIdx) {
        this.setOnArray($out, prevItemIdx, src[key], $new);
      }
    }
  } else {
    let firstIndex = Number.MAX_SAFE_INTEGER;
    $invalidatedKeys.forEach(key => firstIndex = Math.min(firstIndex, key));

    for (let key = firstIndex; key < src.length; key++) {
      this.$keys.push(key);
      this.collectionFunction();
      const passed = !!this.$stack.pop();
      const prevItemIdx = $idxToIdx[key];
      const nextItemIdx = passed ? prevItemIdx + 1 : prevItemIdx;
      $idxToIdx[key + 1] = nextItemIdx;

      if (nextItemIdx !== prevItemIdx) {
        this.setOnArray($out, prevItemIdx, src[key], $new);
      }
    }

    $idxToIdx.length = src.length + 1;
    this.truncateArray($out, $idxToIdx[$idxToIdx.length - 1]);
  }

  $invalidatedKeys.clear();
  this.$stack.push($out)
  this.$functions.pop();
  this.$collections.pop();
  this.$contexts.pop();
  this.$currentSets.pop();
};
module.exports.$any = function any($offset, $length) {
  const func = this.$expressions[++$offset];
  this.processValue(this.$expressions[++$offset]);

  if ($length === 3) {
    this.$stack.push(null);
  } else {
    this.processValue(this.$expressions[++$offset]);
  }

  if ($length === 3) {
    this.$contexts.push(this.$stack.pop());
  } else {
    const contextArray = this.getEmptyArray(~$offset);

    if (contextArray.length) {
      this.setOnArray(contextArray, 0, this.$stack.pop(), false);
    } else {
      contextArray[0] = this.$stack.pop();
    }

    this.$contexts.push(contextArray);
  }

  let src = this.$stack.pop();
  this.$collections.push(src);
  // eslint-disable-next-line no-undef
  this.$functions.push(func);
  const $storage = this.initOutput($offset - $length, emptyArr, nullFunc);
  const $out = $storage[1];
  const $invalidatedKeys = $storage[2];
  const $new = $storage[3]; // $out has at most 1 key - the one that stopped the previous run because it was truthy

  if ($new) {
    for (let key = 0; key < src.length; key++) {
      $invalidatedKeys.add(key);
    }
  }

  const $prevStop = $out.length > 0 ? $out[0] : -1;

  if ($prevStop >= 0 && $prevStop < src.length) {
    if ($invalidatedKeys.has($prevStop)) {
      $invalidatedKeys.delete($prevStop);
      this.$keys.push($prevStop);
      this.collectionFunction();
      const passedTest = this.$stack.pop();

      if (!passedTest) {
        $out.length = 0;
      }
    }
  } else {
    $out.length = 0;
  }

  if ($out.length === 0) {
    for (let key of $invalidatedKeys) {
      $invalidatedKeys.delete(key);

      if (key >= 0 && key < src.length) {
        this.$keys.push(key);
        this.collectionFunction();
        const match = this.$stack.pop();

        if (match) {
          $out[0] = key;
          break;
        }
      }
    }
  }

  this.$stack.push($out.length === 1)
  this.$functions.pop();
  this.$collections.pop();
  this.$contexts.pop();
  this.$currentSets.pop();
};
module.exports.$anyValues = function anyValues($offset, $length) {
  const func = this.$expressions[++$offset];
  this.processValue(this.$expressions[++$offset]);

  if ($length === 3) {
    this.$stack.push(null);
  } else {
    this.processValue(this.$expressions[++$offset]);
  }

  if ($length === 3) {
    this.$contexts.push(this.$stack.pop());
  } else {
    const contextArray = this.getEmptyArray(~$offset);

    if (contextArray.length) {
      this.setOnArray(contextArray, 0, this.$stack.pop(), false);
    } else {
      contextArray[0] = this.$stack.pop();
    }

    this.$contexts.push(contextArray);
  }

  let src = this.$stack.pop();
  this.$collections.push(src);
  // eslint-disable-next-line no-undef
  this.$functions.push(func);
  const $storage = this.initOutput($offset - $length, emptyArr, nullFunc);
  const $out = $storage[1];
  const $invalidatedKeys = $storage[2];
  const $new = $storage[3]; // $out has at most 1 key - the one that stopped the previous run because it was truthy

  if ($new) {
    Object.keys(src).forEach(key => $invalidatedKeys.add(key));
  }

  const $prevStop = $out.length > 0 ? $out[0] : null;

  if ($prevStop !== null && src.hasOwnProperty($prevStop)) {
    if ($invalidatedKeys.has($prevStop)) {
      $invalidatedKeys.delete($prevStop);
      this.$keys.push($prevStop);
      this.collectionFunction();
      const passedTest = this.$stack.pop();

      if (!passedTest) {
        $out.length = 0;
      }
    }
  } else {
    $out.length = 0;
  }

  if ($out.length === 0) {
    for (let key of $invalidatedKeys) {
      $invalidatedKeys.delete(key);

      if (src.hasOwnProperty(key)) {
        this.$keys.push(key);
        this.collectionFunction();
        const match = this.$stack.pop();

        if (match) {
          $out[0] = key;
          break;
        }
      }
    }
  }

  this.$stack.push($out.length === 1)
  this.$functions.pop();
  this.$collections.pop();
  this.$contexts.pop();
  this.$currentSets.pop();
};
module.exports.$groupBy = function groupBy($offset, $length) {
  const func = this.$expressions[++$offset];
  this.processValue(this.$expressions[++$offset]);

  if ($length === 3) {
    this.$stack.push(null);
  } else {
    this.processValue(this.$expressions[++$offset]);
  }

  if ($length === 3) {
    this.$contexts.push(this.$stack.pop());
  } else {
    const contextArray = this.getEmptyArray(~$offset);

    if (contextArray.length) {
      this.setOnArray(contextArray, 0, this.$stack.pop(), false);
    } else {
      contextArray[0] = this.$stack.pop();
    }

    this.$contexts.push(contextArray);
  }

  let src = this.$stack.pop();
  this.$collections.push(src);
  // eslint-disable-next-line no-undef
  this.$functions.push(func);
  const $storage = this.initOutput($offset - $length, emptyObj, emptyObj);
  const $out = $storage[1];
  const $invalidatedKeys = $storage[2];
  const $new = $storage[3];
  const $keyToKey = $storage[4];

  if (Array.isArray(src)) {
    throw new Error('groupBy only works on objects');
  }

  if ($new) {
    Object.keys(src).forEach(key => {
      this.$keys.push(key);
      this.collectionFunction();
      const res = '' + this.$stack.pop();
      $keyToKey[key] = res;

      if (!$out[res]) {
        this.setOnObject($out, res, {}, $new);
      }

      this.setOnObject($out[res], key, src[key], $new);
    });
  } else {
    const keysPendingDelete = {};
    $invalidatedKeys.forEach(key => {
      if ($keyToKey[key]) {
        keysPendingDelete[$keyToKey[key]] = keysPendingDelete[$keyToKey[key]] || new Set();
        keysPendingDelete[$keyToKey[key]].add(key);
      }
    });
    $invalidatedKeys.forEach(key => {
      if (!src.hasOwnProperty(key)) {
        delete $keyToKey[key];
        return;
      }

      this.$keys.push(key);
      this.collectionFunction();
      const res = '' + this.$stack.pop();
      $keyToKey[key] = res;

      if (!$out[res]) {
        $out[res] = {};
      }

      this.setOnObject($out[res], key, src[key], $new);
      this.setOnObject($out, res, $out[res], $new);

      if (keysPendingDelete.hasOwnProperty(res)) {
        keysPendingDelete[res].delete(key);
      }
    });
    Object.keys(keysPendingDelete).forEach(res => {
      if (keysPendingDelete[res].size > 0) {
        keysPendingDelete[res].forEach(key => {
          this.deleteOnObject($out[res], key, $new);
        });

        if (Object.keys($out[res]).length === 0) {
          this.deleteOnObject($out, res, $new);
        } else {
          this.setOnObject($out, res, $out[res], $new);
        }
      }
    });
  }

  $invalidatedKeys.clear();
  this.$stack.push($out)
  this.$functions.pop();
  this.$collections.pop();
  this.$contexts.pop();
  this.$currentSets.pop();
};
module.exports.$values = function values($offset, $length) {
  this.processValue(this.$expressions[++$offset]);
  let src = this.$stack.pop();
  this.$collections.push(src);
  const $storage = this.initOutput($offset - $length, emptyArr, valuesOrKeysCacheFunc);
  const $out = $storage[1];
  const $invalidatedKeys = $storage[2];
  const $new = $storage[3];
  const {
    $keyToIdx,
    $idxToKey
  } = $storage[4];

  if ($new) {
    Object.keys(src).forEach((key, idx) => {
      $out[idx] = src[key];
      $idxToKey[idx] = key;
      $keyToIdx[key] = idx;
    });
  } else {
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
          this.setOnObject($out, $keyToIdx[key], src[key], $new);
        }
      }
    });

    if ($addedKeys.length < $deletedKeys.length) {
      $deletedKeys.sort((a, b) => $keyToIdx[a] - $keyToIdx[b]);
    }

    const $finalOutLength = $out.length - $deletedKeys.length + $addedKeys.length; // keys both deleted and added fill created holes first

    for (let i = 0; i < $addedKeys.length && i < $deletedKeys.length; i++) {
      const $addedKey = $addedKeys[i];
      const $deletedKey = $deletedKeys[i];
      const $newIdx = $keyToIdx[$deletedKey];
      delete $keyToIdx[$deletedKey];
      $keyToIdx[$addedKey] = $newIdx;
      $idxToKey[$newIdx] = $addedKey;
      this.setOnArray($out, $newIdx, src[$addedKey], $new);
    } // more keys added - append to end


    for (let i = $deletedKeys.length; i < $addedKeys.length; i++) {
      const $addedKey = $addedKeys[i];
      const $newIdx = $out.length;
      $keyToIdx[$addedKey] = $newIdx;
      $idxToKey[$newIdx] = $addedKey;
      this.setOnArray($out, $newIdx, src[$addedKey], $new);
    } // more keys deleted - move non deleted items at the tail to the location of deleted


    const $deletedNotMoved = $deletedKeys.slice($addedKeys.length);
    const $deletedNotMovedSet = new Set($deletedKeys.slice($addedKeys.length));
    const $keysToMoveInside = new Set($idxToKey.slice($finalOutLength).filter(key => !$deletedNotMovedSet.has(key)));
    let $savedCount = 0;

    for (let $tailIdx = $finalOutLength; $tailIdx < $out.length; $tailIdx++) {
      const $currentKey = $idxToKey[$tailIdx];

      if ($keysToMoveInside.has($currentKey)) {
        // need to move this key to one of the pending delete
        const $switchedWithDeletedKey = $deletedNotMoved[$savedCount];
        const $newIdx = $keyToIdx[$switchedWithDeletedKey];
        this.setOnArray($out, $newIdx, src[$currentKey], $new);
        $keyToIdx[$currentKey] = $newIdx;
        $idxToKey[$newIdx] = $currentKey;
        delete $keyToIdx[$switchedWithDeletedKey];
        $savedCount++;
      } else {
        delete $keyToIdx[$currentKey];
      }
    }

    this.truncateArray($out, $finalOutLength);
    $idxToKey.length = $out.length;
    $invalidatedKeys.clear();
  }

  this.$stack.push($out)
  this.$collections.pop();
  this.$currentSets.pop();
};
module.exports.$keys = function keys($offset, $length) {
  this.processValue(this.$expressions[++$offset]);
  let src = this.$stack.pop();
  this.$collections.push(src);
  const $storage = this.initOutput($offset - $length, emptyArr, valuesOrKeysCacheFunc);
  const $out = $storage[1];
  const $invalidatedKeys = $storage[2];
  const $new = $storage[3];
  const {
    $keyToIdx,
    $idxToKey
  } = $storage[4];

  if ($new) {
    Object.keys(src).forEach((key, idx) => {
      $out[idx] = key;
      $idxToKey[idx] = key;
      $keyToIdx[key] = idx;
    });
  } else {
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
          this.setOnObject($out, $keyToIdx[key], key, $new);
        }
      }
    });

    if ($addedKeys.length < $deletedKeys.length) {
      $deletedKeys.sort((a, b) => $keyToIdx[a] - $keyToIdx[b]);
    }

    const $finalOutLength = $out.length - $deletedKeys.length + $addedKeys.length; // keys both deleted and added fill created holes first

    for (let i = 0; i < $addedKeys.length && i < $deletedKeys.length; i++) {
      const $addedKey = $addedKeys[i];
      const $deletedKey = $deletedKeys[i];
      const $newIdx = $keyToIdx[$deletedKey];
      delete $keyToIdx[$deletedKey];
      $keyToIdx[$addedKey] = $newIdx;
      $idxToKey[$newIdx] = $addedKey;
      this.setOnArray($out, $newIdx, $addedKey, $new);
    } // more keys added - append to end


    for (let i = $deletedKeys.length; i < $addedKeys.length; i++) {
      const $addedKey = $addedKeys[i];
      const $newIdx = $out.length;
      $keyToIdx[$addedKey] = $newIdx;
      $idxToKey[$newIdx] = $addedKey;
      this.setOnArray($out, $newIdx, $addedKey, $new);
    } // more keys deleted - move non deleted items at the tail to the location of deleted


    const $deletedNotMoved = $deletedKeys.slice($addedKeys.length);
    const $deletedNotMovedSet = new Set($deletedKeys.slice($addedKeys.length));
    const $keysToMoveInside = new Set($idxToKey.slice($finalOutLength).filter(key => !$deletedNotMovedSet.has(key)));
    let $savedCount = 0;

    for (let $tailIdx = $finalOutLength; $tailIdx < $out.length; $tailIdx++) {
      const $currentKey = $idxToKey[$tailIdx];

      if ($keysToMoveInside.has($currentKey)) {
        // need to move this key to one of the pending delete
        const $switchedWithDeletedKey = $deletedNotMoved[$savedCount];
        const $newIdx = $keyToIdx[$switchedWithDeletedKey];
        this.setOnArray($out, $newIdx, $currentKey, $new);
        $keyToIdx[$currentKey] = $newIdx;
        $idxToKey[$newIdx] = $currentKey;
        delete $keyToIdx[$switchedWithDeletedKey];
        $savedCount++;
      } else {
        delete $keyToIdx[$currentKey];
      }
    }

    this.truncateArray($out, $finalOutLength);
    $idxToKey.length = $out.length;
    $invalidatedKeys.clear();
  }

  this.$stack.push($out)
  this.$collections.pop();
  this.$currentSets.pop();
};
module.exports.$array = function array($offset, $length) {
  const newVal = [];

  for (let i = 1; i < $length; i++) {
    this.processValue(this.$expressions[++$offset]);
    newVal.push(this.$stack.pop());
  }

  const len = $length - 1;
  const res = this.getEmptyArray(-$offset);
  const $new = res.length === 0;

  for (let i = 0; i < len; i++) {
    this.setOnArray(res, i, newVal[i], $new);
  }

  this.$stack.push(res)
};
module.exports.$object = function object($offset, $length) {
  const valsList = [];

  for (let i = 2; i < $length; i += 2) {
    this.processValue(this.$expressions[$offset + i]);
    valsList.push(this.$stack.pop());
  }

  let keysList = this.$globals.get($offset);

  if (!keysList) {
    keysList = [];

    for (let i = 1; i < $length; i += 2) {
      this.processValue(this.$expressions[$offset + i]);
      keysList.push(this.$stack.pop());
    }

    this.$globals.set($offset, keysList);
  }

  const res = this.getEmptyObject(-$offset);
  const $new = keysList.length && !res.hasOwnProperty(keysList[0]);

  for (let i = 0; i < keysList.length; i++) {
    const name = keysList[i];
    this.setOnObject(res, name, valsList[i], $new);
  }

  this.$stack.push(res)
};
module.exports.$call = function call($offset, $length) {
  const newVal = [];

  for (let i = 1; i < $length; i++) {
    this.processValue(this.$expressions[++$offset]);
    newVal.push(this.$stack.pop());
  }

  const len = $length - 1;
  const arr = this.getEmptyArray(-$offset);
  const $new = arr.length === 0;

  if ($new) {
    arr.push([]);
  }

  const args = arr[0];

  for (let i = 0; i < len; i++) {
    this.setOnArray(args, i, newVal[i], $new);
  }

  if (arr.length === 1 || this.$tainted.has(args)) {
    arr[1] = this.$funcLib[args[0]].apply(this.$res, args.slice(1));
  }

  this.$stack.push(arr[1])
};
module.exports.$bind = function bind($offset, $length) {
  const newVal = [];

  for (let i = 1; i < $length; i++) {
    this.processValue(this.$expressions[++$offset]);
    newVal.push(this.$stack.pop());
  }

  const len = $length - 1;
  const arr = this.getEmptyArray(-$offset);

  if (arr.length === 0) {
    arr.push([]);
  }

  const args = arr[0];

  for (let i = 0; i < len; i++) {
    args[i] = newVal[i];
  }

  if (arr.length === 1) {
    arr[1] = (...extraArgs) => {
      const fn = this.$funcLibRaw[args[0]] || this.$res[args[0]];
      return fn.apply(this.$res, args.slice(1).concat(extraArgs));
    };
  }

  this.$stack.push(arr[1])
};
module.exports.$assign = function assign($offset, $length) {
  this.processValue(this.$expressions[++$offset]);
  let src = this.$stack.pop();
  this.$collections.push(src);
  const $storage = this.initOutput($offset - $length, emptyObj, nullFunc);
  const $out = $storage[1];
  const $invalidatedKeys = $storage[2];
  const $new = $storage[3];

  if ($new) {
    Object.assign($out, ...src);
  } else {
    const res = Object.assign({}, ...src);
    Object.keys(res).forEach(key => {
      this.setOnObject($out, key, res[key], $new);
    });
    Object.keys($out).forEach(key => {
      if (!res.hasOwnProperty(key)) {
        this.deleteOnObject($out, key, $new);
      }
    });
    $invalidatedKeys.clear();
  }

  this.$stack.push($out)
  this.$collections.pop();
  this.$currentSets.pop();
};
module.exports.$defaults = function defaults($offset, $length) {
  this.processValue(this.$expressions[++$offset]);
  let src = this.$stack.pop();
  this.$collections.push(src);
  const $storage = this.initOutput($offset - $length, emptyObj, nullFunc);
  const $out = $storage[1];
  const $invalidatedKeys = $storage[2];
  const $new = $storage[3];
  src = [...src].reverse();

  if ($new) {
    Object.assign($out, ...src);
  } else {
    const res = Object.assign({}, ...src);
    Object.keys(res).forEach(key => {
      this.setOnObject($out, key, res[key], $new);
    });
    Object.keys($out).forEach(key => {
      if (!res.hasOwnProperty(key)) {
        this.deleteOnObject($out, key, $new);
      }
    });
    $invalidatedKeys.clear();
  }

  this.$stack.push($out)
  this.$collections.pop();
  this.$currentSets.pop();
};
module.exports.$flatten = function flatten($offset, $length) {
  this.processValue(this.$expressions[++$offset]);
  let src = this.$stack.pop();
  this.$collections.push(src);
  const $storage = this.initOutput($offset - $length, emptyArr, emptyArr);
  const $out = $storage[1];
  const $invalidatedKeys = $storage[2];
  const $new = $storage[3];
  const $cache = $storage[4];
  const length = src.length;
  const initialLength = $out.length;

  if ($new) {
    for (let pos = 0, i = 0; i < length; i += 1) {
      $cache[i] = src[i].length;

      for (let j = 0; j < $cache[i]; j += 1) {
        $out[pos + j] = src[i][j];
      }

      pos += $cache[i];
    }
  } else {
    let pos = 0;

    for (let key = 0; key < length; key += 1) {
      let partLen = src[key].length;

      if ($invalidatedKeys.has(key)) {
        if ($cache[key] && $cache[key] === partLen) {
          src[key].forEach((value, index) => this.setOnArray($out, pos + index, value, $new));
          pos += $cache[key];
        } else {
          for (; key < length; key += 1) {
            partLen = src[key].length;
            src[key].forEach((value, index) => this.setOnArray($out, pos + index, value, $new));
            $cache[key] = partLen;
            pos += partLen;
          }
        }
      } else {
        pos += partLen;
      }
    }

    $invalidatedKeys.clear();
    initialLength !== pos && this.truncateArray($out, pos);
  }

  this.$stack.push($out)
  this.$collections.pop();
  this.$currentSets.pop();
};
module.exports.$size = function size($offset, $length) {
  this.processValue(this.$expressions[++$offset]);
  let src = this.$stack.pop();
  this.$collections.push(src);
  this.$stack.push(Array.isArray(src) ? src.length : Object.keys(src).length)
  this.$collections.pop();
};
module.exports.$isEmpty = function isEmpty($offset, $length) {
  this.processValue(this.$expressions[++$offset]);
  let src = this.$stack.pop();
  this.$collections.push(src);
  this.$stack.push(Array.isArray(src) ? src.length === 0 : Object.keys(src).length === 0)
  this.$collections.pop();
};
module.exports.$last = function last($offset, $length) {
  this.processValue(this.$expressions[++$offset]);
  let src = this.$stack.pop();
  this.$collections.push(src);
  this.$stack.push(src[src.length - 1])
  this.$collections.pop();
};
module.exports.$sum = function sum($offset, $length) {
  this.processValue(this.$expressions[++$offset]);
  let src = this.$stack.pop();
  this.$collections.push(src);
  const $storage = this.initOutput($offset - $length, emptyArr, emptyArr);
  const $out = $storage[1];
  const $invalidatedKeys = $storage[2];
  const $new = $storage[3];
  const $cache = $storage[4];
  const length = src.length;

  if ($new) {
    $cache[0] = 0;
    $cache[1] = [];

    for (let i = 0; i < length; i++) {
      $cache[0] += src[i];
      $cache[1][i] = src[i];
    }
  } else {
    $invalidatedKeys.forEach(key => {
      const cached = $cache[1][key] || 0;
      const live = src[key] || 0;
      $cache[0] = $cache[0] - cached + live;
      $cache[1][key] = live;
    });
    $cache[1].length = length;
    $invalidatedKeys.clear();
  }

  $out[0] = $cache[0];
  this.$stack.push($out[0])
  this.$collections.pop();
  this.$currentSets.pop();
};
module.exports.$range = function range($offset, $length) {
  this.processValue(this.$expressions[++$offset]);

  if ($length > 2) {
    this.processValue(this.$expressions[++$offset]);
  } else {
    this.$stack.push(0);
  }

  if ($length > 3) {
    this.processValue(this.$expressions[++$offset]);
  } else {
    this.$stack.push(1);
  }

  const step = this.$stack.pop();
  const start = this.$stack.pop();
  const end = this.$stack.pop();
  const $out = this.getEmptyArray(-$offset);
  let res;

  if ($out.length === 0) {
    res = [];
    $out.push(res);

    for (let val = start; step > 0 && val < end || step < 0 && val > end; val += step) {
      res.push(val);
    }
  } else {
    let len = 0;
    res = $out[0];

    for (let val = start; step > 0 && val < end || step < 0 && val > end; val += step) {
      this.setOnArray(res, len, val, false);
      len++;
    }

    if (res.length > len) {
      this.truncateArray(res, len);
    }
  }

  this.$stack.push(res)
};

/*
// constantValues
this.$trackingMap = new WeakMap();
this.$trackingWildcards = new WeakMap();
this.$invalidatedMap = new WeakMap();
this.$invalidatedRoots = new Set();
this.$first = true;
this.$tainted = new WeakSet();
untrack($targetKeySet, $targetKey) {
  const $tracked = $targetKeySet.$tracked;

  if (!$tracked || !$tracked.has($targetKey)) {
    return;
  }

  const $trackedByKey = $tracked.get($targetKey);

  for (let i = 0; i < $trackedByKey.length; i += 3) {
    const $trackingSource = this.$trackingMap.get($trackedByKey[i]);
    $trackingSource[$trackedByKey[i + 1]].delete($trackedByKey[i + 2]);
  }

  $tracked.delete($targetKey);
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
      $invalidatedKeys.$subKeys.delete($key);
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
  const $invalidatedKeys = this.$invalidatedMap.get($target);

  for (let i = newLen; i < $target.length; i++) {
    this.triggerInvalidations($target, i, true);

    if ($invalidatedKeys) {
      $invalidatedKeys.$subKeys.delete(i);
    }
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
  let tracking = $tracked.get($target[1]);

  if (!tracking) {
    $tracked.set($target[1], tracking = []);
  }

  tracking.push($sourceObj, $sourceKey, $target);
}
trackPath($offset, $length) {
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
initOutput($tracked, src, func, createDefaultValue, createCacheValue) {
  const $subKeys = $tracked[0].$subKeys;

  if (!$subKeys.has($tracked[1])) {
    $subKeys.set($tracked[1], new Map());
  }

  const $cachePerTargetKey = $subKeys.get($tracked[1]);
  let $cachedByFunc = $cachePerTargetKey.get(func);

  if (!$cachedByFunc) {
    const $resultObj = createDefaultValue();
    const $cacheValue = createCacheValue();
    const $invalidatedKeys = new Set();
    $invalidatedKeys.$subKeys = new Map();
    $invalidatedKeys.$parentKey = $tracked[1];
    $invalidatedKeys.$parent = $tracked[0];
    $invalidatedKeys.$tracked = new Map();
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
  const $subKeys = $tracked[0].$subKeys;

  if (!$subKeys.has($tracked[1])) {
    $subKeys.set($tracked[1], new Map());
  }

  const $cachePerTargetKey = $subKeys.get($tracked[1]);

  if (!$cachePerTargetKey.has(token)) {
    $cachePerTargetKey.set(token, []);
  }

  return $cachePerTargetKey.get(token);
}
getEmptyObject($tracked, token) {
  const $subKeys = $tracked[0].$subKeys;

  if (!$subKeys.has($tracked[1])) {
    $subKeys.set($tracked[1], new Map());
  }

  const $cachePerTargetKey = $subKeys.get($tracked[1]);

  if (!$cachePerTargetKey.has(token)) {
    $cachePerTargetKey.set(token, {});
  }

  return $cachePerTargetKey.get(token);
}
invalidatePath(path) {
  path.forEach((part, index) => {
    this.triggerInvalidations(getAssignableObject(path, index), part, index === path.length - 1);
  });
}
set(path, value) {
  ensurePath(path);
  this.invalidatePath(path);
  applySetter(getAssignableObject(path, path.length - 1), path[path.length - 1], value);
}
splice(pathWithKey, len, ...newItems) {
  ensurePath(pathWithKey);
  const key = pathWithKey[pathWithKey.length - 1];
  const path = pathWithKey.slice(0, pathWithKey.length - 1);
  const arr = getAssignableObject(path, path.length);
  const origLength = arr.length;
  const end = len === newItems.length ? key + len : Math.max(origLength, origLength + newItems.length - len);

  for (let i = key; i < end; i++) {
    this.triggerInvalidations(arr, i, true);
  }

  this.invalidatePath(pathWithKey);
  arr.splice(key, len, ...newItems);
}
*/

