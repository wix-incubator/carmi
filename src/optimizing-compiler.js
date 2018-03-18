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
  normalizeAndTagAllGetters,
  allPathsInGetter
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
        TRACKING: () => this.tracking(expr),
        PRETRACKING: () => {
          if (expr[0].$path) {
            return Array.from(expr[0].$path.values())
              .filter(cond => cond)
              .map(cond => `let $cond_${cond} = false;`)
              .join('');
          }
          return '';
        }
      },
      super.exprTemplatePlaceholders(expr, funcName)
    );
  }

  generateExpr(expr) {
    const currentToken = expr instanceof Expression ? expr[0] : expr;
    const tokenType = currentToken.$type;
    switch (tokenType) {
      case 'get':
        if (expr[0].$conditional && expr[0].$rootName) {
          const getter = this.getters[expr[0].$rootName];
          const paths = allPathsInGetter(getter);
          if (Array.from(paths.values()).filter(k => k === expr[0].$id).length) {
            return `${this.generateExpr(expr[2])}[($cond_${expr[0].$id} = true && ${this.generateExpr(expr[1])})]`;
          }
        }
        return super.generateExpr(expr);

      case 'mapValues':
      case 'filterBy':
      case 'groupBy':
      case 'mapKeys':
        return `forObject(acc, arg1, ${this.generateExpr(expr[1])}, ${this.generateExpr(expr[2])})`;
      case 'topLevel':
        return `$res.${expr[1]}`;
      default:
        return super.generateExpr(expr);
    }
  }

  buildDerived(name) {
    return `$invalidatedRoots.has('${name}') && $${name}Build();`;
  }

  buildSetter(setterExpr, name) {
    const args = setterExpr.filter(t => typeof t !== 'string').map(t => t.$type);
    const path = setterExpr.map(t => (t instanceof Token ? t.$type : JSON.stringify(t)));
    return `${name}:(${args.concat('value').join(',')}) => {
              $model${path.map(t => `[${t}]`).join('')} = value;
              ${this.invalidates(
                [new Token('root')].concat(setterExpr),
                '$model' +
                  path
                    .slice(0, path.length - 1)
                    .map(t => `[${t}]`)
                    .join(''),
                path[path.length - 1]
              ).join('\n')}
              recalculate();
          }`;
  }

  invalidates(path, targetObj, targetKey) {
    const refsToPath = findReferencesToPathInAllGetters(path, this.getters);
    // console.log('invalidates:', path, refsToPath);
    const invalidates = [];
    let parts = [];
    if (!_.isEmpty(refsToPath)) {
      _.forEach(refsToPath, (allRelevantPathsInGetter, getterName) => {
        _.forEach(allRelevantPathsInGetter, pathInGetter => {
          if (pathInGetter.length === path.length && pathInGetter[path.length - 1].$type === 'func') {
            invalidates.push(`invalidate($res.${getterName}, ${targetKey})`);
          }
          invalidates.push(`// invalidate ${JSON.stringify(pathInGetter)} ${JSON.stringify(getterName)}`);
        });
      });
      invalidates.push(`triggerInvalidations(${targetObj}, ${targetKey})`);
    }
    return invalidates;
  }

  tracking(expr) {
    const path = [expr[0].$rootName].concat(new Array(expr[0].$depth).fill(new Token('arg1')));
    const invalidates = this.invalidates(path, 'acc', 'arg1');
    if (invalidates.filter(line => line.indexOf('//') !== 0).length > 0) {
      invalidates.unshift('if ($changed) {');
      invalidates.push('}');
    }

    const tracks = [];
    const pathsThatInvalidate = expr[0].$path;
    if (pathsThatInvalidate) {
      //console.log(pathsThatInvalidate);
      pathsThatInvalidate.forEach((cond, invalidatedPath) => {
        if (
          invalidatedPath[0] instanceof Expression &&
          invalidatedPath[0][0].$type === 'topLevel' &&
          invalidatedPath.length > 1
        ) {
          const precond = cond ? `$cond_${cond} && ` : '';
          tracks.push(
            `${precond} track(acc, arg1, $res.${invalidatedPath[0][1]}, ${this.generateExpr(invalidatedPath[1])})`
          );
        }
        tracks.push(`// tracking ${JSON.stringify(invalidatedPath)}`);
      });
    }
    if (tracks.filter(line => line.indexOf('//') !== 0).length > 0) {
      tracks.unshift('untrack(acc, arg1)');
    }

    return [...invalidates, ...tracks].join('\n');
  }
}

module.exports = OptimizingCompiler;
