const {
  Expr,
  Gte,
  Gt,
  Or,
  And,
  Invoke,
  Not,
  Quote,
  Eq,
  Cond,
  Token,
  Expression,
  SetterExpression,
  TopLevel,
  Root,
  Get,
  Clone,
  WrappedPrimitive,
  TokenTypeData,
  SourceTag,
  cloneToken
} = require('./lang');
const {memoizeExprFunc, memoize} = require('./memoize');
const {exprHash} = require('./expr-hash');
const {flattenExpression, getAllFunctions, flattenExpressionWithoutInnerFunctions} = require('./expr-search');
const {tagToSimpleFilename} = require('./expr-names');
const {rewriteStaticsToTopLevels, rewriteLocalsToFunctions, rewriteUniqueByHash} = require('./expr-rewrite');
const {or, and, not} = require('./expr-logic');
let exprCounter = 1;
let taggedExprs = {};

const _ = require('lodash');
const toposort = require('toposort');


function printPaths(title, paths) {
  const output = []
  paths.forEach((cond, path) => {
    let condValue = cond
    if (cond instanceof Expression) {
      condValue = JSON.parse(JSON.stringify(cond))
    } else if (cond) {
      condValue = [cond[0].$id, cond[1]]
    }
    output.push([path.map(exprHash).join(','), condValue]);
  })
  console.log(title, output);
}

function genUsedOnlyAsBooleanValue(expr) {
  const parent = expr[0].$parent;
  const indexInParent = parent ? parent.indexOf(expr) : -1;
  if (parent && (parent[0].$type === 'and' || parent[0].$type === 'or')) {
    return Expr(Gt, Expr(Cond, parent.$id), indexInParent)
  }
  if (parent && (parent[0].$type === 'ternary' && indexInParent === 1)) {
    return true;
  }
  if (parent && (parent[0].$type === 'get' && indexInParent === 2)) {
    return true;
  }
  if (parent && (parent[0].$type === 'not' || parent.$type === 'isUndefined')) {
    return true;
  }
  return false;
}

function countPathParts(pathAsStr) {
  return pathAsStr.split(',').length;
}

function generatePathCondExpr(pathExpressions, pathAsStr, outputCondsByPathStr) {
  const pathPartsCnt = countPathParts(pathAsStr);
  const nearestDeeperPaths = Object.keys(outputCondsByPathStr).filter(otherPathStr => countPathParts(otherPathStr) === pathPartsCnt + 1 &&
    otherPathStr.substr(0, pathAsStr.length) === pathAsStr);
  const nearestDeeperPathsCond = or(...nearestDeeperPaths.map(otherPathStr => outputCondsByPathStr[otherPathStr]))
  const condsOfOnlyTested = [];
  const condsOfUsed = [];
  pathExpressions.forEach(expr => {
    let condOfExpr = true;
    if (expr[0].$conditional) {
      const condId = expr[0].$conditional[0][0].$id;
      const condBranch = expr[0].$conditional[1];
      const condIsTernary = expr[0].$conditional[0][0].$type === 'ternary';
      condOfExpr = Expr(condIsTernary ? Eq : Gte, Expr(Cond, condId), condBranch);
    }
    const usedAsBool = genUsedOnlyAsBooleanValue(expr);
    if (usedAsBool) {
      condsOfOnlyTested.push(condOfExpr);
    } else {
      condsOfUsed.push(condOfExpr)
    }
  });
  const touchedButNotDeeper = and(or(...condsOfOnlyTested), not(nearestDeeperPathsCond))
  const pathCond = or(...condsOfUsed, touchedButNotDeeper)
  // console.log(JSON.stringify(condOfTracking, null, 2));
  return {pathCond, used: or(...condsOfUsed, ...condsOfOnlyTested)};
}

