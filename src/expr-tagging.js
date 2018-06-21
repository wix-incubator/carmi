const {
  Expr,
  Token,
  Setter,
  Expression,
  SetterExpression,
  TopLevel,
  Root,
  Get,
  Wildcard,
  TokenTypeData
} = require('./lang');
const Paths = Symbol('Paths');

let exprCounter = 0;

const _ = require('lodash');
const toposort = require('toposort');

function tokenData(expr) {
  return TokenTypeData[expr[0].$type];
}

function isCollectionExpr(expr) {
  return tokenData(expr).collectionVerb;
}

function tryToHoist(expr) {
  return tokenData(expr).tryToHoist;
}

function chainIndex(expr) {
  return tokenData(expr).chainIndex;
}

function annotatePathsThatCanBeInvalidated(expr, paths, inChain, parent) {
  let currentPath = null;
  if (typeof expr === 'string' || typeof expr === 'number' || typeof expr === 'boolean') {
    currentPath = expr;
  } else if (expr instanceof Token) {
    if (expr.$type === 'root' || expr.$type === 'val' || expr.$type === 'topLevel' || expr.$type === 'context') {
      currentPath = [expr];
    }
  } else if (expr[0].$type === 'get') {
    const chainedTo = annotatePathsThatCanBeInvalidated(expr[chainIndex(expr)], paths, true, expr);
    if (!Array.isArray(chainedTo)) {
      currentPath = [];
    } else {
      currentPath = chainedTo.concat([expr[1]]);
    }
  } else if (!parent || expr[0].$type !== 'func') {
    expr.slice(1).forEach(e => annotatePathsThatCanBeInvalidated(e, paths, false, expr));
  }
  if (!inChain && Array.isArray(currentPath)) {
    const relevantExpr = expr instanceof Expression ? expr : parent;
    paths.set(currentPath, relevantExpr[0].$conditional ? relevantExpr[0].$id : false);
  }
  return currentPath;
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

function tagExpressionFunctionsWithPathsThatCanBeInvalidated(sourceExpr) {
  const exprFuncs = getAllFunctions(sourceExpr);
  _.forEach(exprFuncs, expr => {
    const allPaths = new Map();
    annotatePathsThatCanBeInvalidated(expr, allPaths);
    expr[0].$path = allPaths;
    // console.log(
    //   expr[0].$rootName,
    //   expr[0].$id,
    //   allPaths.forEach((cond, path) => console.log(JSON.stringify(path), cond))
    // );
  });
  // console.log(JSON.stringify(sourceExpr, null, 2));
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
  expr.forEach((subExpression, childIndex) => {
    if (subExpression instanceof Expression) {
      if (subExpression[0].$type !== 'func') {
        tagExpressions(subExpression, name, currentDepth, indexChain.concat(childIndex), funcType, rootName);
      } else {
        subExpression[0].$funcType = expr[0].$type;
        tagExpressions(subExpression, name + '$' + expr[0].$id, currentDepth + 1, indexChain, expr[0].$type, rootName);
      }
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
  while (nextExpr.length) {
    const currentExpr = nextExpr.shift();
    output.push(currentExpr);
    currentExpr.forEach(subExpression => {
      if (subExpression instanceof Expression) {
        nextExpr.push(subExpression);
      }
    });
  }
  return output;
}

function isStaticExpression(expr) {
  return _.every(expr, token => {
    if (token instanceof Expression) {
      if (token[0].$type === 'func') {
        return true;
      } else {
        return isStaticExpression(token);
      }
    } else if (token.$type === 'val' || token.$type === 'key' || token.$type === 'context') {
      return false;
    }
    return true;
  });
}

function rewriteUsingTopLevels(expr, namesByExpr) {
  expr.forEach((subExpression, index) => {
    if (!(subExpression instanceof Expression)) {
      return;
    }
    const str = JSON.stringify(subExpression);
    rewriteUsingTopLevels(subExpression, namesByExpr);
    if (namesByExpr[str]) {
      expr.splice(index, 1, Expr(Get, namesByExpr[str], TopLevel));
    }
  });
  return expr;
}

function generateName(namesByExpr, expr) {
  return _(expr)
    .tail()
    .reverse()
    .map(e => {
      const preNamed = namesByExpr[JSON.stringify(e)];
      if (preNamed) {
        return preNamed;
      } else {
        return _.find(_.flattenDeep(e), x => typeof x === 'string') || '';
      }
    })
    .join('');
}

function extractAllStaticExpressionsAsValues(getters) {
  const allExpressions = flattenExpression(...Object.values(getters));
  const allStaticExpressions = _.filter(allExpressions, isStaticExpression);
  const allStaticAsStrings = allStaticExpressions.reduce((acc, e) => {
    acc[JSON.stringify(e)] = e;
    return acc;
  }, {});
  const namesByExpr = _(getters)
    .mapValues(e => JSON.stringify(e))
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
  const originalGetters = Object.keys(getters);
  _(allStaticStringsSorted)
    .reverse()
    .forEach(s => {
      if (namesByExpr[s]) {
        getters[namesByExpr[s]] = rewriteUsingTopLevels(allStaticAsStrings[s], namesByExpr);
      }
    });
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
        } else {
          pathMap.delete(path);
        }
      })
    );
    if (canBeExprBeInvalidated) {
      currentSetters.push([TopLevel, name]);
    }
  });
}

function normalizeAndTagAllGetters(getters, setters) {
  extractAllStaticExpressionsAsValues(getters);
  tagAllExpressions(getters);
  _.forEach(getters, getter => tagUnconditionalExpressions(getter, false));
  _.forEach(getters, getter => tagExpressionFunctionsWithPathsThatCanBeInvalidated(getter));
  unmarkPathsThatHaveNoSetters(getters, setters);
  return getters;
}

function allPathsInGetter(getter) {
  return _(flattenExpression([getter]))
    .filter(e => e instanceof Expression && e[0].$path)
    .map(e => Array.from(e[0].$path.entries()))
    .flatten()
    .reduce((acc, item) => {
      acc.set(item[0], item[1]);
      return acc;
    }, new Map());
}

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
    .tap(x => console.log(JSON.stringify(x), funcId, x[0][0].$funcId))
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
  findFuncExpr
};
