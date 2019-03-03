'use strict'

const {
  TokenTypeData,
  Expr,
  Token,
  WrappedPrimitive
} = require('./lang');
const currentLine = require('./currentLine');
const {paths} = require('./cache');

function withPathInfo(value, key, currentPath) {
  const isArray = typeof key === 'number'
  const newPath = `${currentPath}${isArray ? `[${key}]` : `.${key}`}`
  if (typeof value === 'undefined') {
    throw new Error(`Undefined value in carmi expression: ${newPath} at ${currentLine()}`)
  }

  if (value && typeof value === 'object') {
    paths.set(value, newPath)
  }

  return value
}

function convertArrayAndObjectsToExpr(v) {
  if (typeof v === 'undefined') {
    throw new Error('Carmi expressions can not contain undefined');
  }

  let path
  if (v && typeof v === 'object') {
    v = v || 'null'
    path = paths.get(v)
    if (!path) {
      path = '{}'
      paths.set(v, path)
    }
  }

  if (v === null) {
    return new Token('null');
  } else if (v.constructor === Object) {
    return createExpr(
      new Token('object', currentLine()),
      ...Object.keys(v).reduce((acc, key) => {
        acc.push(key);
        acc.push(withPathInfo(v[key], key, path));
        return acc;
      }, [])
    );
  } else if (v.constructor === Array) {
    return createExpr(new Token('array', currentLine()), ...v.map((entry, index) => withPathInfo(entry, index, path)));
  } else if (typeof v === 'boolean' || typeof v === 'string' || typeof v === 'number') {
    return new WrappedPrimitive(v);
  }
  return v;
}

function createExpr(...args) {
  args = args.map(token => {
    token = convertArrayAndObjectsToExpr(token);
    if (token instanceof WrappedPrimitive) {
      return token.toJSON();
    }
    return token;
  });
  if (args[0] instanceof Token && TokenTypeData[args[0].$type]) {
    const len = TokenTypeData[args[0].$type].len;
    if (len && (args.length < len[0] || args.length > len[1])) {
      throw new Error(
        `invalid length for expression ${args[0].$type} length:${args.length} expected:${len[0]}-${len[1]}`
      );
    }
  }
  return Expr.apply(null, args);
}

module.exports = {
  convertArrayAndObjectsToExpr,
  createExpr
}