function groupPathsThatCanBeInvalidated(paths) {
  const groupedPaths = {};
  paths.forEach((cond, path) => {
    const pathAsStr = path.map(part => {
      if (typeof part === 'string' || typeof part === 'number') {
        return `${part}`;
      }
      if (part instanceof Token && part.$type === 'root' || part.$type === 'topLevel') {
        return `***${part.$type}***`;
      }
      return exprHash(part);
    }).join(',');
    groupedPaths[pathAsStr] = groupedPaths[pathAsStr] || [];
    groupedPaths[pathAsStr].push(path);
  });
  const pathStringsSortedInnerFirst = Array.from(Object.keys(groupedPaths))
    .sort()
    .reverse()
  // console.log(groupedPaths,pathStringsSortedInnerFirst)
  const outputPaths = new Map();
  const outputCondsByPathStr = {};
  pathStringsSortedInnerFirst
    .forEach(pathAsStr => {
      const similiarPaths = groupedPaths[pathAsStr];
      const {pathCond, used} = generatePathCondExpr(similiarPaths.map(path => paths.get(path)), pathAsStr, outputCondsByPathStr)
      outputCondsByPathStr[pathAsStr] = used;
      if (pathCond) {
        outputPaths.set(similiarPaths[0], pathCond);
      }
    });
  return outputPaths;
}

function annotatePathsThatCanBeInvalidated(exprsByFunc) {
  const paths = new Map();
  const allGettersChains = exprsByFunc.filter(
    expr => expr[0].$type === 'get' && (!expr[0].$parent || expr[0].$parent[0].$type !== 'get' || expr[0].$parent[2] !== expr)
  );
  const foundByType = {root: false, context: false};
  _.forEach(allGettersChains, chainedGetter => {
    let currentStep = chainedGetter;
    const path = [];
    while (currentStep instanceof Expression && currentStep[0].$type === 'get') {
      path.unshift(currentStep[1]);
      currentStep = currentStep[2];
    }
    if (currentStep instanceof Token) {
      foundByType[currentStep.$type] = true;
    }
    path.unshift(currentStep);
    paths.set(path, chainedGetter);
  });
  exprsByFunc.forEach(expr => {
    expr.forEach(token => {
      if (token instanceof Token && foundByType[token.$type] === false) {
        foundByType[token.$type] = true;
        paths.set([token], expr)
      }
    })
  });
  return groupPathsThatCanBeInvalidated(paths);
}

