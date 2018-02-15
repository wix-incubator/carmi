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
    // throw 'done';
    super(newModel, name);
  }

  get template() {
    return fs.readFileSync('./src/templates/optimizing.js').toString();
  }

  generateExpr(expr) {
    const currentToken = expr instanceof Expression ? expr[0] : expr;
    const tokenType = currentToken.$type;
    switch (tokenType) {
      case 'mapValues':
      case 'filterBy':
      case 'groupBy':
      case 'mapKeys':
        return `forObject($model, $context, $path, ${this.generateExpr(expr[1])}, ${this.generateExpr(expr[2])})`;
      case 'topLevel':
        return `(($context.$ready.${expr[1]} || $${expr[1]}Build($model, $context)) && $${expr[1]}Value)`;
      default:
        return super.generateExpr(expr);
    }
  }

  get functionDefs() {
    return {
      topLevel: function() {
        $context.$ready.$funcName = false;
        let $$funcNameValue;
        function $$funcNameBuild($model, $context) {
          const $path = ['$funcName'];
          $$funcNameValue = `${this.generateExpr(expr)}`;
          $context.$ready.$funcName = true;
          return $$funcNameValue;
        }
      },
      mapValues: function() {
        function $funcName($model, $context, $path, src, arg1, acc) {
          let $changed = false;
          const arg0 = src[arg1];
          if (!src.hasOwnProperty(arg1) && acc.hasOwnProperty(arg1)) {
            delete acc[arg1];
            $changed = true;
          } else {
            const res = `${this.generateExpr(expr[1])}`;
            $changed = res !== acc[arg1];
            acc[arg1] = res;
          }
          `${this.tracking(expr)}`;
        }
      },
      filterBy: function() {
        function $funcName($model, $context, $path, src, arg1, acc) {
          let $changed = false;
          const arg0 = src[arg1];
          if (!src.hasOwnProperty(arg1) && acc.hasOwnProperty(arg1)) {
            delete acc[arg1];
            $changed = true;
          } else {
            const res = `${this.generateExpr(expr[1])}`;
            if (res) {
              acc[arg1] = arg0;
              $changed = acc[arg1] !== arg0;
            } else if (acc.hasOwnProperty(arg1)) {
              delete acc[arg1];
              $changed = true;
            }
          }
          `${this.tracking(expr)}`;
        }
      }
    };
  }

  buildSetter(setterExpr, name) {
    const args = setterExpr.filter(t => typeof t !== 'string').map(t => t.$type);
    const path = setterExpr.map(t => (t instanceof Token ? `[${t.$type}]` : `[${JSON.stringify(t)}]`)).join('');
    const refsToPath = findReferencesToPathInAllGetters(['root'].concat(setterExpr), this.getters);

    return `${name}:(${args.concat('value').join(',')}) => {
              $model${path} = value;
              ${_(refsToPath)
                .map((getter, name) => {
                  return `invalidate($context, ['${name}'${setterExpr
                    .filter(t => t instanceof Token)
                    .map(t => ',' + t.$type)
                    .join('')}])`;
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
            invalidates.push(`invalidate($context, ['${getterName}', arg1])`);
          }
          invalidates.push(`// invalidate ${JSON.stringify(pathInGetter)} ${JSON.stringify(getterName)}`);
        });
      });
      invalidates.push('triggerInvalidations($context, $path)');
    }
    const tracks = [];
    if (pathsThatInvalidate) {
      _.forEach(pathsThatInvalidate, invalidatedPath => {
        if (
          invalidatedPath[0] instanceof Expression &&
          invalidatedPath[0][0].$type === 'topLevel' &&
          invalidatedPath.length > 1
        ) {
          tracks.push(`track($context, $path, ['${invalidatedPath[0][1]}', ${this.generateExpr(invalidatedPath[1])}])`);
        }
        tracks.push(`// tracking ${JSON.stringify(invalidatedPath)}`);
      });
    }
    if (invalidates.filter(line => line.indexOf('//') !== 0).length > 0) {
      invalidates.unshift('if ($changed) {');
      invalidates.push('}');
    }
    if (tracks.filter(line => line.indexOf('//') !== 0).length > 0) {
      tracks.unshift('untrack($context, $path)');
    }

    return [...invalidates, ...tracks].join('\n');
  }
}

module.exports = OptimizingCompiler;
