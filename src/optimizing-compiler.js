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
    super({ ...model, ...normalizeAndTagAllGetters(getters, setters) }, name);
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
        return `forObject(acc, arg1, ${this.generateExpr(expr[1])}, ${this.generateExpr(expr[2])}, ${
          typeof expr[3] === 'undefined' ? null : this.generateExpr(expr[3])
        })`;
      case 'topLevel':
        return `$res`;
      case 'wildcard':
        return '$wildcard';
      default:
        return super.generateExpr(expr);
    }
  }

  buildDerived(name) {
    return `$invalidatedRoots.has('${name}') && $${name}Build();`;
  }

  buildSetter(setterExpr, name) {
    const args = setterExpr
      .slice(1)
      .filter(t => typeof t !== 'string')
      .map(t => t.$type);
    return `${name}:(${args.concat('value').join(',')}) => {
              ${this.invalidates(
                setterExpr,
                this.pathToString(setterExpr.slice(0, setterExpr.length - 1)),
                this.generateExpr(setterExpr[setterExpr.length - 1])
              ).join('\n')}
              ${this.pathToString(setterExpr)}  = value;
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
          if (pathInGetter.length === path.length && pathInGetter[path.length - 1].$type === 'wildcard') {
            invalidates.push(`invalidate($res.${getterName}, ${targetKey})`);
          } else if (path.length === 2) {
            invalidates.push(`invalidate($res, '${getterName}')`);
          }
          invalidates.push(`// invalidate ${JSON.stringify(pathInGetter)} ${JSON.stringify(getterName)}`);
        });
      });
      invalidates.push(`triggerInvalidations(${targetObj}, ${targetKey})`);
    }
    return invalidates;
  }

  tracking(expr) {
    const path = [new Token('topLevel'), expr[0].$rootName].concat(new Array(expr[0].$depth).fill(new Token('arg1')));
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
        tracks.push(
          `//invalidatedPath: ${JSON.stringify(invalidatedPath)}, ${cond}, ${
            invalidatedPath[invalidatedPath.length - 1].$type
          }`
        );
        const precond = cond ? `$cond_${cond} && ` : '';
        if (invalidatedPath[0].$type === 'topLevel') {
          if (invalidatedPath[invalidatedPath.length - 1].$type === 'wildcard') {
            tracks.push(
              `${precond} track(acc[arg1],$wildcard, ${this.pathToString(
                invalidatedPath.slice(0, invalidatedPath.length - 1)
              )}, $wildcard)`
            );
          } else if (invalidatedPath.length > 2) {
            tracks.push(
              `${precond} track(acc, arg1, $res[${this.generateExpr(invalidatedPath[1])}], ${this.generateExpr(
                invalidatedPath[2]
              )})`
            );
          }
        } else if (invalidatedPath[0].$type === 'root') {
          Object.values(this.setters).forEach(setter => {
            if (pathMatches(invalidatedPath, setter)) {
              const setterPath = setter.map(
                (t, index) => (t instanceof Token && t.$type !== 'root' ? invalidatedPath[index] : t)
              );
              tracks.push(`// path matched ${JSON.stringify(setter)}`);
              if (setterPath[setterPath.length - 1].$type === 'wildcard') {
                tracks.push(
                  `${precond} track(acc[arg1], $wildcard, ${this.pathToString(
                    setterPath.slice(0, setterPath.length - 1)
                  )}, ${this.generateExpr(setterPath[setterPath.length - 1])})`
                );
              } else {
                tracks.push(
                  `${precond} track(acc, arg1, ${this.pathToString(
                    setterPath.slice(0, setterPath.length - 1)
                  )}, ${this.generateExpr(setterPath[setterPath.length - 1])})`
                );
              }
            }
          });
          tracks.push('// tracking model directly');
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
