const {
  Expr,
  Token,
  Setter,
  Expression,
  SetterExpression,
  SpliceSetterExpression,
  TokenTypeData,
  TokensThatOperateOnCollections
} = require('./lang');
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
    // console.log(JSON.stringify(model, null, 2));
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
        },
        INVALIDATES: () => (tag, content) => {
          return this.invalidates(this.pathOfExpr(expr)) ? content : '';
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
      case 'map':
      case 'any':
      case 'mapValues':
      case 'anyValues':
      case 'filterBy':
      case 'groupBy':
      case 'keyBy':
      case 'filter':
      case 'mapKeys':
        return `${
          this.template[tokenType].collectionFunc
            ? this.template[tokenType].collectionFunc
            : TokenTypeData[tokenType].arrayVerb
              ? 'forArray'
              : 'forObject'
        }(acc, key, ${this.generateExpr(expr[1])}, ${this.generateExpr(expr[2])}, ${
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
    const taint = new Array(setterExpr.length - 1)
      .fill()
      .map((v, idx) => `$tainted.add(${this.pathToString(setterExpr, idx + 1)});`)
      .join('');
    const invalidate = new Array(setterExpr.length - 1)
      .fill()
      .map(
        (v, idx) =>
          `triggerInvalidations(${this.pathToString(setterExpr, idx + 1)}, ${this.generateExpr(
            setterExpr[setterExpr.length - idx - 1]
          )});`
      )
      .join('');

    if (setterExpr instanceof SpliceSetterExpression) {
      return `${name}:(${args.concat(['len', '...newItems']).join(',')}) => {
          const arr = ${this.pathToString(setterExpr, 1)};
          const origLength = arr.length;
          const end = len === newItems.length ? key + len : Math.max(origLength, origLength + newItems.length - len);
          for (let i = key; i < end; i++ ) {
            triggerInvalidations(arr, i);
          }
          ${this.invalidates(setterExpr) ? invalidate : ''}
          ${taint}
          ${this.pathToString(setterExpr, 1)}.splice(key, len, ...newItems);
          recalculate();
      }`;
    }
    return `${name}:(${args.concat('value').join(',')}) => {
              ${this.invalidates(setterExpr) ? invalidate : ''}
              ${taint}
              ${this.pathToString(setterExpr)}  = value;
              recalculate();
          }`;
  }

  invalidates(path) {
    const refsToPath = findReferencesToPathInAllGetters(path, this.getters);
    if (!_.isEmpty(refsToPath)) {
      return true;
    }
    return false;
  }

  pathOfExpr(expr) {
    return [new Token('topLevel'), expr[0].$rootName].concat(new Array(expr[0].$depth).fill(new Token('key')));
  }

  tracking(expr) {
    const path = this.pathOfExpr(expr);
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
          if (invalidatedPath[invalidatedPath.length - 1].$type !== 'wildcard') {
            tracks.push(
              `${precond} track($invalidatedKeys, key, ${this.pathToString(invalidatedPath, 1)}
              , ${this.generateExpr(invalidatedPath[invalidatedPath.length - 1])})`
            );
          }
        } else if (invalidatedPath[0].$type === 'root') {
          Object.values(this.setters).forEach(setter => {
            if (pathMatches(invalidatedPath, setter)) {
              const setterPath = setter.map(
                (t, index) => (t instanceof Token && t.$type !== 'root' ? invalidatedPath[index] : t)
              );
              tracks.push(`// path matched ${JSON.stringify(setter)}`);
              if (setterPath[setterPath.length - 1].$type !== 'wildcard') {
                tracks.push(
                  `${precond} track($invalidatedKeys, key, ${this.pathToString(
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
      tracks.unshift('untrack($invalidatedKeys, key)');
    }

    return tracks.join('\n');
  }
}

module.exports = OptimizingCompiler;
