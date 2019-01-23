const { Expr, Token, Expression, SpliceSetterExpression, SourceTag, TokenTypeData } = require('./lang');
const _ = require('lodash');
const { splitSettersGetters, topologicalSortGetters, tagAllExpressions, tagToSimpleFilename } = require('./expr-tagging');
const objectHash = require('object-hash');

const nativeOps = {
  eq: '===',
  plus: '+',
  minus: '-',
  mult: '*',
  div: '/',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  mod: '%'
};

const typeOfChecks = {
  isUndefined: 'undefined',
  isBoolean: 'boolean',
  isString: 'string',
  isNumber: 'number'
}

const nativeStringFunctions = ['startsWith', 'endsWith', 'toUpperCase', 'toLowerCase', 'substring', 'split'].map(name => ({[name]: `String.prototype.${name}`})).reduce(_.assign)
const nativeMathFunctions = ['floor', 'ceil', 'round'].map(name => ({[name]: `Math.${name}`})).reduce(_.assign)
class NaiveCompiler {
  constructor(model, options) {
    const { getters, setters } = splitSettersGetters(model);
    tagAllExpressions(getters);
    this.getters = getters;
    this.setters = setters;
    // console.log(JSON.stringify(getters, null, 2));
    this.options = options;
  }

  get template() {
    return require('./templates/naive.js');
  }
  withTypeCheck(expr, next) {
    if (!this.options.typeCheck) {
      return next
    }

    const currentToken = expr instanceof Expression ? expr[0] : expr
    const source = currentToken[SourceTag]

    const tokenType = currentToken.$type
    const {expectedType, chainIndex} = TokenTypeData[tokenType]

    if (!expectedType) {
      return next
    }

    const selfExpr = expr[chainIndex]
    const self = this.generateExpr(selfExpr)
    return `
      (() => {
        const value = (${self})
        const actualType = typeof value
        if (actualType!== '${expectedType}') {
          throw new TypeError(\`Expected ${expectedType}, received \${actualType}.
          Trying to call \${JSON.stringify(value)}.${tokenType}
          Source: ${source}\`)
        }
      })() || (${next})
    `
  }

  withFunctionNameCheck(expr, next) {
    if (!this.options.typeCheck) {
      return next
    }

    const functionName = this.generateExpr(expr[1])
    const source = expr[0][SourceTag]
    return `(() => {
        const func = $funcLib[${functionName}]
        if (typeof func !== 'function') {
          throw new TypeError(\`No such function: ${functionName}\ when called from ${source}\`)
        }

        return (${next})
    })()`
  }

