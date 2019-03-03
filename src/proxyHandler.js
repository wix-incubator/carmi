'use strict'

const _ = require('lodash')
const colors = require('ansi-colors')
const {
  TokenTypeData,
  Token,
  cloneToken,
  SourceTag,
  UnwrappedExpr
} = require('./lang');
const currentLine = require('./currentLine');
const {searchExpressionsWithoutInnerFunctions} = require('./expr-search');

const tokensNotAllowedToReuseFromOtherExpressions = {
  val: true,
  key: true,
  loop: true,
  context: true
}

function throwOnTokensFromOtherFuncs(expr, type, tag) {
  searchExpressionsWithoutInnerFunctions(subExpr => {
    subExpr.forEach(token => {
      if (
        token instanceof Token &&
        token[SourceTag] &&
        token[SourceTag] !== tag &&
        tokensNotAllowedToReuseFromOtherExpressions[token.$type]
      ) {
        const emph = txt => colors.yellow(txt)
        throw new Error(
          `
           Using arguments (key/value) from one carmi function in the scope of another carmi function is not allowed.

           In expression ${emph(subExpr[0].$type)} at ${emph(subExpr[0][SourceTag])},
              expression ${emph(JSON.stringify(token))} from outer function at ${emph(token[SourceTag])}
              is used in inner function ${emph(type)} at ${emph(tag.toString())}

           Use a context in the inner function instead.
          `
        );
      }
    });
  }, [expr]);
}

const handler = {}
const init = _.once(({
  sugar,
  unwrapableProxy: {wrap},
  expressionBuilder: {createExpr},
  frontend: {chain}
}) => {
  handler.get = (target, key) => {
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
      throw new Error(`unknown token: "${key}" at ${currentLine()}`);
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
            throwOnTokensFromOtherFuncs(args[1], args[0].$type, sourceTag);
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

  handler.apply = (target, thisArg, args) => {
    if (target instanceof Token) {
      wrap(createExpr(cloneToken(target), ...args));
    } else {
      throw `${String(target)} not a function`;
    }
  };
})


module.exports = {
  initProxyHandler: init,
  proxyHandler: handler
};
