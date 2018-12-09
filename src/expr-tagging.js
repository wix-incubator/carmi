const {
  Expr,
  Token,
  Expression,
  SetterExpression,
  TopLevel,
  Root,
  Get,
  Clone,
  TokenTypeData,
  SourceTag
} = require('./lang');
const { memoizeExprFunc, memoize } = require('./memoize');
const objectHash = require('object-hash');
const path = require('path');

let exprCounter = 0;

const _ = require('lodash');
const toposort = require('toposort');

function tokenData(expr) {
  return TokenTypeData[expr[0].$type];
}

function tryToHoist(expr) {
  return tokenData(expr).tryToHoist;
}

function chainIndex(expr) {
  return tokenData(expr).chainIndex;
}

// function printPaths(paths) {
//   const output = []
//   paths.forEach((cond,path) => {
//     output.push([path.map(stringifyExpr).join(','), cond]);
//   })
//   console.log(output);
// }

function annotatePathsThatCanBeInvalidated(exprsByFunc) {
  const paths = new Map();
  const allGettersChains = exprsByFunc.filter(
    expr => expr[0].$type === 'get' && (!expr[0].$parent || expr[0].$parent[0].$type !== 'get')
  );
  const foundByType = { root: false, context: false };
  _.forEach(allGettersChains, chainedGetter => {
    let currentStep = chainedGetter;
    let path = [];
    while (currentStep instanceof Expression && currentStep[0].$type === 'get') {
      path.unshift(currentStep[1]);
      currentStep = currentStep[2];
    }
    if (currentStep instanceof Token) {
      foundByType[currentStep.$type] = true;
    }
    path.unshift(currentStep);
    paths.set(path, chainedGetter[0].$conditional ? chainedGetter[0].$id : false);
  });
  exprsByFunc.forEach(expr => {
    expr.forEach(token => {
      if (token instanceof Token && foundByType[token.$type] === false) {
        foundByType[token.$type] = true;
        paths.set([token], expr[0].$conditional ? expr[0].$id : false)
      }
    })
  });
  const groupedPaths = {};
  paths.forEach((cond, path) => {
    const pathAsStr = path.map(stringifyExpr).join(',');
    groupedPaths[pathAsStr] = groupedPaths[pathAsStr] || [];
    groupedPaths[pathAsStr].push(path);
  });
  const outputPaths = new Map();
  _.forEach(groupedPaths, (similiarPaths, pathAsStr) => {
    const conditionals = similiarPaths.map(path => paths.get(path));
    if (conditionals.some(cond => cond === false)) { // one of the usages of the path is unconditional
      outputPaths.set(similiarPaths[0], false);
    } else {
      outputPaths.set(similiarPaths[0], _.uniq(conditionals));
    }
  })
  return outputPaths;
}

function getAllFunctions(sourceExpr) {
  const allExpressions = flattenExpression(sourceExpr);
  const exprByFunc = _.groupBy(allExpressions, expr => expr[0].$funcId);
  return _.map(exprByFunc, expressions => expressions[0]);
}

function pathFragmentToString(token) {
  if (typeof token === 'string' || typeof token === 'number') {
    return token;
  } else if (token.$type === 'root' || token.$type === 'topLevel') {
    return token.$type;
  } else {
    return '*';
  }
}

function pathToString(path) {
  return path.map(pathFragmentToString).join('.');
}
/*
function exprContains(expr, str) {
  if (expr === str) {
    return true;
  } else if (expr instanceof Expression) {
    return expr.some(child => exprContains(child, str));
  }
}
*/

function tagExpressionFunctionsWithPathsThatCanBeInvalidated(sourceExpr) {
  const exprFuncs = getAllFunctions(sourceExpr);
  _.forEach(exprFuncs, func => {
    const allExprs = flattenExpression(func);
    const allExprsInFunc = _.filter(allExprs, expr => func[0].$funcId === expr[0].$funcId);
    func[0].$path = annotatePathsThatCanBeInvalidated(allExprsInFunc);
  });
}

function tagExpressions(expr, name, currentDepth, indexChain, funcType, rootName) {
  if (expr[0].$id) {
    return; //Already tagged
  }
  expr[0].$id = exprCounter++;
  expr[0].$funcId = name;
  expr[0].$rootName = rootName;
  expr[0].$depth = currentDepth;
  expr[0].$funcType = funcType;
  expr[0].$parent = null;
  expr.forEach((subExpression, childIndex) => {
    if (subExpression instanceof Expression) {
      if (subExpression[0].$type !== 'func') {
        tagExpressions(subExpression, name, currentDepth, indexChain.concat(childIndex), funcType, rootName);
      } else {
        subExpression[0].$funcType = expr[0].$type;
        tagExpressions(subExpression, name + '$' + expr[0].$id, currentDepth + 1, indexChain, expr[0].$type, rootName);
      }
      subExpression[0].$parent = expr;
    } else if (subExpression instanceof Token) {
      subExpression.$funcId = name;
      subExpression.$rootName = rootName;
      subExpression.$depth = currentDepth;
      subExpression.$funcType = funcType;
    }
  });
}