function pathFragmentToString(token) {
  if (typeof token === 'string' || typeof token === 'number') {
    return token;
  } else if (token.$type === 'root' || token.$type === 'topLevel') {
    return token.$type;
  } else if (token instanceof Expression && token[0].$type === 'invoke') {
    return token[1];
  }
  return '*';
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
  if (expr[0].hasOwnProperty('$id')) {
    return; //Already tagged
  }
  const hash = exprHash(expr);
  if (!taggedExprs[hash]) {
    taggedExprs[hash] = exprCounter++;
  }
  expr[0].$id = taggedExprs[hash];
  expr[0].$funcId = name;
  expr[0].$rootName = rootName;
  expr[0].$depth = currentDepth;
  expr[0].$funcType = funcType;
  expr[0].$tracked = false;
  expr[0].$parent = null;
  // console.log(expr[0].$id, expr[0].$type)
  if (expr[0].$tokenType === 'abstract') {
    throw new Error(`You defined a abstract in ${expr[0].SourceTag} called ${expr[1]} but did't resolve it`);
  }
  expr.forEach((subExpression, childIndex) => {
    if (subExpression instanceof Expression) {
      if (subExpression[0].$type !== 'func') {
        tagExpressions(subExpression, name, currentDepth, indexChain.concat(childIndex), funcType, rootName);
      } else {
        subExpression[0].$funcType = expr[0].$type;
        tagExpressions(subExpression, `${name}$${expr[0].$id}`, currentDepth + 1, indexChain, expr[0].$type, rootName);
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

const cloneAndHash = expr => {
  if (expr instanceof Expression) {
    const hash = exprHash(expr);
    const res = new Expression(...expr.map(cloneAndHash));
    res[0].$hash = hash;
    return res;
  } else if (expr instanceof Token) {
    return cloneToken(expr);
  }
  return expr;
}


function cloneExpressions(getters) {
  return _.mapValues(getters, getter => Clone(getter));
}

function tagAllExpressions(getters) {
  exprCounter = 1;
  taggedExprs = {};
  _.forEach(getters, (getter, name) => tagExpressions(getter, name + exprCounter++, 0, [1], getter[0].$type === 'func' ? 'helperFunc' : 'topLevel', name));
}

function tagUnconditionalExpressions(expr, cond) {
  if (!(expr instanceof Expression)) {
    return;
  }
  expr[0].$conditional = cond;
  const $type = expr[0].$type;
  if ($type === 'or' || $type === 'and' || $type === 'ternary') {
    tagUnconditionalExpressions(expr[1], cond);
    expr.slice(2).forEach((subExpr, subIndex) => tagUnconditionalExpressions(subExpr, [expr, subIndex + 2]));
  } else if ($type === 'func') {
    tagUnconditionalExpressions(expr[1], false);
  } else {
    expr.slice(1).forEach(subExpr => tagUnconditionalExpressions(subExpr, cond));
  }
}

function parentFunction(expr) {
  if (expr[0].$type === 'func' || !expr[0].$parent) {
    return expr;
  }
  return parentFunction(expr[0].$parent);
}

function unmarkPathsThatHaveNoSetters(getters, setters) {
  const currentSetters = Object.values(setters);
  // const invalidatingGetters = {}
  topologicalSortGetters(getters).forEach(name => {
    // console.log('unmarkPathsThatHaveNoSetters', name);
    const getter = getters[name];
    const allExprInGetter = flattenExpression([getter])
    const exprPathsMaps = _(allExprInGetter)
      .filter(e => e instanceof Expression && e[0].$path)
      .map(e => e[0].$path)
      .value();
    let canBeExprBeInvalidated = allExprInGetter.some(e => e[0].$type === 'invoke' && getters[e[1]][0].$invalidates);
    const condsThatAreTracked = new Set();
    exprPathsMaps.forEach(pathMap => {
      // console.log('pathsTracked', JSON.stringify(Array.from(pathMap.keys())));
      pathMap.forEach((cond, path) => {
        let trackCond = false;
        const matchedSetter = _.some(currentSetters, setter => pathMatches(path, setter));
        // console.log(name, matchedSetter, JSON.stringify(path))
        if (matchedSetter) {
          // console.log('path can be invalidated', JSON.stringify(path))
          canBeExprBeInvalidated = true;
          trackCond = true;
        } else if (path[0].$type !== 'context') {
          pathMap.delete(path);
        } else {
          canBeExprBeInvalidated = true;
          trackCond = true;
        }
        if (cond && trackCond) {
          const conditionalsByPath = flattenExpression([
            cond
          ]).filter(e => e instanceof Expression && e[0].$type === 'cond');
          conditionalsByPath.forEach(condPath => condsThatAreTracked.add(condPath[1]));
        }
        if (path[0].$type === 'topLevel' && path.length > 2 && TokenTypeData[getters[path[1]][0].$type].stable) {
          path.splice(0, 2, Expr(Get, path[1], TopLevel))
        }
      });
    });
    // if (name.indexOf('navigation') !== -1) {
    // console.log('unmarkPathsThatHaveNoSetters', name, canBeExprBeInvalidated, JSON.stringify(getter));
    // }
    if (canBeExprBeInvalidated) {
      if (getters[name][0].$type === 'func') {
        currentSetters.push([name]);
      } else {
        currentSetters.push([TopLevel, name]);
      }

      // console.log('added', name, condsThatAreTracked.size)
    }
    if (condsThatAreTracked.size) {
      // console.log(condsThatAreTracked)
      allExprInGetter.forEach(e => {
        if (e instanceof Expression && condsThatAreTracked.has(e[0].$id)) {
          e[0].$tracked = true;
          const parent = parentFunction(e);
          // console.log('TRACKED COND', JSON.stringify(parent), e[0].$id);
          parent[0].$trackedExpr = parent[0].$trackedExpr || new Set();
          parent[0].$trackedExpr.add(e[0].$id);
        }
      })
    }
    allExprInGetter.forEach(expr => {
      if (expr instanceof Expression) {
        expr[0].$invalidates = canBeExprBeInvalidated;
      }
    })
    // invalidatingGetters[name] = canBeExprBeInvalidated
  });
  // require('fs').writeFileSync('invalidates.json', JSON.stringify(invalidatingGetters, null, 2))
}

const wrapPrimitivesInQuotes = v => {
  if (typeof v === 'boolean' || typeof v === 'string' || typeof v === 'number') {
    return Expr(Quote, v);
  }
  if (v instanceof WrappedPrimitive) {
    return Expr(Quote, v.toJSON());
  }
  return v;
};

const canHaveSideEffects = memoizeExprFunc(expr => {
  if (expr[0].$type === 'call' || expr[0].$type === 'effect') {
    return true;
  }
  return expr.some(child => canHaveSideEffects(child));
}, () => false)

/*eslint no-fallthrough:0*/
/*eslint no-case-declarations:0*/
const deadCodeElimination = memoizeExprFunc(
  expr => {
    const children = expr.map((child, idx) => deadCodeElimination(child));
    const tokenType = expr[0].$type;
    switch (tokenType) {
      case 'quote':
        return children[1];
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
          .findIndex(t => Object(t) !== t && !t || t instanceof Token && t.$type === 'null');
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

/**
 *
 * @param {*} getters
 * @param {{changedFiles?: Set<string>}} options
 */
function dedupFunctionsObjects(getters, {changedFiles = new Set()} = {}) {
  const allExpressions = flattenExpression(...Object.values(getters));
  const changedTags = new Set([...changedFiles].map(file => tagToSimpleFilename(file)))
  _(allExpressions)
    .filter(([expr]) => expr.$type === 'func' && expr.$parent)
    .groupBy((expr) => `${exprHash(expr)}.${expr[0].$parent[0].$type}.${expr[0].$invalidates}`)
    .filter((group) => group.length > 1)
    .forEach((group) => {
        const changedExpression = group.find(([e]) => changedTags.has(e.$funcId.split('_')[1])) || group[0]
        group.forEach(e => {
          e[0].$duplicate = e === changedExpression ? false : changedExpression[0].$funcId
        })
    })

  _(allExpressions)
    .filter(([expr]) => expr.$type === 'object')
    .groupBy((expr) => _.range(1, expr.length, 2).map(index => `#${expr[index]}#`).join(','))
    .filter((group) => group.length > 1)
    .forEach((group) => {
      const changedExpression = group.find(([e]) => changedTags.has(e.$funcId.split('_')[1])) || group[0]
      group.forEach(expr => {
        if (expr !== changedExpression) {
          expr[0].$duplicate = changedExpression[0].$id;
        }
      })
    })
}

const allPathsInGetter = memoize(getter => _(flattenExpression([getter]))
  .filter(e => e instanceof Expression && e[0].$path)
  .map(e => Array.from(e[0].$path.entries()))
  .flatten()
  .reduce((acc, item) => {
    acc.set(item[0], item[1]);
    return acc;
  }, new Map()));

function pathMatches(srcPath, trgPath) {
  // console.log('pathMatches', JSON.stringify(srcPath), JSON.stringify(trgPath));
  return srcPath.every((part, idx) => {
    if (typeof trgPath[idx] === 'undefined') {
      return true;
    }
    const srcFrag = pathFragmentToString(part);
    const trgFrag = pathFragmentToString(trgPath[idx]);
    return srcFrag === trgFrag || srcFrag === '*' || trgFrag === '*';
  });
}

function collectAllTopLevelInExpr(expr, acc) {
  acc = acc || {};
  if (expr[0].$type === 'get' && expr[2] instanceof Token && expr[2].$type === 'topLevel' || expr[0].$type === 'invoke') {
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
  const getters = _.pickBy(model, v => v instanceof Expression || v instanceof WrappedPrimitive);
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

function normalizeAndTagAllGetters(getters, setters, options) {
  getters = rewriteUniqueByHash(getters, options);
  getters = _.mapValues(getters, getter => wrapPrimitivesInQuotes(deadCodeElimination(getter)));
  getters = rewriteStaticsToTopLevels(getters);
  getters = rewriteUniqueByHash(getters, options);
  if (!options.disableHelperFunctions) {
    getters = rewriteLocalsToFunctions(getters);
  }
  getters = cloneExpressions(getters);
  tagAllExpressions(getters);
  _.forEach(getters, getter => tagUnconditionalExpressions(getter, false));
  _.forEach(getters, getter => tagExpressionFunctionsWithPathsThatCanBeInvalidated(getter));
  unmarkPathsThatHaveNoSetters(getters, setters);
  Object.keys(getters).forEach(name => {
    // console.log(name, getters[name][0])
  })
  // _.forEach(getters, (e, name) => {
  //   flattenExpression(e).forEach(t => {
  //     console.log('unmarkPathsThatHaveNoSetters', name, t[0])
  //   })
  // })
  dedupFunctionsObjects(getters, options);
  let index = 0;
  topologicalSortGetters(getters).forEach(name => {
    if (getters[name][0].$type !== 'func') {// not a helper function
      getters[name][0].$topLevelIndex = index;
      index++
    }
  })
  return getters;
}

module.exports = {
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