  generateExpr(expr) {
    // console.log(JSON.stringify(expr, null, 2));
    const currentToken = expr instanceof Expression ? expr[0] : expr;
    // console.log(expr);
    const tokenType = currentToken.$type;
    switch (tokenType) {
      case 'quote': return this.generateExpr(expr[1])
      case 'breakpoint': return `((() => {debugger; return ${this.generateExpr(expr[1])}}) ())`
      case 'trace': {
        const logLevel = expr.length > 2 ? this.generateExpr(expr[2]) : 'log'
        const nextToken = expr[1] instanceof Expression ? expr[1][0] : expr[1]
        const nextTokenType = nextToken.$type
        const source = currentToken[SourceTag]
        return `((() => {
          const value = (${this.generateExpr(expr[1])});
          console['${logLevel}']({value, token: '${nextTokenType}', source: '${source}'})
          return value;
        }) ())`
      }
      case 'and':
        return (
          '(' +
          expr
            .slice(1)
            .map(e => this.generateExpr(e))
            .map(part => `(${part})`)
            .join('&&') +
          ')'
        );
      case 'or':
        return (
          '(' +
          expr
            .slice(1)
            .map(e => this.generateExpr(e))
            .map(part => `(${part})`)
            .join('||') +
          ')'
        );
      case 'not':
        return `!(${this.generateExpr(expr[1])})`;
      case 'ternary':
        return `((${this.generateExpr(expr[1])})?(${this.generateExpr(expr[2])}):(${this.generateExpr(expr[3])}))`;
      case 'array':
        return `[${expr
          .slice(1)
          .map(t => this.generateExpr(t))
          .join(',')}]`;
      case 'object':
        return `{${_.range(1, expr.length, 2)
          .map(idx => `"${expr[idx]}": ${this.generateExpr(expr[idx + 1])}`)
          .join(',')}}`;
      case 'range':
        return `range(${this.generateExpr(expr[1])}, ${expr.length > 2 ? this.generateExpr(expr[2]) : '0'}, ${
          expr.length > 3 ? this.generateExpr(expr[3]) : '1'
          })`;
      case 'keys':
      case 'values':
      case 'assign':
      case 'defaults':
      case 'size':
      case 'sum':
      case 'flatten':
        return `${tokenType}(${this.generateExpr(expr[1])})`;
      case 'isBoolean':
      case 'isNumber':
      case 'isString':
      case 'isUndefined':
        return `(typeof (${this.generateExpr(expr[1])}) === '${typeOfChecks[tokenType]}')`
      case 'toUpperCase':
      case 'toLowerCase':
        return `(${nativeStringFunctions[tokenType]}).call(${this.generateExpr(expr[1])})`;
      case 'floor':
      case 'ceil':
      case 'round':
        return this.withTypeCheck(expr, `(${nativeMathFunctions[tokenType]})(${this.generateExpr(expr[1])})`);
      case 'parseInt':
        return `parseInt(${this.generateExpr(expr[1])}, ${expr.length > 2 ? expr[2] : 10})`;
      case 'eq':
      case 'lt':
      case 'lte':
      case 'gt':
      case 'gte':
      case 'plus':
      case 'minus':
      case 'mult':
      case 'div':
      case 'mod':
        return this.withTypeCheck(expr, `(${this.generateExpr(expr[1])}) ${nativeOps[tokenType]} (${this.generateExpr(expr[2])})`);
      case 'startsWith':
      case 'endsWith':
      case 'split':
        return this.withTypeCheck(expr, `(${nativeStringFunctions[tokenType]}).call(${this.generateExpr(expr[1])}, ${this.generateExpr(expr[2])})`);
      case 'substring':
        return this.withTypeCheck(expr, `(${nativeStringFunctions[tokenType]}).call(${this.generateExpr(expr[1])}, ${this.generateExpr(expr[2])}, ${this.generateExpr(expr[3])})`);
      case 'get':
        return `${this.generateExpr(expr[2])}[${this.generateExpr(expr[1])}]`;
      case 'mapValues':
      case 'filterBy':
      case 'groupBy':
      case 'mapKeys':
      case 'map':
      case 'any':
      case 'filter':
      case 'keyBy':
      case 'anyValues':
      case 'recursiveMap':
      case 'recursiveMapValues':
        return this.withTypeCheck(expr, `${tokenType}(${this.generateExpr(expr[1])}, ${this.generateExpr(expr[2])}, ${
          typeof expr[3] === 'undefined' ? null : this.generateExpr(expr[3])
          })`);
      case 'loop':
        return 'loop';
      case 'recur':
        return `${this.generateExpr(expr[1])}(${this.generateExpr(expr[2])})`;
      case 'func':
        return currentToken.$funcId;
      case 'root':
        return '$model';
      case 'null':
      case 'val':
      case 'key':
      case 'arg0':
      case 'arg1':
      case 'arg2':
      case 'arg3':
      case 'arg4':
      case 'arg5':
      case 'arg6':
      case 'arg7':
      case 'arg8':
      case 'arg9':
      case 'context':
        return tokenType;
      case 'topLevel':
        return '$res';
      case 'cond':
          return `$cond_${this.generateExpr(expr[1])}`
      case 'effect':
      case 'call':
        return this.withFunctionNameCheck(expr, `($funcLib[${this.generateExpr(expr[1])}].call($res${expr
          .slice(2)
          .map(subExpr => ',' + this.generateExpr(subExpr))
          .join('')}) ${tokenType === 'effect' ? ' && void 0': ''})`);
      case 'bind':
        return this.withFunctionNameCheck(expr, `($funcLib[${this.generateExpr(expr[1])}] || $res[${this.generateExpr(expr[1])}]).bind($res${expr
          .slice(2)
          .map(subExpr => ',' + this.generateExpr(subExpr))
          .join('')})`);
      case 'invoke':
          return `(${expr[1]}(${expr.slice(2).map(t => t.$type).join(',')}))`
      case 'abstract':
          throw expr[2]
      default:
        return JSON.stringify(currentToken);
    }
  }

  buildDerived(name) {
    const prefix = name.indexOf('$') === 0 ? '' : `$res.${name} = `;
    return `${prefix} $${name}();`;
  }

  pathToString(path, n = 0) {
    this.disableTypeChecking = true
    const res = this.generateExpr(
      path.slice(1, path.length - n).reduce((acc, token) => Expr(new Token('get'), token, acc), path[0])
    );
    this.disableTypeChecking = false
    return res
  }

