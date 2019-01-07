'use strict';

const {
  TokenTypeData,
  Expr,
  Token,
  Setter,
  Expression,
  Splice,
  cloneToken,
  SourceTag,
  isSetterExpression,
  isSpliceExpression,
  isExpression,
  WrappedPrimitive
} = require('./src/lang');


const compilerTypes = {};
const UnwrappedExpr = Symbol('UnwrappedExpr');
compilerTypes.naive = require('./src/naive-compiler');
compilerTypes.simple = require('./src/simple-compiler');
compilerTypes.optimizing = require('./src/optimizing-compiler');
try {
  compilerTypes.flow = require('./src/flow-compiler');
  compilerTypes.rust = require('./src/rust-compiler');
} catch (e) { } //eslint-disable-line no-empty

const path = require('path');
const fs = require('fs');
const exprHash = require('./src/expr-hash');
const {searchExpressionsWithoutInnerFunctions, searchExpressions} = require('./src/expr-search');

const prettier = require('prettier');

const unwrapableProxies = require('./src/unwrapable-proxy');
const proxyHandler = {};
const { wrap, unwrap } = unwrapableProxies(proxyHandler);

const INDEX_FILE = __filename;
const SUGAR_FILE = path.resolve(__dirname, 'src/sugar.js')
const JSX_FILE = INDEX_FILE.replace(/index\.js$/, 'jsx.js');

function currentLine() {
  const e = new Error();
  const lines = e.stack.split('\n');
  const externalLine =
    lines
      .slice(1)
      .filter(l => l.indexOf(INDEX_FILE) === -1 && l.indexOf(JSX_FILE) === -1 && l.indexOf(SUGAR_FILE) === -1 && l.indexOf(':') !== -1)[0] || 'unknown';
  return externalLine.substr(externalLine.indexOf(path.sep)).split(':').map((str, idx) => idx > 0 ? '' + parseInt(str, 10) : str).join(':')
}

const GLOBAL_TOKEN = '__$CARMI$__';

if (global[GLOBAL_TOKEN]) {
  throw new Error(
    'require of multiple versions of Carmi is not supported previously loaded from:' + global[GLOBAL_TOKEN]
  );
}
global[GLOBAL_TOKEN] = currentLine();

function convertArrayAndObjectsToExpr(v) {
  if (typeof v === 'undefined') {
    throw new Error('Carmi expressions can not contain undefined');
  }
  if (v === null) {
    return new Token('null');
  } else if (v.constructor === Object) {
    return createExpr(
      new Token('object', currentLine()),
      ...Object.keys(v).reduce((acc, key) => {
        acc.push(key);
        acc.push(v[key]);
        return acc;
      }, [])
    );
  } else if (v.constructor === Array) {
    return createExpr(new Token('array', currentLine()), ...v);
  } else if (typeof v === 'boolean' || typeof v === 'string' || typeof v === 'number') {
    return new WrappedPrimitive(v);
  } else {
    return v;
  }
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

const tokensNotAllowedToReuseFromOtherExpressions = {
  'val': true,
  'key': true,
  'loop': true,
  'context': true
}

function throwOnTokensFromOtherFuncs(expr, tag) {
  searchExpressionsWithoutInnerFunctions( subExpr => {
    subExpr.forEach(token => {
      if (
        token instanceof Token &&
        token[SourceTag] &&
        token[SourceTag] !== tag &&
        tokensNotAllowedToReuseFromOtherExpressions[token.$type]
      ) {
        throw new Error(
          `used ${JSON.stringify(token)} from ${token[
            SourceTag
          ].toString()} inside ${tag.toString()} in another function pass in context`
        );
      }
    });
  }, [expr]);
}

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

const chain = val => wrap(convertArrayAndObjectsToExpr(val));
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
  // throwOnTokensFromOtherFuncs(expr, target[0][SourceTag]);
  target.splice(0, target.length, ...expr);
  return abstract;
}

const template = (parts, ...args) => {
  return parts.slice(1).reduce((result, current, index) => result.plus(args[index]).plus(chain(current)), chain(parts[0]))
}

const frontend = {chain, abstract, implement, template}
Object.keys(TokenTypeData).forEach(t => {
  if (TokenTypeData[t].private) {
    return; // privates aren't exported - only used in optimizing code or internally
  }
  if (TokenTypeData[t].nonVerb) {
    frontend[t] = wrap(new Token(t));
  } else if (TokenTypeData[t].nonChained) {
    frontend[t] = (...args) => wrap(createExpr(new Token(t, currentLine()), ...args));
  }
});
const sugar = require('./src/sugar')(frontend);
Object.keys(sugar).forEach(key => {
  if (TokenTypeData[key]) {
    throw new Error(`There is a builtin token with this sugar name ${key}`);
  }
});