function flattenExpression(...expressions) {
  const nextExpr = expressions;
  const output = [];
  const visited = new WeakMap();
  while (nextExpr.length) {
    const currentExpr = nextExpr.shift();
    visited.set(currentExpr, true);
    output.push(currentExpr);
    currentExpr.forEach(subExpression => {
      if (subExpression instanceof Expression && !visited.has(subExpression)) {
        nextExpr.push(subExpression);
      }
    });
  }
  return output;
}

const isStaticExpression = memoize(expr => {
  let res = true;
  const areChildrenStatic = expr.map(token => {
    if (token instanceof Expression) {
      return isStaticExpression(token);
    } else if (token.$type === 'val' || token.$type === 'key' || token.$type === 'context') {
      return false;
    }
    return true;
  });
  return _.every(areChildrenStatic, (isChildStatic, index) => {
    return isChildStatic || (expr[index] instanceof Expression && expr[index][0].$type === 'func');
  });
});

const getRewriteUsingTopLevels = namesByExpr => {
  const rewriteUsingTopLevels = memoizeExprFunc(
    expr => {
      const str = stringifyExpr(expr);
      if (namesByExpr[str]) {
        return Expr(Get, namesByExpr[str], TopLevel);
      }
      return expr.map(child => rewriteUsingTopLevels(child));
    },
    token => token
  );
  return rewriteUsingTopLevels;
};

function tagToSimpleFilename(tag) {
  const lineParts = tag.split(path.sep);
  const fileName = lineParts[lineParts.length - 1].replace(/\).*/, '');
  const simpleName = fileName
    .split('.js:')[0]
    .replace(/\.carmi$/, '')
    .split('.')
    .find(x => x);
  return simpleName;
}

function generateName(namesByExpr, expr) {
  if (expr[0][SourceTag]) {
    const tag = expr[0][SourceTag];
    return '_' + [tagToSimpleFilename(tag)].concat(tag.split(':').slice(1)).join('_') + '_';
  }
  return _(expr)
    .tail()
    .reverse()
    .map(e => {
      const preNamed = namesByExpr[stringifyExpr(e)];
      if (preNamed) {
        return preNamed;
      } else {
        return _.find(_.flattenDeep(e), x => typeof x === 'string') || '';
      }
    })
    .join('');
}

let stringifiedMap = new WeakMap();
let stringsToHashes = {};

function stringifyExpr(expr) {
  if (!(expr instanceof Expression)) {
    return JSON.stringify(expr);
  }
  if (!stringifiedMap.has(expr)) {
    const str = expr.map(stringifyExpr).join(',');
    if (!stringsToHashes[str]) {
      stringsToHashes[str] = objectHash(str);
    }
    stringifiedMap.set(expr, stringsToHashes[str]);
  }
  return stringifiedMap.get(expr);
}

function clearStringifyMap() {
  stringifiedMap = new WeakMap();
  stringsToHashes = {};
}

function extractAllStaticExpressionsAsValues(getters) {
  const allExpressions = flattenExpression(...Object.values(getters));
  const allStaticExpressions = _.filter(allExpressions, isStaticExpression);
  const allStaticAsStrings = allStaticExpressions.reduce((acc, e) => {
    acc[stringifyExpr(e)] = e;
    return acc;
  }, {});
  const namesByExpr = _(getters)
    .mapValues(e => stringifyExpr(e))
    .invert()
    .value();
  const allStaticStringsSorted = _(allStaticAsStrings)
    .keys()
    .sortBy(s => s.length)
    .value();
  let nodeIndex = 0;
  _.forEach(allStaticStringsSorted, s => {
    const e = allStaticAsStrings[s];
    if (!namesByExpr[s] && tryToHoist(e)) {
      namesByExpr[s] = '$' + e[0].$type + generateName(namesByExpr, e) + nodeIndex++;
    }
  });
  const rewriteUsingTopLevels = getRewriteUsingTopLevels(namesByExpr);
  const newGetters = {};
  _.forEach(namesByExpr, (name, hash) => {
    newGetters[name] = allStaticAsStrings[hash].map(rewriteUsingTopLevels);
  });
  return newGetters;
}

function cloneExpressions(getters) {
  return _.mapValues(getters, getter => Clone(getter));
}

function tagAllExpressions(getters) {
  _.forEach(getters, (getter, name) => tagExpressions(getter, name, 0, [1], 'topLevel', name));
}

function tagUnconditionalExpressions(expr, cond) {
  if (!(expr instanceof Expression)) {
    return;
  }
  expr[0].$conditional = !!cond;
  const $type = expr[0].$type;
  if ($type === 'or' || $type === 'and' || $type == 'ternary') {
    tagUnconditionalExpressions(expr[1], cond);
    expr.slice(2).forEach(subExpr => tagUnconditionalExpressions(subExpr, true));
  } else if ($type === 'func') {
    tagUnconditionalExpressions(expr[1], false);
  } else {
    expr.slice(1).forEach(subExpr => tagUnconditionalExpressions(subExpr, cond));
  }
}