  buildSetter(setterExpr, name) {
    const args = setterExpr
      .slice(1)
      .filter(t => typeof t !== 'string' && typeof t !== 'number')
      .map(t => t.$type);
    if (setterExpr instanceof SpliceSetterExpression) {
      return `${name}:$setter.bind(null, (${args.concat(['len', '...newItems']).join(',')}) => {
        ${this.pathToString(setterExpr, 1)}.splice(key, len, ...newItems);
    })`;
    }
    return `${name}:$setter.bind(null, (${args.concat('value').join(',')}) => {
              if (typeof value === 'undefined') {
                delete ${this.pathToString(setterExpr)}
              } else {
                ${this.pathToString(setterExpr)} = value;
              }
          })`;
  }

  exprTemplatePlaceholders(expr, funcName) {
    return {
      ROOTNAME: expr[0].$rootName,
      FUNCNAME: funcName,
      EXPR1: () => (expr.length > 1 ? this.generateExpr(expr[1]) : ''),
      EXPR: () => this.generateExpr(expr),
      ID: () => expr[0].$id,
      FN_ARGS: () => ' ' + (expr[0].$type === 'func' ? expr.slice(2).map(t => t.$type).join(',') : '')
    };
  }

  appendExpr(acc, type, expr, funcName) {
    acc.push(
      this.mergeTemplate(
        expr[0].$type === 'func' && this.template[expr[0].$funcType]
          ? this.template[expr[0].$funcType]
          : this.template[type],
        this.exprTemplatePlaceholders(expr, funcName)
      )
    );
  }

  buildExprFunctionsByTokenType(acc, expr) {
    const tokenType = expr[0].$type;
    switch (tokenType) {
      case 'func':
        this.appendExpr(acc, tokenType, expr, expr[0].$funcId);
        break;
    }
  }

  buildExprFunctions(acc, expr, name) {
    if (!(expr instanceof Expression) || !expr[0]) {
      return acc;
    }
    _.forEach(expr.slice(1), this.buildExprFunctions.bind(this, acc));
    this.buildExprFunctionsByTokenType(acc, expr);
    if (typeof name === 'string') {
      // console.log(name, expr[0])
      if (expr[0].$type !== 'func') {
        this.appendExpr(acc, 'topLevel', expr, name);
      }
    }
    return acc;
  }

  mergeTemplate(template, placeHolders) {
    return Object.keys(placeHolders)
      .reduce((result, name) => {
        const replaceFunc = typeof placeHolders[name] === 'function' ? placeHolders[name]() : () => placeHolders[name];
        const commentRegex = new RegExp('/\\*\\s*' + name + '\\s*([\\s\\S]*?)\\*/', 'mg');
        const dollarRegex = new RegExp('\\$' + name, 'g');
        const inCommentRegex = new RegExp(
          '/\\*\\s*' + name + '\\s*\\*/([\\s\\S]*?)/\\*\\s*' + name + '\\-END\\s*\\*/',
          'mg'
        );
        return result
          .replace(inCommentRegex, replaceFunc)
          .replace(commentRegex, replaceFunc)
          .replace(dollarRegex, replaceFunc);
      }, template.toString())
      .replace(/function\s*\w*\(\)\s*\{\s*([\s\S]+)\}/, (m, i) => i);
  }

  topLevelOverrides() {
    return {
      NAME: this.options.name,
      AST: () => JSON.stringify(this.getters, null, 2),
      DEBUG: () => (_whole, block) => (this.options.debug ? block : ''),
      COUNT_GETTERS: () => Object.keys(this.getters).length,
      SOURCE_FILES: () => () => this.options.debug ? (JSON.stringify(Object.values(this.getters).reduce((acc, getter) => {
        const tag = getter instanceof Expression && getter[0][SourceTag];
        const simpleFileName = tag && tagToSimpleFilename(tag);
        if (simpleFileName && !acc[simpleFileName]) {
          const fileName = getter[0][SourceTag].split(':')[0]
          acc[simpleFileName] = require('fs').readFileSync(fileName).toString();
        }
        return acc;
      }, {}))) : '',
      LIBRARY: () => this.mergeTemplate(this.template.library, {}),
      ALL_EXPRESSIONS: () => _.reduce(this.getters, this.buildExprFunctions.bind(this), []).join('\n'),
      DERIVED: () =>
        topologicalSortGetters(this.getters)
          .filter(name => this.getters[name][0].$type !== 'func')
          .map(this.buildDerived.bind(this))
          .join('\n'),
      SETTERS: () => _.map(this.setters, this.buildSetter.bind(this)).join(',')
    };
  }

  compile() {
    return this.mergeTemplate(this.template.base, this.topLevelOverrides());
  }

  hash() {
    return objectHash({ getters: this.getters, setters: this.setters });
  }

  get lang() {
    return 'js';
  }
}

module.exports = NaiveCompiler;
