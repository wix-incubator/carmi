'use strict'
const {
  Expr,
  Token,
  SourceTag,
  TokenTypeData,
  isExpression,
  WrappedPrimitive,
  UnwrappedExpr
} = require('./lang');
const currentLine = require('./currentLine');
const {convertArrayAndObjectsToExpr, createExpr} = require('./expressionBuilder');
const {wrap} = require('./unwrapable-proxy');
const {searchExpressions} = require('./expr-search');
const privateUnwrap = (item) => item[UnwrappedExpr] ? item[UnwrappedExpr] : item;

function throwOnSelfReferencesToPlaceholder(expr, abstract) {
  if (expr[0] === abstract[0]) {
    throw new Error(
      `trying to implement abstract ${abstract[1]} with itself`
    );
  }
  searchExpressions(subExpr => {
    subExpr.forEach(token => {
      if (privateUnwrap(token) === abstract) {
        throw new Error(
          `trying to implement abstract ${abstract[1]} with expression that references the abstract
this causes an endless loop ${subExpr[0][SourceTag]}`
        );
      }
    });
  }, [expr]);
}

const chain = val => wrap(convertArrayAndObjectsToExpr(val))
const abstract = title => {
  if (typeof title !== 'string') {
    throw new Error('the title of abstract must be a string');
  }
  return wrap(createExpr(new Token('abstract', currentLine()), title, new Error(`failed to implement ${title}`)));
}
const implement = (abstract, expr) => {
  const target = privateUnwrap(abstract);
  if (typeof expr === 'boolean' || typeof expr === 'string' || typeof expr === 'number') {
    expr = new WrappedPrimitive(expr);
  }
  if (expr instanceof WrappedPrimitive) {
    expr = Expr(new Token('quote', currentLine()), expr.toJSON());
  }
  if (!isExpression(target) || target[0].$type !== 'abstract') {
    throw new Error('can only implement an abstract');
  }
  throwOnSelfReferencesToPlaceholder(expr, target)
  target.splice(0, target.length, ...expr);
  return abstract;
}
const template = (parts, ...args) => parts.slice(1).reduce((result, current, index) => result.plus(args[index]).plus(chain(current)), chain(parts[0]));

const frontendApi = {chain, abstract, implement, template};

Object.keys(TokenTypeData).forEach(t => {
  if (TokenTypeData[t].private) {
    return; // privates aren't exported - only used in optimizing code or internally
  }
  if (TokenTypeData[t].nonVerb) {
    frontendApi[t] = wrap(new Token(t));
  } else if (TokenTypeData[t].nonChained) {
    frontendApi[t] = (...args) => wrap(createExpr(new Token(t, currentLine()), ...args));
  }
});

module.exports = frontendApi