function unmarkPathsThatHaveNoSetters(getters, setters) {
  const currentSetters = Object.values(setters);
  topologicalSortGetters(getters).forEach(name => {
    const getter = getters[name];
    const exprPathsMaps = _(flattenExpression([getter]))
      .filter(e => e instanceof Expression && e[0].$path)
      .map(e => e[0].$path)
      .value();
    let canBeExprBeInvalidated = false;
    exprPathsMaps.forEach(pathMap =>
      pathMap.forEach((cond, path) => {
        if (_.some(currentSetters, setter => pathMatches(path, setter))) {
          canBeExprBeInvalidated = true;
        } else if (path[0].$type !== 'context') {
          pathMap.delete(path);
        }
      })
    );
    if (canBeExprBeInvalidated) {
      currentSetters.push([TopLevel, name]);
    }
  });
}

const deadCodeElimination = memoizeExprFunc(
  expr => {
    const children = expr.map((child, idx) => deadCodeElimination(child));
    const tokenType = expr[0].$type;
    switch (tokenType) {
      case 'or':
        const firstTruthy = expr.slice(1).findIndex(t => Object(t) !== t && t);
        if (firstTruthy === 0) {
          return children[1];
        } else if (firstTruthy > 0) {
          return Expr(...children.slice(0, firstTruthy + 2));
        }
      case 'and':
        const firstFalsy = expr
          .slice(1)
          .findIndex(t => (Object(t) !== t && !t) || (t instanceof Token && t.$type === 'null'));
        if (firstFalsy === 0) {
          return children[1];
        } else if (firstFalsy > 0) {
          return Expr(...children.slice(0, firstFalsy + 2));
        }
    }
    return children;
  },
  token => token
);

function normalizeAndTagAllGetters(getters, setters) {
  clearStringifyMap();
  getters = _.mapValues(getters, deadCodeElimination);
  getters = extractAllStaticExpressionsAsValues(getters);
  getters = cloneExpressions(getters);
  tagAllExpressions(getters);
  _.forEach(getters, getter => tagUnconditionalExpressions(getter, false));
  _.forEach(getters, getter => tagExpressionFunctionsWithPathsThatCanBeInvalidated(getter));
  unmarkPathsThatHaveNoSetters(getters, setters);
  return getters;
}

const allPathsInGetter = memoize(getter => {
  return _(flattenExpression([getter]))
    .filter(e => e instanceof Expression && e[0].$path)
    .map(e => Array.from(e[0].$path.entries()))
    .flatten()
    .reduce((acc, item) => {
      acc.set(item[0], item[1]);
      return acc;
    }, new Map());
});

function pathMatches(srcPath, trgPath) {
  // console.log('pathMatches', srcPath, trgPath);
  return srcPath.every(
    (part, idx) =>
      typeof trgPath[idx] === 'undefined' || pathFragmentToString(part) === pathFragmentToString(trgPath[idx])
  );
}

function findReferencesToPathInAllGetters(path, getters) {
  const pathsInAllGetters = _.mapValues(getters, getter => Array.from(allPathsInGetter(getter).keys()));
  const res = _(pathsInAllGetters).reduce((accAllGetters, allPaths, name) => {
    const getterRelevant = _.filter(allPaths, exprPath => pathMatches(path, exprPath));
    if (getterRelevant.length) {
      accAllGetters[name] = getterRelevant;
    }
    return accAllGetters;
  }, {});
  return res;
}

function collectAllTopLevelInExpr(expr, acc) {
  acc = acc || {};
  if (expr[0].$type === 'get' && expr[2] instanceof Token && expr[2].$type === 'topLevel') {
    acc[expr[1]] = true;
  } else {
    expr.forEach(token => {
      if (token instanceof Expression) {
        collectAllTopLevelInExpr(token, acc);
      }
    });
  }
  return acc;
}

function topologicalSortGetters(getters) {
  const vertices = _(getters)
    .map((expr, name) => {
      const usedTopLevels = collectAllTopLevelInExpr(expr);
      return Object.keys(usedTopLevels)
        .map(topName => [topName, name])
        .concat([[name, '$model']]);
    })
    .flatten()
    .value();
  return toposort(vertices).filter(x => x !== '$model');
}

function splitSettersGetters(model) {
  const setters = _.pickBy(model, v => v instanceof SetterExpression);
  _.forEach(setters, setter => {
    if (!(setter[0] instanceof Token) || setter[0].$type !== 'root') {
      setter.unshift(Root);
    }
  });
  const getters = _.pickBy(model, v => v instanceof Expression);
  return {
    getters,
    setters
  };
}

function findFuncExpr(getters, funcId) {
  return _(getters)
    .map(getAllFunctions)
    .flatten()
    .find(e => e[0].$funcId === funcId);
}

module.exports = {
  findReferencesToPathInAllGetters,
  pathMatches,
  topologicalSortGetters,
  pathFragmentToString,
  tagAllExpressions,
  splitSettersGetters,
  normalizeAndTagAllGetters,
  allPathsInGetter,
  findFuncExpr,
  tagToSimpleFilename
};
