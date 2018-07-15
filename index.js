const { TokenTypeData, Expr, Token, Setter, Expression, Splice, Clone, cloneToken, SourceTag } = require('./src/lang');
const NaiveCompiler = require('./src/naive-compiler');
const SimpleCompiler = require('./src/simple-compiler');
const OptimzingCompiler = require('./src/optimizing-compiler');
const FlowCompiler = require('./src/flow-compiler');
const RustCompiler = require('./src/rust-compiler');
const { promisify } = require('util');
const { sep } = require('path');

const { rollup } = require('rollup');
const uglify = require('rollup-plugin-uglify');
const virtual = require('rollup-plugin-virtual');
const prettier = require('prettier');

const unwrapableProxies = require('./src/unwrapable-proxy');
const proxyHandler = {};
const { wrap, unwrap } = unwrapableProxies(proxyHandler);

function currentLine() {
  const e = new Error();
  const lines = e.stack.split('\n');
  const externalLine = lines.slice(1).filter(l => l.indexOf(__filename) === -1 && l.indexOf(':') !== -1)[0];
  const lineParts = externalLine.split(sep);
  return lineParts[lineParts.length - 1];
}

function convertArrayAndObjectsToExpr(v) {
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
  } else {
    return v;
  }
}

function createExpr(...args) {
  args = args.map(convertArrayAndObjectsToExpr);
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

function allTokensInOtherFuncs(expr, res, inOtherFunc) {
  res = res || [];
  inOtherFunc = inOtherFunc || false;
  if (expr instanceof Expression) {
    expr.forEach(child => {
      if (inOtherFunc && child instanceof Token) {
        res.push(child);
      }
      if (child instanceof Expression) {
        allTokensInOtherFuncs(child, res, inOtherFunc || child[0].$type === 'func');
      }
    });
  }
  return res;
}

proxyHandler.get = (target, key) => {
  const tokenData = TokenTypeData[key];
  if (
    !tokenData &&
    typeof key === 'string' &&
    key !== '$type' &&
    key !== 'length' &&
    key !== 'forEach' &&
    key !== 'inspect' &&
    Number.isNaN(parseInt(key, 10))
  ) {
    throw new Error(`unknown token: ${key}, ${JSON.stringify(target)}`);
  }
  if (!tokenData || tokenData.nonVerb || tokenData.nonChained) {
    // console.log(target, key);
    return Reflect.get(target, key);
  }
  return (...args) => {
    // console.log(key, args);
    args = [new Token(key, currentLine()), ...args];
    if (tokenData.chainIndex) {
      if (tokenData.collectionVerb && tokenData.chainIndex === 2) {
        if (typeof args[1] === 'function') {
          const origFunction = args[1];
          const funcArgs = tokenData.recursive ? ['loop', 'val', 'key', 'context'] : ['val', 'key', 'context'];
          const funcArgsTokens = funcArgs.map(t => wrap(new Token(t, origFunction)));
          args[1] = origFunction.apply(null, funcArgsTokens);
          const allTokensInResult = allTokensInOtherFuncs(args[1]);
          allTokensInResult.forEach(token => {
            if (token[SourceTag] && token[SourceTag] === origFunction) {
              throw new Error(
                `used ${JSON.stringify(token)} from ${token[
                  SourceTag
                ].toString()} inside ${origFunction.toString()} in another function pass in context`
              );
            }
          });
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

const compilerTypes = {
  naive: NaiveCompiler,
  simple: SimpleCompiler,
  optimizing: OptimzingCompiler,
  flow: FlowCompiler,
  rust: RustCompiler
};

async function compile(model, options) {
  if (typeof options === 'boolean' || typeof options === 'undefined') {
    options = { compiler: !!options ? 'naive' : 'optimizing' };
  }
  options.name = options.name || 'instance';
  if (options.compiler === 'carmi') {
    options.compiler = 'optimizing';
  }
  model = Clone(unwrap(model));
  const Compiler = compilerTypes[options.compiler];
  const compiler = new Compiler(model, options);
  if (options.ast) {
    return JSON.stringify(compiler.getters, null, 2);
  }
  const rawSource = await compiler.compile();
  let source = rawSource;
  try {
    source = prettier.format(rawSource, { parser: 'babylon' });
  } catch (e) {}
  require('fs').writeFileSync('./tmp.js', `module.exports = ${source}`);
  if (!options.format && compiler.lang === 'js') {
    return `(function () {
      'use strict';
      return ${source}
    })()`;
  }
  if (compiler.lang === 'js') {
    const rollupConfig = {
      input: 'main.js',
      plugins: [virtual({ 'main.js': `export default ${source}` })].concat(options.minify ? [uglify()] : []),
      output: {
        format: options.format,
        name: options.name
      }
    };
    const bundle = await rollup(rollupConfig);
    const generated = await bundle.generate(rollupConfig);
    return generated.code;
  } else {
    return source;
  }
}

const exported = { compile, setter: Setter, splice: Splice };
Object.keys(TokenTypeData).forEach(t => {
  if (TokenTypeData[t].private) {
    return; // privates aren't exported - only used in optimizing code or internally
  }
  if (TokenTypeData[t].nonVerb) {
    exported[t] = wrap(new Token(t));
  } else if (TokenTypeData[t].nonChained) {
    exported[t] = (...args) => wrap(createExpr(new Token(t, currentLine()), ...args));
  }
});
exported.chain = val => wrap(convertArrayAndObjectsToExpr(val));

module.exports = exported;
