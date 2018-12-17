const {
  Expr,
  Token,
  Setter,
  Expression,
  SetterExpression,
  SpliceSetterExpression,
  TokenTypeData,
  Clone
} = require('./lang');
const _ = require('lodash');
const NaiveCompiler = require('./naive-compiler');
const {
  splitSettersGetters,
  pathMatches,
  normalizeAndTagAllGetters
} = require('./expr-tagging');

class OptimizingCompiler extends NaiveCompiler {
  constructor(model, options) {
    const { getters, setters } = splitSettersGetters(model);
    super({ ...model, ...normalizeAndTagAllGetters(getters, setters) }, options);
  }

  get template() {
    return require('./templates/optimizing.js');
  }

  byTokenTypesPlaceHolders(expr) {
    const currentToken = expr instanceof Expression ? expr[0] : expr;
    const tokenType = currentToken.$type;
    switch (tokenType) {
      case 'object':
        return {
          ARGS: () => {
            return _.range(1, expr.length, 2)
              .map(i => `'${expr[i]}'`)
              .join(',');
          }
        };
      case 'array':
        return {
          ARGS: () => expr.length - 1
        };
    }
    return {};
  }

  exprTemplatePlaceholders(expr, funcName) {
    const currentToken = expr instanceof Expression ? expr[0] : expr;
    const tokenType = currentToken.$type;
    return Object.assign(
      {
        TRACKING: () => this.tracking(expr),
        PRETRACKING: () => {
          if (expr[0].$path && expr[0].$path.size) {
            const conditionals = expr[0].$trackedExpr ? Array.from(expr[0].$trackedExpr.values()).map(cond => `let $cond_${cond} = 0;`) : [];
            return (
              `let $tracked = [$invalidatedKeys,key];` + conditionals.join('')
            );
          }
          return '';
        },
        INVALIDATES: () => {
          return !!this.invalidates(expr);
        }
      },
      this.byTokenTypesPlaceHolders(expr),
      super.exprTemplatePlaceholders(expr, funcName)
    );
  }

  wrapExprCondPart(expr, indexInExpr) {
    if (!expr[0].$tracked) {
      return `(${this.generateExpr(expr[indexInExpr])})`
    } else {
      return `(($cond_${expr[0].$id} = ${indexInExpr}) && ${this.generateExpr(expr[indexInExpr])})`
    }
  }

  uniqueId(expr, extra = '') {
    return `'${expr[0].$id}${extra}'`
  }

  generateExpr(expr) {
    const currentToken = expr instanceof Expression ? expr[0] : expr;
    const tokenType = currentToken.$type;
    switch (tokenType) {
      case 'and':
        return (
          '(' +
          expr
            .slice(1)
            .map((t,index)=> this.wrapExprCondPart(expr, index+1))
            .join('&&') +
          ')'
        );
      case 'or':
        return (
          '(' +
          expr
            .slice(1)
            .map((t,index)=> this.wrapExprCondPart(expr, index+1))
            .join('||') +
          ')'
        );
      case 'ternary':
        return `((${this.generateExpr(expr[1])})?${this.wrapExprCondPart(expr, 2)}:(${this.wrapExprCondPart(expr, 3)}))`;
      case 'object':
      return `object($invalidatedKeys,key,${super.generateExpr(expr)}, ${this.uniqueId(
        expr
      )}, object$${expr[0].$id}Args, ${this.invalidates(expr)})`;
      case 'array':
        return `array($invalidatedKeys,key,${super.generateExpr(expr)}, ${this.uniqueId(
          expr
        )}, ${expr.length - 1}, ${this.invalidates(expr)})`;
      case 'call':
        return `call($invalidatedKeys,key,[${expr
          .slice(1)
          .map(subExpr => this.generateExpr(subExpr))
          .join(',')}], ${this.uniqueId(
            expr
          )}, ${expr.length - 1}, ${this.invalidates(
          expr
        )})`;
      case 'bind':
        return `bind($invalidatedKeys,key,[${expr
          .slice(1)
          .map(subExpr => this.generateExpr(subExpr))
          .join(',')}], ${this.uniqueId(
            expr
          )}, ${expr.length - 1})`;
      case 'keys':
      case 'values':
        return `valuesOrKeysForObject($invalidatedKeys, key, ${this.uniqueId(
          expr
        )}, ${this.generateExpr(
          expr[1]
        )}, ${tokenType === 'values' ? 'true' : 'false'})`;
      case 'size':
        return `size($invalidatedKeys, key, ${this.generateExpr(expr[1])}, ${this.uniqueId(
          expr
        )})`;
      case 'assign':
      case 'defaults':
        return `assignOrDefaults($invalidatedKeys, key, ${this.uniqueId(
          expr
        )}, ${this.generateExpr(expr[1])}, ${
          tokenType === 'assign' ? 'true' : 'false'
        }, ${this.invalidates(expr)})`;
      case 'range':
        return `range($invalidatedKeys, key, ${this.generateExpr(expr[1])}, ${expr.length > 2 ? this.generateExpr(expr[2]) : '0'}, ${
          expr.length > 3 ? this.generateExpr(expr[3]) : '1'
        }, ${this.uniqueId(
          expr
        )})`;
      case 'map':
      case 'any':
      case 'mapValues':
      case 'anyValues':
      case 'recursiveMap':
      case 'recursiveMapValues':
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
        }($invalidatedKeys, key, ${this.uniqueId(
          expr
        )}, ${this.generateExpr(expr[1])}, ${this.generateExpr(expr[2])}, ${
          (typeof expr[3] === 'undefined' || (expr[3] instanceof Token && expr[3].$type === 'null'))
            ? null
            : `array($invalidatedKeys,key,[${this.generateExpr(expr[3])}],${this.uniqueId(
                expr
              ,'arr')},1,true)`
            })`;
      case 'topLevel':
        return `$res`;
      case 'context':
        return 'context[0]';
      case 'recur':
        return `${this.generateExpr(expr[1])}.recursiveSteps(${this.generateExpr(expr[2])}, $invalidatedKeys, key)`;
      default:
        return super.generateExpr(expr);
    }
  }

  buildDerived(name) {
    return `$invalidatedRoots.has('${name}') && $${name}Build();`;
  }

  buildExprFunctionsByTokenType(acc, expr) {
    const tokenType = expr[0].$type;
    switch (tokenType) {
      case 'object':
        this.appendExpr(acc, tokenType, expr, `${tokenType}$${expr[0].$id}`);
        break;
      default:
        super.buildExprFunctionsByTokenType(acc, expr);
    }
  }

  buildSetter(setterExpr, name) {
    const args = setterExpr
      .slice(1)
      .filter(t => typeof t !== 'string' && typeof t !== 'number')
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
          )}, true);`
      )
      .join('');

