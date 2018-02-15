const $context = { $ready: {} };

function context($context, $path) {
  for (let i = 0; i < $path.length; i++) {
    if (!$context.hasOwnProperty($path[i])) {
      $context[$path[i]] = { tracks: [], tracked: {} };
    }
    $context = $context[$path[i]];
  }
  return $context;
}

function invalidate($context, $path) {
  $context.$ready[$path[0]] = false;
  for (let i = 0; i < $path.length; i++) {
    if (!$context.hasOwnProperty($path[i])) {
      $context[$path[i]] = { tracks: [], tracked: {} };
    }
    $context.invalid = $context.invalid || {};
    $context.invalid[$path[i]] = true;
    $context = $context[$path[i]];
  }
}

function pathToStr($path) {
  return $path.map(x => '' + x).join('.');
}

function track($context, $currentPath, $trackedPath) {
  const $currentContext = context($context, $currentPath);
  const $trackedContext = context($context, $trackedPath);
  $currentContext.tracks = $currentContext.tracks || [];
  $currentContext.tracks.push($trackedPath);
  $trackedContext.tracked = $trackedContext.tracked || {};
  $trackedContext.tracked[pathToStr($currentPath)] = $currentPath;
}

function untrack($context, $path) {
  const $currentContext = context($context, $path);
  $currentContext.tracks.forEach($trackedPath => {
    const $trackedContext = context($context, $trackedPath);
    delete $trackedContext.tracked[pathToStr($trackedPath)];
  });
  $currentContext.tracks = [];
}

function triggerInvalidations($context, $path) {
  const $currentContext = context($context, $path);
  if (!$currentContext.tracked) {
    return;
  }
  Object.keys($currentContext.tracked).forEach(key => {
    invalidate($context, $currentContext.tracked[key]);
  });
}

function forObject($model, $context, $path, arg0, arg1) {
  const $localContext = context($context, $path);
  const invalidKeys = $localContext.hasOwnProperty('invalid') ? Object.keys($localContext.invalid) : Object.keys(arg1);
  $localContext.output = $localContext.output || {};
  $localContext.invalid = {};
  return invalidKeys.reduce((acc, key) => {
    const $newPath = $path.concat(key);
    arg0($model, $context, $newPath, arg1, key, acc);
    return acc;
  }, $localContext.output);
}
