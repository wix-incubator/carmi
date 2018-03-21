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
  TokensThatOperateOnCollections
} = require('./lang');
const Paths = Symbol('Paths');
const FunctionId = Symbol('FunctionId');

let exprCounter = 0;

const _ = require('lodash');
const toposort = require('toposort');

function isCollectionExpr(expr) {
  const $type = expr[0].$type;
  switch ($type) {
    case 'mapValues':
    case 'filterBy':
    case 'groupBy':
    case 'mapKeys':
      return true;
    default:
      return false;
  }
}

function annotatePathsThatCanBeInvalidated(expr, paths, inChain) {
  if (typeof expr === 'string') {
    return expr;
  }
  if (expr instanceof Token) {
    if (expr.$type === 'root' || expr.$type === 'arg0' || expr.$type === 'topLevel') {
      return [expr];
    }
    return [];
  }
  if (expr[0].$type === 'get' || isCollectionExpr(expr)) {
    const result = annotatePathsThatCanBeInvalidated(expr[2], paths, true).concat(
      isCollectionExpr(expr) ? Wildcard : [expr[1]]
    );
    if (!inChain) {
      paths.set(result, expr[0].$conditional ? expr[0].$id : false);
    }
    return result;
  } else if (expr[0].$type !== 'func' || !inChain) {
    expr.slice(1).forEach(e => annotatePathsThatCanBeInvalidated(e, paths, false));
  }
}

function getAllFunctions(sourceExpr) {
  const allExpressions = flattenExpression(sourceExpr);
  const exprByFunc = _.groupBy(allExpressions, expr => expr[FunctionId]);
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
    // console.log(expr[0].$rootName, expr[0].$id, allPaths.map(pathToString));
  });
}

function tagExpressions(expr, name, currentDepth, indexChain, rootName) {
  if (expr[0].$id) {
    return; //Already tagged
  }
  expr[FunctionId] = name;
  expr[0].$id = exprCounter++;
  expr[0].$funcId = expr[FunctionId];
  expr[0].$rootName = rootName;
  expr[0].$depth = currentDepth;
  expr.forEach((subExpression, childIndex) => {
    if (subExpression instanceof Expression) {
      if (subExpression[0].$type !== 'func') {
        tagExpressions(subExpression, name, currentDepth, indexChain.concat(childIndex), rootName);
      } else {
        subExpression[0].$funcType = expr[0].$type;
        tagExpressions(subExpression, name + '$' + expr[0].$id, currentDepth + 1, indexChain, rootName);
      }
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
    } else if (token.$type === 'arg0' || token.$type === 'arg1' || token.$type === 'context') {
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
    if (!namesByExpr[s] && _.includes(TokensThatOperateOnCollections, e[0].$type)) {
      namesByExpr[s] = '$' + generateName(namesByExpr, e) + nodeIndex++;
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
  _.forEach(getters, (getter, name) => tagExpressions(getter, name, 0, [1], name));
}

function tagUnconditionalExpressions(expr, cond) {
  if (!(expr instanceof Expression)) {
    return;
  }
  expr[0].$conditional = !!cond;
  const $type = expr[0].$type;
  if ($type === 'or' || $type === 'and') {
    tagUnconditionalExpressions(expr[1], cond);
    expr.slice(2).forEach(subExpr => tagUnconditionalExpressions(subExpr, true));
  } else if ($type === 'func') {
    tagUnconditionalExpressions(expr[1], false);
  } else {
    expr.slice(1).forEach(subExpr => tagUnconditionalExpressions(subExpr, cond));
  }
}

function normalizeAndTagAllGetters(getters) {
  extractAllStaticExpressionsAsValues(getters);
  tagAllExpressions(getters);
  _.forEach(getters, getter => tagUnconditionalExpressions(getter, false));
  _.forEach(getters, getter => tagExpressionFunctionsWithPathsThatCanBeInvalidated(getter));
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
  /*console.log(
    'findReferencesToPathInAllGetters',
    path,
    JSON.stringify(_.mapValues(res, getterPaths => _.map(getterPaths, pathToString)), null, 2),
    JSON.stringify(_.mapValues(pathsInAllGetters, getterPaths => _.map(getterPaths, pathToString)), null, 2)
  );*/
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

module.exports = {
  findReferencesToPathInAllGetters,
  pathMatches,
  topologicalSortGetters,
  pathFragmentToString,
  tagAllExpressions,
  splitSettersGetters,
  normalizeAndTagAllGetters,
  allPathsInGetter
};