    if (setterExpr instanceof SpliceSetterExpression) {
      return `${name}:$setter.bind(null, (${args.concat(['len', '...newItems']).join(',')}) => {
          const arr = ${this.pathToString(setterExpr, 1)};
          const origLength = arr.length;
          const end = len === newItems.length ? key + len : Math.max(origLength, origLength + newItems.length - len);
          for (let i = key; i < end; i++ ) {
            triggerInvalidations(arr, i, true);
          }
          ${invalidate}
          ${taint}
          ${this.pathToString(setterExpr, 1)}.splice(key, len, ...newItems);
      })`;
    }
    return `${name}:$setter.bind(null, (${args.concat('value').join(',')}) => {
              ${invalidate}
              ${taint}
              if (typeof value === 'undefined') {
                delete ${this.pathToString(setterExpr)}
              } else {
                ${this.pathToString(setterExpr)}  = value;
              }
          })`;
  }

  invalidates(expr) {
    return expr[0].$invalidates;
  }

  pathOfExpr(expr) {
    return [new Token('topLevel'), expr[0].$rootName].concat(
      new Array(Math.min(expr[0].$depth, 1)).fill(new Token('key'))
    );
  }

  tracking(expr) {
    const tracks = [];
    const pathsThatInvalidate = expr[0].$path;
    if (pathsThatInvalidate) {
      //console.log(pathsThatInvalidate);
      pathsThatInvalidate.forEach((cond, invalidatedPath) => {
        tracks.push(
          `// invalidatedPath: ${JSON.stringify(invalidatedPath)}, ${JSON.stringify(cond)}, ${
            invalidatedPath[invalidatedPath.length - 1].$type
          }`
        );
        const precond = cond ? `(${this.generateExpr(cond)} ) && ` : '';
        if (invalidatedPath[0].$type === 'context') {
          const activePath = [0].concat(invalidatedPath.slice(1));
          tracks.push(
            `${precond} trackPath($tracked, [context, ${activePath
              .map(fragment => this.generateExpr(fragment))
              .join(',')}]);`
          );
        } else if (invalidatedPath[0].$type === 'topLevel' && invalidatedPath.length > 1) {
          tracks.push(
            `${precond} trackPath($tracked, [${invalidatedPath
              .map(fragment => this.generateExpr(fragment))
              .join(',')}]);`
          );
        } else if (invalidatedPath[0].$type === 'root' && invalidatedPath.length > 1) {
          let settersMatched = Object.values(this.setters).filter(setter => pathMatches(invalidatedPath, setter));
          if (settersMatched.length) {
            settersMatched.forEach(setter => tracks.push(`// path matched ${JSON.stringify(setter)}`));
            tracks.push(
              `${precond} trackPath($tracked, [${invalidatedPath
                .map(fragment => this.generateExpr(fragment))
                .join(',')}]);`
            );
          }
        }
        tracks.push(`// tracking ${JSON.stringify(invalidatedPath)}`);
      });
    }
    return tracks.join('\n');
  }
}

module.exports = OptimizingCompiler;
