function base() {
  function $NAME($model) {
    const $context = { $ready: {} };
    const res = { $model };

    function context($path) {
      let $childContext = $context;
      for (let i = 0; i < $path.length; i++) {
        if (!$childContext.hasOwnProperty($path[i])) {
          $childContext[$path[i]] = { tracks: [], tracked: {} };
        }
        $childContext = $childContext[$path[i]];
      }
      return $childContext;
    }

    function invalidate($path) {
      $context.$ready[$path[0]] = false;
      let $childContext = $context;
      for (let i = 0; i < $path.length; i++) {
        if (!$childContext.hasOwnProperty($path[i])) {
          $childContext[$path[i]] = { tracks: [], tracked: {} };
        }
        $childContext.invalid = $childContext.invalid || {};
        $childContext.invalid[$path[i]] = true;
        $childContext = $childContext[$path[i]];
      }
    }

    function pathToStr($path) {
      return $path.map(x => '' + x).join('.');
    }

    function track($currentPath, $trackedPath) {
      const $currentContext = context($currentPath);
      const $trackedContext = context($trackedPath);
      $currentContext.tracks = $currentContext.tracks || [];
      $currentContext.tracks.push($trackedPath);
      $trackedContext.tracked = $trackedContext.tracked || {};
      $trackedContext.tracked[pathToStr($currentPath)] = $currentPath;
    }

    function untrack($path) {
      const $currentContext = context($path);
      $currentContext.tracks.forEach($trackedPath => {
        const $trackedContext = context($trackedPath);
        delete $trackedContext.tracked[pathToStr($trackedPath)];
      });
      $currentContext.tracks = [];
    }

    function triggerInvalidations($path) {
      const $currentContext = context($path);
      if (!$currentContext.tracked) {
        return;
      }
      Object.keys($currentContext.tracked).forEach(key => {
        invalidate($currentContext.tracked[key]);
      });
    }

    function forObject($path, arg0, arg1) {
      const $localContext = context($path);
      const invalidKeys = $localContext.hasOwnProperty('invalid')
        ? Object.keys($localContext.invalid)
        : Object.keys(arg1);
      $localContext.output = $localContext.output || {};
      $localContext.invalid = {};
      return invalidKeys.reduce((acc, key) => {
        const $newPath = $path.concat(key);
        arg0($newPath, arg1, key, acc);
        return acc;
      }, $localContext.output);
    }

    /* ALL_EXPRESSIONS */

    function recalculate() {
      /* DERIVED */
    }
    Object.assign(res, {
      /* SETTERS */
    });
    recalculate();
    return res;
  }
}

function topLevel() {
  $context.$ready.$FUNCNAME = false;
  let $$FUNCNAMEValue;
  function $$FUNCNAMEBuild() {
    const $path = ['$FUNCNAME'];
    $$FUNCNAMEValue = $EXPR;
    $context.$ready.$FUNCNAME = true;
    return $$FUNCNAMEValue;
  }
}
function mapValues() {
  function $FUNCNAME($path, src, arg1, acc) {
    let $changed = false;
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
  function $FUNCNAME($path, src, arg1, acc) {
    let $changed = false;
    const arg0 = src[arg1];
    if (!src.hasOwnProperty(arg1) && acc.hasOwnProperty(arg1)) {
      delete acc[arg1];
      $changed = true;
    } else {
      const res = $EXPR1;
      if (res) {
        acc[arg1] = arg0;
        $changed = acc[arg1] !== arg0;
      } else if (acc.hasOwnProperty(arg1)) {
        delete acc[arg1];
        $changed = true;
      }
    }
    /* TRACKING */
  }
}
module.exports = { base, topLevel, mapValues, filterBy };
