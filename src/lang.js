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

class WrappedPrimitive {
  constructor(value) {
    this.$primitive = value;
  }
  toJSON() {
    return this.$primitive;
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
  not: new TokenTypes({ nonChained: true, chainIndex: 1, len: [2, 2] }),
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
  range: new TokenTypes({ chainIndex: 1, len: [2, 4] }),
  assign: new TokenTypes({ collectionVerb: true, chainIndex: 1, len: [2, 2] }),
  defaults: new TokenTypes({ collectionVerb: true, chainIndex: 1, len: [2, 2] }),
  loop: new TokenTypes({ nonVerb: true }),
  recur: new TokenTypes({ chainIndex: 2, len: [3, 3] }),
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
  call: new TokenTypes({ nonChained: true, chainIndex: 2, len: [3, Number.MAX_SAFE_INTEGER], tryToHoist: true }),
  bind: new TokenTypes({ nonChained: true, chainIndex: 2, len: [2, Number.MAX_SAFE_INTEGER], tryToHoist: true }),
  startsWith: new TokenTypes({nonChained: true, chainIndex: 1, len: [3, 3]}),
  endsWith: new TokenTypes({nonChained: true, chainIndex: 1, len: [3, 3]}),
  toUpperCase: new TokenTypes({nonChained: true, chainIndex: 1, len: [2, 2]}),
  toLowerCase: new TokenTypes({nonChained: true, chainIndex: 1, len: [2, 2]}),
  substring: new TokenTypes({nonChained: true, chainIndex: 1, len: [4, 4]}),
  split: new TokenTypes({nonChained: true, chainIndex: 1, len: [3, 3]}),
  wildcard: new TokenTypes({ nonVerb: true, private: true })
};

const AllTokens = Object.keys(TokenTypeData).reduce((acc, k) => {
  acc[k[0].toUpperCase() + k.slice(1)] = new Token(k);
  return acc;
}, {});

class Expression extends Array {
  constructor(...tokens) {
    super(...tokens);
  }
}

class SetterExpression extends Array {}
class SpliceSetterExpression extends SetterExpression {}
AllTokens.Token = Token;
AllTokens.Expr = (...args) => new Expression(...args);

function validatePathSegmentArguments(args) {
  if (args.length === 0) {
    throw new Error(`Invalid arguments for setter/splice - must receive a path`);
  }

  const invalidArgs = args.filter(arg =>
    typeof arg !== 'string' &&
    typeof arg !== 'number' &&
    !(arg instanceof Token &&
      (arg.$type === 'arg0' || arg.$type === 'arg1' || arg.$type === 'arg2')));

  if (invalidArgs.length > 0) {
    throw new Error(`Invalid arguments for setter/splice - can only accept path (use arg0/arg1/arg2 - to define placeholders in the path), received [${args}]`);
  }
}

AllTokens.Setter = (...args) => {
  validatePathSegmentArguments(args);
  return new SetterExpression(...args);
};
AllTokens.Splice = (...args) => {
  validatePathSegmentArguments(args);
  return new SpliceSetterExpression(...args, new Token('key'));
}
AllTokens.Expression = Expression;
AllTokens.TokenTypeData = TokenTypeData; //AllTokensList;
AllTokens.SetterExpression = SetterExpression;
AllTokens.SpliceSetterExpression = SpliceSetterExpression;


function Clone(model) {
  if (model instanceof Token) {
    return cloneToken(model);
  } else if (model instanceof Expression) {
    return new Expression(...model.map(Clone));
  }
  return model;
}

AllTokens.Clone = Clone;
AllTokens.cloneToken = cloneToken;
AllTokens.SourceTag = SourceTag;
AllTokens.WrappedPrimitive = WrappedPrimitive;
module.exports = AllTokens;
