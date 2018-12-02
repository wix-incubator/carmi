const { Expr, Token, Expression, SpliceSetterExpression, SourceTag } = require('./lang');
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

const nativeFunctions = ['startsWith', 'endsWith', 'toUpperCase', 'toLowerCase', 'substring', 'split'].map(name => ({[name]: `String.prototype.${name}`})).reduce(_.assign)
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

  generateExpr(expr) {
    // console.log(JSON.stringify(expr, null, 2));
    const currentToken = expr instanceof Expression ? expr[0] : expr;
    // console.log(expr);
    const tokenType = currentToken.$type;
    switch (tokenType) {
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
        return `${tokenType}(${this.generateExpr(expr[1])})`;
      case 'toUpperCase':
      case 'toLowerCase':
        return `(${nativeFunctions[tokenType]}).call(${this.generateExpr(expr[1])})`;
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
        return `(${this.generateExpr(expr[1])}) ${nativeOps[tokenType]} (${this.generateExpr(expr[2])})`;
      case 'startsWith':
      case 'endsWith':
      case 'split':
        return `(${nativeFunctions[tokenType]}).call(${this.generateExpr(expr[1])}, ${this.generateExpr(expr[2])})`;
      case 'substring':
        return `(${nativeFunctions[tokenType]}).call(${this.generateExpr(expr[1])}, ${this.generateExpr(expr[2])}, ${this.generateExpr(expr[3])})`;
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
      case 'tree':
      case 'recursiveMap':
      case 'recursiveMapValues':
        return `${tokenType}(${this.generateExpr(expr[1])}, ${this.generateExpr(expr[2])}, ${
          typeof expr[3] === 'undefined' ? null : this.generateExpr(expr[3])
          })`;
      case 'loop':
        return 'loop';
      case 'recur':
      case 'traverse':
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
      case 'context':
        return tokenType;
      case 'topLevel':
        return `$res`;
      case 'call':
        return `$funcLib[${this.generateExpr(expr[1])}].call($res${expr
          .slice(2)
          .map(subExpr => ',' + this.generateExpr(subExpr))
          .join('')})`;
      case 'bind':
        return `($funcLib[${this.generateExpr(expr[1])}] || $res[${this.generateExpr(expr[1])}]).bind($res${expr
          .slice(2)
          .map(subExpr => ',' + this.generateExpr(subExpr))
          .join('')})`;
      default:
        return JSON.stringify(currentToken);
    }
  }

  buildDerived(name) {
    const prefix = name.indexOf('$') === 0 ? '' : `$res.${name} = `;
    return `${prefix} $${name}();`;
  }

  pathToString(path, n = 0) {
    return this.generateExpr(
      path.slice(1, path.length - n).reduce((acc, token) => Expr(new Token('get'), token, acc), path[0])
    );
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
      ID: () => expr[0].$id
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
      this.appendExpr(acc, 'topLevel', expr, name);
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
      SOURCE_FILES: () => () => this.options.debug ? (JSON.stringify(Object.values(this.getters).reduce((acc, getter) => {
        const tag = getter instanceof Expression && getter[0][SourceTag];
        const simpleFileName = tag && tagToSimpleFilename(tag);
        if (simpleFileName && !acc[simpleFileName]) {
          const fileName = getter[0][SourceTag].split(':')[0]
          acc[simpleFileName] = require('fs').readFileSync(fileName).toString();
        }
        return acc;
      }, {}))) : '',
      ALL_EXPRESSIONS: () => _.reduce(this.getters, this.buildExprFunctions.bind(this), []).join('\n'),
      DERIVED: () =>
        topologicalSortGetters(this.getters)
          .map(this.buildDerived.bind(this))
          .join('\n'),
      SETTERS: () => _.map(this.setters, this.buildSetter.bind(this)).join(',')
    };
  }

  async compile() {
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
