const TokenTypes = require('./token-type');
const SourceTag = Symbol('SourceTag');
class Token {
  constructor(type, source) {
    this.$type = type;
    if (source) {
      this[SourceTag] = source;
    }
  }
  toJSON() {
    return `*${this.$type}*`;
  }
  toString() {
    return `*${this.$type}*`;
  }
}

function cloneToken(token) {
  return new Token(token.$type, token[SourceTag]);
}

const TokenTypeData = {
  and: new TokenTypes({ nonChained: true, len: [2, Number.MAX_SAFE_INTEGER] }),
  or: new TokenTypes({ nonChained: true, len: [2, Number.MAX_SAFE_INTEGER] }),
  array: new TokenTypes({ nonChained: true, private: true, tryToHoist: true }),
  object: new TokenTypes({ nonChained: true, private: true, tryToHoist: true }),
  not: new TokenTypes({ chainIndex: 1, len: [2, 2] }),
  ternary: new TokenTypes({ nonChained: true, chainIndex: 1, len: [4, 4] }),
  get: new TokenTypes({ chainIndex: 2, len: [3, 3] }),
  root: new TokenTypes({ nonVerb: true }),
  mapValues: new TokenTypes({ collectionVerb: true, chainIndex: 2, len: [3, 4] }),
  map: new TokenTypes({ collectionVerb: true, chainIndex: 2, arrayVerb: true, len: [3, 4] }),
  recursiveMapValues: new TokenTypes({ collectionVerb: true, chainIndex: 2, recursive: true, len: [3, 4] }),
  recursiveMap: new TokenTypes({ collectionVerb: true, chainIndex: 2, arrayVerb: true, recursive: true, len: [3, 4] }),
  any: new TokenTypes({
    collectionVerb: true,
    chainIndex: 2,
    arrayVerb: true,
    len: [3, 4]
  }),
  keyBy: new TokenTypes({
    collectionVerb: true,
    chainIndex: 2,
    arrayVerb: true,
    len: [3, 4]
  }),
  filter: new TokenTypes({
    collectionVerb: true,
    chainIndex: 2,
    arrayVerb: true,
    len: [3, 4]
  }),
  anyValues: new TokenTypes({
    collectionVerb: true,
    chainIndex: 2,
    len: [3, 4]
  }),
  filterBy: new TokenTypes({ collectionVerb: true, chainIndex: 2, len: [3, 4] }),
  mapKeys: new TokenTypes({ collectionVerb: true, chainIndex: 2, len: [3, 4] }),
  groupBy: new TokenTypes({ collectionVerb: true, chainIndex: 2, len: [3, 4] }),
  values: new TokenTypes({ collectionVerb: true, chainIndex: 1, len: [2, 2] }),
  keys: new TokenTypes({ collectionVerb: true, chainIndex: 1, len: [2, 2] }),
  size: new TokenTypes({ collectionVerb: true, chainIndex: 1, len: [2, 2] }),
  range: new TokenTypes({ chainIndex: 1, len: [2, 2] }),
  assign: new TokenTypes({ collectionVerb: true, chainIndex: 1, len: [2, 2] }),
  defaults: new TokenTypes({ collectionVerb: true, chainIndex: 1, len: [2, 2] }),
  loop: new TokenTypes({ nonVerb: true }),
  recur: new TokenTypes({ chainIndex: 2, len: [2, 2] }),
  context: new TokenTypes({ nonVerb: true }),
  func: new TokenTypes({ private: true }),
  val: new TokenTypes({ nonVerb: true }),
  key: new TokenTypes({ nonVerb: true }),
  arg0: new TokenTypes({ nonVerb: true }),
  arg1: new TokenTypes({ nonVerb: true }),
  arg2: new TokenTypes({ nonVerb: true }),
  topLevel: new TokenTypes({ nonVerb: true, private: true }),
  null: new TokenTypes({ nonVerb: true, private: true }),
  eq: new TokenTypes({ chainIndex: 1, len: [3, 3] }),
  gt: new TokenTypes({ chainIndex: 1, len: [3, 3] }),
  lt: new TokenTypes({ chainIndex: 1, len: [3, 3] }),
  gte: new TokenTypes({ chainIndex: 1, len: [3, 3] }),
  lte: new TokenTypes({ chainIndex: 1, len: [3, 3] }),
  plus: new TokenTypes({ chainIndex: 1, len: [3, 3] }),
  minus: new TokenTypes({ chainIndex: 1, len: [3, 3] }),
  mult: new TokenTypes({ chainIndex: 1, len: [3, 3] }),
  div: new TokenTypes({ chainIndex: 1, len: [3, 3] }),
  mod: new TokenTypes({ chainIndex: 1, len: [3, 3] }),
  call: new TokenTypes({ chainIndex: 2, len: [3, Number.MAX_SAFE_INTEGER], tryToHoist: true }),
  wildcard: new TokenTypes({ nonVerb: true, private: true })
};

const AllTokens = Object.keys(TokenTypeData).reduce((acc, k) => {
  acc[k[0].toUpperCase() + k.slice(1)] = new Token(k);
  return acc;
}, {});

class Expression extends Array {
  constructor(...tokens) {
    const clonedTokens = tokens.map(token => {
      if (token instanceof Token) {
        return cloneToken(token);
      } else if (token instanceof Expression) {
        return new Expression(...token);
      }
      return token;
    });
    super(...clonedTokens);
  }
}

class SetterExpression extends Array {}
class SpliceSetterExpression extends SetterExpression {}
AllTokens.Token = Token;
AllTokens.Expr = (...args) => new Expression(...args);
AllTokens.Setter = (...args) => {
  if (args.length === 0) {
    throw new Error(`Can't build setter on model root`);
  }
  return new SetterExpression(...args);
};
AllTokens.Splice = (...args) => new SpliceSetterExpression(...args, new Token('key'));
AllTokens.Expression = Expression;
AllTokens.TokenTypeData = TokenTypeData; //AllTokensList;
AllTokens.SetterExpression = SetterExpression;
AllTokens.SpliceSetterExpression = SpliceSetterExpression;

function cloneHelper(model) {
  if (model instanceof Token) {
    return cloneToken(model);
  } else if (model instanceof Expression) {
    const newExpr = new Expression();
    newExpr.splice(0, 0, ...model.map(cloneHelper));
    return newExpr;
  } else if (model instanceof SpliceSetterExpression) {
    return new SpliceSetterExpression(...model.map(cloneHelper));
  } else if (model instanceof SetterExpression) {
    return new SetterExpression(...model.map(cloneHelper));
  } else if (Array.isArray(model)) {
    return model.map(t => cloneHelper(t));
  } else if (typeof model === 'object' && model) {
    return Object.keys(model).reduce((acc, key) => {
      acc[key] = cloneHelper(model[key]);
      return acc;
    }, {});
  }
  return model;
}

function Clone(model) {
  return cloneHelper(model);
}
AllTokens.Clone = Clone;
AllTokens.cloneToken = cloneToken;
AllTokens.SourceTag = SourceTag;
module.exports = AllTokens;
