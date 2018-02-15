const { Expr, Token, Setter, Expression, SetterExpression, TopLevel } = require('./lang');
const _ = require('lodash');
const fs = require('fs');
const { splitSettersGetters, topologicalSortGetters, tagAllExpressions } = require('./expr-tagging');
let idx = 0;

class NaiveCompiler {
  constructor(model, name = 'Essential') {
    const { getters, setters } = splitSettersGetters(model);
    tagAllExpressions(getters);
    this.name = name;
    this.getters = getters;
    this.setters = setters;
  }

  get template() {
    return fs.readFileSync('./src/templates/naive.js').toString();
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
      case 'eq':
        return `(${this.generateExpr(expr[1])}) === (${this.generateExpr(expr[2])})`;
      case 'root':
        return '$model';
      case 'get':
        return `${this.generateExpr(expr[2])}[${this.generateExpr(expr[1])}]`;
      case 'mapValues':
      case 'filterBy':
      case 'groupBy':
      case 'mapKeys':
        return `${tokenType}($model, ${this.generateExpr(expr[1])}, ${this.generateExpr(expr[2])})`;
      case 'func':
        return currentToken.funcName;
      case 'arg0':
        return 'arg0';
      case 'arg1':
        return 'arg1';
      case 'topLevel':
        return `$${expr[1]}($model)`;
      default:
        return JSON.stringify(currentToken);
    }
  }

  buildDerived(name) {
    const prefix = name.indexOf('$') === 0 ? '' : `res.${name} = `;
    return `${prefix} ${this.generateExpr(new Expression(TopLevel, name))};`;
  }

  buildSetter(setterExpr, name) {
    const args = setterExpr.filter(t => typeof t !== 'string').map(t => t.$type);
    const path = setterExpr.map(t => (t instanceof Token ? `[${t.$type}]` : `[${JSON.stringify(t)}]`)).join('');
    return `${name}:(${args.concat('value').join(',')}) => {
              $model${path} = value;
              recalculate();
          }`;
  }

  get functionDefs() {
    return {
      func: function() {
        function $funcName($model, arg0, arg1) {
          return `${this.generateExpr(expr[1])}`;
        }
      },
      topLevel: function() {
        function $$funcName($model) {
          return `${this.generateExpr(expr)}`;
        }
      }
    };
  }

  appendExpr(acc, type, expr, funcName) {
    const base = this.functionDefs[type] || this.functionDefs[expr[0].$funcType];
    acc.push(
      base
        .toString()
        .replace(/\$funcName/g, funcName)
        .replace(/\$rootName/g, expr[0].$rootName)
        .replace(/\`\${(.*?)}`/g, (m, i) => eval(i))
        .replace(/function\s*\(\)\s*\{([\s\S]+)\}/, (m, i) => i)
    );
  }

  buildExprFunctions(acc, expr, name) {
    if (!(expr instanceof Expression) || !expr[0]) {
      return;
    }
    const tokenType = expr[0].$type;
    switch (tokenType) {
      case 'func':
        expr[0].funcName = expr[0]['$funcId'];
        break;
    }

    _.forEach(expr.slice(1), this.buildExprFunctions.bind(this, acc));
    if (expr[0].funcName) {
      this.appendExpr(acc, tokenType, expr, expr[0].funcName);
    }
    if (typeof name === 'string') {
      this.appendExpr(acc, 'topLevel', expr, name);
    }

    return acc;
  }

  compile() {
    const source = `
            ${this.template}
            ${_.reduce(this.getters, this.buildExprFunctions.bind(this), []).join('\n')}
            return function ${this.name} ($model) {
              const res = {$model};
              function recalculate() {
                ${topologicalSortGetters(this.getters)
                  .map(this.buildDerived.bind(this))
                  .join('\n')}
              }
              Object.assign(res, {${_.map(this.setters, this.buildSetter.bind(this)).join(',')}});
              recalculate();
              return res;
            }
          `;
    return source;
  }
}

module.exports = NaiveCompiler;
