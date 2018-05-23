const TokenTypes = require('./token-type');

class Token {
  constructor(type) {
    this.$type = type;
  }
  toJSON() {
    return (
      `*${this.$type}* : ` +
      Object.keys(this)
        .filter(k => k !== '$type' && k !== '$path')
        .map(k => `${k}:${JSON.stringify(this[k])}`)
        .join(', ') +
      (this.$path ? `, $path: ${JSON.stringify(this.$path, null, 2)}` : '')
    );
  }
}

const TokenTypeData = {
  and: new TokenTypes({ nonChained: true }),
  or: new TokenTypes({ nonChained: true }),
  array: new TokenTypes({ nonChained: true, private: true }),
  object: new TokenTypes({ nonChained: true, private: true }),
  not: new TokenTypes({ chainIndex: 1 }),
  ternary: new TokenTypes({ chainIndex: 1 }),
  get: new TokenTypes({ chainIndex: 2 }),
  root: new TokenTypes({ nonVerb: true }),
  mapValues: new TokenTypes({ collectionVerb: true, chainIndex: 2 }),
  map: new TokenTypes({ collectionVerb: true, chainIndex: 2, arrayVerb: true }),
  recursiveMapValues: new TokenTypes({ collectionVerb: true, chainIndex: 2 }),
  recursiveMap: new TokenTypes({ collectionVerb: true, chainIndex: 2, arrayVerb: true }),
  any: new TokenTypes({
    collectionVerb: true,
    chainIndex: 2,
    arrayVerb: true
  }),
  keyBy: new TokenTypes({
    collectionVerb: true,
    chainIndex: 2,
    arrayVerb: true
  }),
  filter: new TokenTypes({
    collectionVerb: true,
    chainIndex: 2,
    arrayVerb: true
  }),
  anyValues: new TokenTypes({
    collectionVerb: true,
    chainIndex: 2
  }),
  filterBy: new TokenTypes({ collectionVerb: true, chainIndex: 2 }),
  mapKeys: new TokenTypes({ collectionVerb: true, chainIndex: 2 }),
  groupBy: new TokenTypes({ collectionVerb: true, chainIndex: 2 }),
  values: new TokenTypes({ collectionVerb: true, chainIndex: 1 }),
  keys: new TokenTypes({ collectionVerb: true, chainIndex: 1 }),
  size: new TokenTypes({ collectionVerb: true, chainIndex: 1 }),
  range: new TokenTypes({ chainIndex: 1 }),
  assign: new TokenTypes({ collectionVerb: true, chainIndex: 1 }),
  defaults: new TokenTypes({ collectionVerb: true, chainIndex: 1 }),
  loop: new TokenTypes({ nonVerb: true }),
  recur: new TokenTypes({ chainIndex: 2 }),
  context: new TokenTypes({ nonVerb: true }),
  func: new TokenTypes({ private: true }),
  val: new TokenTypes({ nonVerb: true }),
  key: new TokenTypes({ nonVerb: true }),
  arg0: new TokenTypes({ nonVerb: true }),
  arg1: new TokenTypes({ nonVerb: true }),
  arg2: new TokenTypes({ nonVerb: true }),
  topLevel: new TokenTypes({ nonVerb: true, private: true }),
  null: new TokenTypes({ nonVerb: true, private: true }),
  eq: new TokenTypes({ chainIndex: 1 }),
  gt: new TokenTypes({ chainIndex: 1 }),
  lt: new TokenTypes({ chainIndex: 1 }),
  gte: new TokenTypes({ chainIndex: 1 }),
  lte: new TokenTypes({ chainIndex: 1 }),
  plus: new TokenTypes({ chainIndex: 1 }),
  minus: new TokenTypes({ chainIndex: 1 }),
  mult: new TokenTypes({ chainIndex: 1 }),
  div: new TokenTypes({ chainIndex: 1 }),
  mod: new TokenTypes({ chainIndex: 1 }),
  call: new TokenTypes({ chainIndex: 2 }),
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
        return new Token(token.$type);
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
AllTokens.Setter = (...args) => new SetterExpression(...args);
AllTokens.Splice = (...args) => new SpliceSetterExpression(...args, new Token('key'));
AllTokens.Expression = Expression;
AllTokens.TokenTypeData = TokenTypeData; //AllTokensList;
AllTokens.SetterExpression = SetterExpression;
AllTokens.SpliceSetterExpression = SpliceSetterExpression;

function cloneHelper(model) {
  if (model instanceof Token) {
    return new Token(model.$type);
  } else if (model instanceof Expression) {
    return new Expression(...model.map(cloneHelper));
  } else if (model instanceof SpliceSetterExpression) {
    return new SpliceSetterExpression(...model.map(cloneHelper));
  } else if (model instanceof SetterExpression) {
    return new SetterExpression(...model.map(cloneHelper));
  }
  return model;
}

function Clone(model) {
  return Object.keys(model).reduce((acc, key) => {
    acc[key] = cloneHelper(model[key]);
    return acc;
  }, {});
}
AllTokens.Clone = Clone;
module.exports = AllTokens;
