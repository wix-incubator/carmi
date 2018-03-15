const { Expr, Token, Setter, Expression, SetterExpression, TokensThatOperateOnCollections } = require('./lang');
const _ = require('lodash');
const NaiveCompiler = require('./naive-compiler');
const fs = require('fs');
const {
  tagExprWithPaths,
  findReferencesToPathInAllGetters,
  splitSettersGetters,
  pathMatches,
  pathFragmentToString,
  normalizeAndTagAllGetters
} = require('./expr-tagging');

class OptimizingCompiler extends NaiveCompiler {
  constructor(model, name) {
    const { getters, setters } = splitSettersGetters(model);
    const newModel = {};
    Object.assign(newModel, model, normalizeAndTagAllGetters(getters));
    super(newModel, name);
  }

  get template() {
    return require('./templates/optimizing.js');
  }

  exprTemplatePlaceholders(expr, funcName) {
    return Object.assign(
      {
        TRACKING: () => this.tracking(expr)
      },
      super.exprTemplatePlaceholders(expr, funcName)
    );
  }

  generateExpr(expr) {
    const currentToken = expr instanceof Expression ? expr[0] : expr;
    const tokenType = currentToken.$type;
    switch (tokenType) {
      case 'mapValues':
      case 'filterBy':
      case 'groupBy':
      case 'mapKeys':
        return `forObject($targetObj, $targetKey, ${this.generateExpr(expr[1])}, ${this.generateExpr(expr[2])})`;
      case 'topLevel':
        return `$res.${expr[1]}`;
      default:
        return super.generateExpr(expr);
    }
  }

  buildDerived(name) {
    return `!$invalidatedRoots.has('${name}') || $${name}Build();`;
  }

  buildSetter(setterExpr, name) {
    const args = setterExpr.filter(t => typeof t !== 'string').map(t => t.$type);
    const path = setterExpr.map(t => (t instanceof Token ? `[${t.$type}]` : `[${JSON.stringify(t)}]`)).join('');
    const refsToPath = findReferencesToPathInAllGetters(['root'].concat(setterExpr), this.getters);

    return `${name}:(${args.concat('value').join(',')}) => {
              $model${path} = value;
              ${_(refsToPath)
                .map((getter, name) => {
                  const values = [`'${name}'`].concat(setterExpr.filter(t => t instanceof Token).map(t => t.$type));
                  const last = values.pop();
                  return `invalidate($res${values.map(v => `[${v}]`).join()}, ${last})`;
                })
                .compact()
                .join('\n')}
              // console.log('CONTEXT:', JSON.stringify($context,null,2));
              recalculate();
          }`;
  }

  tracking(expr) {
    const path = [expr[0].$rootName].concat(new Array(expr.$depth).fill('*'));
    const refsToPath = findReferencesToPathInAllGetters(path, this.getters);
    const pathsThatInvalidate = expr[0].$path;
    const invalidates = [];

    let parts = [];
    if (!_.isEmpty(refsToPath)) {
      _.forEach(refsToPath, (allRelevantPathsInGetter, getterName) => {
        _.forEach(allRelevantPathsInGetter, pathInGetter => {
          if (pathInGetter.length === 2 && pathInGetter[1].$type === 'func') {
            invalidates.push(`invalidate($res.${getterName}, arg1)`);
          }
          invalidates.push(`// invalidate ${JSON.stringify(pathInGetter)} ${JSON.stringify(getterName)}`);
        });
      });
      invalidates.push('triggerInvalidations(acc, arg1)');
    }
    const tracks = [];
    if (pathsThatInvalidate) {
      _.forEach(pathsThatInvalidate, invalidatedPath => {
        if (
          invalidatedPath[0] instanceof Expression &&
          invalidatedPath[0][0].$type === 'topLevel' &&
          invalidatedPath.length > 1
        ) {
          tracks.push(`track(acc, arg1, $res.${invalidatedPath[0][1]}, ${this.generateExpr(invalidatedPath[1])})`);
        }
        tracks.push(`// tracking ${JSON.stringify(invalidatedPath)}`);
      });
    }
    if (invalidates.filter(line => line.indexOf('//') !== 0).length > 0) {
      invalidates.unshift('if ($changed) {');
      invalidates.push('}');
    }
    if (tracks.filter(line => line.indexOf('//') !== 0).length > 0) {
      tracks.unshift('untrack(acc, arg1)');
    }

    return [...invalidates, ...tracks].join('\n');
  }
}

module.exports = OptimizingCompiler;