proxyHandler.get = (target, key) => {
  const tokenData = TokenTypeData[key];
  if (
    !tokenData &&
    typeof key === 'string' &&
    key !== '$type' &&
    key !== '$primitive' &&
    key !== 'length' &&
    key !== 'forEach' &&
    key !== 'inspect' &&
    key !== 'toJSON' &&
    Number.isNaN(parseInt(key, 10))
  ) {
    if (sugar[key]) {
      return (...args) => sugar[key](chain(target), ...args);
    }
    throw new Error(`unknown token: ${key}, ${JSON.stringify(target)}`);
  }
  if (key === UnwrappedExpr) {
    if (target[UnwrappedExpr]) {
      return target[UnwrappedExpr]
    }
    return target;
  }
  if (!tokenData || tokenData.nonVerb || !tokenData.chainIndex) {
    // console.log(target, key);
    return Reflect.get(target, key);
  }
  return (...args) => {
    // console.log(key, args);
    const sourceTag = currentLine()
    args = [new Token(key, sourceTag), ...args];
    if (tokenData.chainIndex) {
      if (tokenData.collectionVerb && tokenData.chainIndex === 2) {
        if (typeof args[1] === 'function') {
          const origFunction = args[1];
          const funcArgs = tokenData.recursive ? ['loop', 'val', 'key', 'context'] : ['val', 'key', 'context'];
          const funcArgsTokens = funcArgs.map(t => wrap(new Token(t, sourceTag)));
          args[1] = origFunction.apply(null, funcArgsTokens);
          throwOnTokensFromOtherFuncs(args[1], sourceTag);
        } else if (typeof args[1] === 'string') {
          args[1] = createExpr(new Token('get'), args[1], new Token('val'));
        }
        args[1] = createExpr(new Token('func'), args[1]);
      }
      args.splice(tokenData.chainIndex, 0, target);
    }
    return wrap(createExpr(...args));
  };
};

proxyHandler.apply = (target, thisArg, args) => {
  if (target instanceof Token) {
    wrap(createExpr(cloneToken(target), ...args));
  } else {
    throw `${String(target)} not a function`;
  }
};

function compile(model, options) {
  if (typeof options === 'boolean' || typeof options === 'undefined') {
    options = { compiler: !!options ? 'naive' : 'optimizing' };
  }
  options.name = options.name || 'instance';
  if (options.compiler === 'carmi') {
    options.compiler = 'optimizing';
  }
  model = unwrap(model);
  const hashFile =
    options.cache &&
    !options.ast &&
    path.resolve(process.cwd(), options.cache, exprHash({ model, options }));
  if (options.cache) {
    try {
      const result = fs
        .readFileSync(hashFile)
        .toString();
      return result;
    } catch (e) { } //eslint-disable-line no-empty
  }
  const Compiler = compilerTypes[options.compiler];
  const compiler = new Compiler(model, options);
  if (options.ast) {
    return JSON.stringify(compiler.getters, null, 2);
  }
  const rawSource = compiler.compile();
  let source = rawSource;
  if (options.prettier) {
    try {
      source = prettier.format(rawSource, { parser: 'babylon' });
    } catch (e) { } //eslint-disable-line no-empty
  }
  let result;

  if (compiler.lang === 'js') {
    switch (options.format) {
      case 'iife':
        result = `var ${options.name} = (function () {
          return ${source}
        }())`;
        break;
      case 'cjs':
        result = `module.exports = ${source}`;
        break;
      case 'esm':
        result = `export default ${source}`;
        break;
      case 'umd':
        result = `
          (function (global, factory) {
            typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
            typeof define === 'function' && define.amd ? define(factory) :
            (global.${options.name} = factory());
          }(this, (function () {
            return ${source}
          })))
        `;
        break;
      case 'amd':
        result = `
          define(function () {
            return ${source}
          });
        `;
        break;
      default:
        result = `(function () {
          'use strict';
          return ${source}
        })()`;
        break;
    }
  } else {
    result = source;
  }
  if (hashFile) {
    fs.writeFileSync(hashFile, result);
  }
  return result;
}

function withName(name, val) {
  if (val instanceof Expression) {
    const tokenType = val[0].$type;
    const tokenData = TokenTypeData[tokenType];
    if (tokenData.collectionVerb && tokenData.chainIndex === 2) {
      name = name.replace(/[\W_]+/g, '');
      val[0][SourceTag] = val[0][SourceTag] + ':' + name;
    } else {
      throw new Error('can only name collection functions:' + name);
    }
    return val;
  }
}

function inferFromModel(rootExpression, exampleModel) {
  return rootExpression
}

const API = {
  compile,
  setter: Setter,
  splice: Splice,
  isSetterExpression,
  isSpliceExpression,
  isExpression,
  withName,
  inferFromModel,
  withSchema,
  ...frontend
};

module.exports = API


function withSchema() {
  return API
}
