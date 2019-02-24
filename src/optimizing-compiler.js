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
const SimpleCompiler = require('./simple-compiler');
const {splitSettersGetters, pathMatches, normalizeAndTagAllGetters} = require('./expr-tagging');

class OptimizingCompiler extends SimpleCompiler {
  get template() {
    return require('./templates/optimizing.js');
  }

  topLevelOverrides() {
    return Object.assign({}, super.topLevelOverrides(), {
      RESET: `$first = false;
$tainted = new WeakSet();`
    });
  }

  byTokenTypesPlaceHolders(expr) {
    const currentToken = expr instanceof Expression ? expr[0] : expr;
    const tokenType = currentToken.$type;
    switch (tokenType) {
      case 'object':
        return {
          ARGS: () => _.range(1, expr.length, 2)
              .map(i => `'${expr[i]}'`)
              .join(',')
        };
    }
    return {};
  }

  exprTemplatePlaceholders(expr, funcName) {
    const currentToken = expr instanceof Expression ? expr[0] : expr;
    const tokenType = currentToken.$type;
    return Object.assign(
      {},
      super.exprTemplatePlaceholders(expr, funcName),
      {
        TOP_LEVEL_INDEX: () => `${this.getters[funcName] ? this.topLevelToIndex(funcName) : -1}`,
        TRACKING: () => this.tracking(expr),
        PRETRACKING: () => {
          if (expr[0].$path && expr[0].$path.size) {
            const conditionals = expr[0].$trackedExpr ?
              Array.from(expr[0].$trackedExpr.values()).map(cond => `let $cond_${cond} = 0;`) :
              [];
            return `${conditionals.join('')}`;
          }
          return '';
        },
        INVALIDATES: () => !!this.invalidates(expr),
        FN_ARGS: () => expr[0].$type === 'func' ? `${expr.slice(2).map(t => `,${t.$type}`).join('')} ` : ' '
      },
      this.byTokenTypesPlaceHolders(expr)
    );
  }

  wrapExprCondPart(expr, indexInExpr) {
    if (!expr[0].$tracked) {
      return `(${this.generateExpr(expr[indexInExpr])})`;
    } 
      return `(($cond_${expr[0].$id} = ${indexInExpr}) && ${this.generateExpr(expr[indexInExpr])})`;
  }

  uniqueId(expr, extra = '') {
    return `'${expr[0].$id}${extra}'`;
  }

  topLevelToIndex(str) {
    return this.getters[str][0].$topLevelIndex;
  }

  generateExpr(expr) {
    const currentToken = expr instanceof Expression ? expr[0] : expr;
    const tokenType = currentToken.$type;
    switch (tokenType) {
      case 'get':
        if (expr[2] instanceof Token && expr[2].$type === 'topLevel') {
          return `${this.generateExpr(expr[2])}[${this.topLevelToIndex(expr[1])} /*${this.generateExpr(expr[1])}*/]`;
        }
        return super.generateExpr(expr)
      case 'topLevel':
        return '$topLevel';
      case 'and':
        return (
          `(${ 
          expr
            .slice(1)
            .map((t, index) => this.wrapExprCondPart(expr, index + 1))
            .join('&&') 
          })`
        );
      case 'or':
        return (
          `(${ 
          expr
            .slice(1)
            .map((t, index) => this.wrapExprCondPart(expr, index + 1))
            .join('||') 
          })`
        );
      case 'ternary':
        return `((${this.generateExpr(expr[1])})?${this.wrapExprCondPart(expr, 2)}:(${this.wrapExprCondPart(
          expr,
          3
        )}))`;
      case 'object':
        return `object($tracked,[${
          _.range(2, expr.length, 2).map(idx => this.generateExpr(expr[idx])).join(',')
        }], ${this.uniqueId(expr)}, object$${
          expr[0].$duplicate ? expr[0].$duplicate : expr[0].$id
        }Args, ${this.invalidates(expr)})`;
      case 'array':
        return `array($tracked,${super.generateExpr(expr)}, ${this.uniqueId(expr)}, ${expr.length -
          1}, ${this.invalidates(expr)})`;
      case 'call':
        return `call($tracked,[${expr
          .slice(1)
          .map(subExpr => this.generateExpr(subExpr))
          .join(',')}], ${this.uniqueId(expr)}, ${expr.length - 1}, ${this.invalidates(expr)})`;
      case 'bind':
        return `bind($tracked,[${expr
          .slice(1)
          .map(subExpr => this.generateExpr(subExpr))
          .join(',')}], ${this.uniqueId(expr)}, ${expr.length - 1})`;
      case 'keys':
      case 'values':
        return `valuesOrKeysForObject($tracked, ${this.uniqueId(expr)}, ${this.generateExpr(expr[1])}, ${
          tokenType === 'values' ? 'true' : 'false'
        }, ${this.invalidates(expr)})`;
      case 'sum':
      case 'flatten':
      case 'size':
        return `${tokenType}($tracked, ${this.generateExpr(expr[1])}, ${this.uniqueId(expr)})`;
      case 'assign':
      case 'defaults':
        return `assignOrDefaults($tracked, ${this.uniqueId(expr)}, ${this.generateExpr(expr[1])}, ${
          tokenType === 'assign' ? 'true' : 'false'
        }, ${this.invalidates(expr)})`;
      case 'range':
        return `range($tracked, ${this.generateExpr(expr[1])}, ${
          expr.length > 2 ? this.generateExpr(expr[2]) : '0'
        }, ${expr.length > 3 ? this.generateExpr(expr[3]) : '1'}, ${this.uniqueId(expr)}, ${this.invalidates(expr)})`;
      case 'filterBy':
      case 'mapValues':
      case 'groupBy':
      case 'map':
      case 'filter':
      case 'mapKeys':
      case 'any':
      case 'keyBy':
      case 'anyValues':
      case 'recursiveMap':
      case 'recursiveMapValues':
        return `${tokenType}Opt($tracked, ${this.uniqueId(expr)}, ${this.generateExpr(expr[1])}, ${this.generateExpr(
        expr[2]
      )}, ${
        typeof expr[3] === 'undefined' || expr[3] instanceof Token && expr[3].$type === 'null' ?
          null :
          `array($tracked,[${this.generateExpr(expr[3])}],${this.uniqueId(expr, 'arr')},1,true)`
      }, ${this.invalidates(expr)})`;
      case 'context':
        return 'context[0]';
      case 'recur':
        return `${this.generateExpr(expr[1])}.recursiveSteps(${this.generateExpr(expr[2])}, $tracked)`;
      case 'func':
        return expr[0].$duplicate ? expr[0].$duplicate : expr[0].$funcId;
      case 'invoke':
        return `${expr[1]}($tracked${expr.slice(2).map(t => `,${t.$type}`).join('')})`
      default:
        return super.generateExpr(expr);
    }
  }

  buildDerived(name) {
    return `($first || $invalidatedRoots.has(${this.topLevelToIndex(name)})) && $${name}Build();`;
  }

  isStaticObject(expr) {
    return _.range(1, expr.length, 2)
      .every(idx => typeof expr[idx] === 'string')
  }

  buildExprFunctionsByTokenType(acc, expr) {
    const tokenType = expr[0].$type;
    if (expr[0].$duplicate) {
      return;
    }
    switch (tokenType) {
      case 'object':
        if (this.isStaticObject(expr)) {
          this.appendExpr(acc, tokenType, expr, `${tokenType}$${expr[0].$id}`);
        }
        break;
      default:
        super.buildExprFunctionsByTokenType(acc, expr);
    }
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
    // tracks.push(`// invalidates - ${this.invalidates(expr)}`)
    const pathsThatInvalidate = expr[0].$path;
    if (pathsThatInvalidate) {
      //console.log(pathsThatInvalidate);
      pathsThatInvalidate.forEach((cond, invalidatedPath) => {
        // tracks.push(
        //   `// invalidatedPath: ${JSON.stringify(invalidatedPath)}, ${JSON.stringify(cond)}, ${
        //     invalidatedPath[invalidatedPath.length - 1].$type
        //   }`
        // );
        const precond = cond ? `(${this.generateExpr(cond)} ) && ` : '';
        if (invalidatedPath[0].$type === 'context') {
          const activePath = [0].concat(invalidatedPath.slice(1));
          tracks.push(
            `${precond} trackPath($tracked, [context, ${activePath
              .map(fragment => this.generateExpr(fragment))
              .join(',')}]);`
          );
        } else if (invalidatedPath.length > 1 && invalidatedPath[0].$type === 'topLevel') {
          tracks.push(
            `${precond} trackPath($tracked, [${invalidatedPath
              .map((fragment, index) => index === 1 ? this.topLevelToIndex(fragment) : this.generateExpr(fragment))
              .join(',')}]);`
          );
        } else if (invalidatedPath.length > 1 && invalidatedPath[0] instanceof Expression && invalidatedPath[0][0].$type === 'get' && invalidatedPath[0][2].$type === 'topLevel') {
          tracks.push(
            `${precond} trackPath($tracked, [${invalidatedPath
              .map(fragment => this.generateExpr(fragment))
              .join(',')}]);`
          );
        } else if (invalidatedPath.length > 1 &&
          (invalidatedPath[0] instanceof Expression && invalidatedPath[0][0].$type === 'invoke')) {
          tracks.push(
            `${precond} trackPath($tracked, [${invalidatedPath
              .map(fragment => this.generateExpr(fragment))
              .join(',')}]);`
          );
        } else if (invalidatedPath[0].$type === 'root' && invalidatedPath.length > 1) {
          const settersMatched = Object.values(this.setters).filter(setter => pathMatches(invalidatedPath, setter));
          if (settersMatched.length) {
            // settersMatched.forEach(setter => tracks.push(`// path matched ${JSON.stringify(setter)}`));
            tracks.push(
              `${precond} trackPath($tracked, [${invalidatedPath
                .map(fragment => this.generateExpr(fragment))
                .join(',')}]);`
            );
          }
        }
        //tracks.push(`// tracking ${JSON.stringify(invalidatedPath)}`);
      });
    }
    return tracks.join('\n');
  }
}

module.exports = OptimizingCompiler;
