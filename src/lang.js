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

/*eslint no-use-before-define:0*/
function Clone(model) {
  if (model instanceof Token) {
    return cloneToken(model);
  } else if (model instanceof Expression) {
    return new Expression(...model.map(Clone));
  }
  return model;
}

const TokenTypeData = {
  and: new TokenTypes({nonChained: true, len: [2, Number.MAX_SAFE_INTEGER]}),
  or: new TokenTypes({nonChained: true, len: [2, Number.MAX_SAFE_INTEGER]}),
  array: new TokenTypes({nonChained: true, private: true, tryToHoist: true}),
  object: new TokenTypes({nonChained: true, private: true, tryToHoist: true}),
  not: new TokenTypes({nonChained: true, chainIndex: 1, len: [2, 2]}),
  ternary: new TokenTypes({nonChained: true, chainIndex: 1, len: [4, 4]}),
  trace: new TokenTypes({chainIndex: 2, len: [2, 4]}),
  get: new TokenTypes({chainIndex: 2, len: [3, 3]}),
  root: new TokenTypes({nonVerb: true}),
  mapValues: new TokenTypes({collectionVerb: true, chainIndex: 2, len: [3, 4], stable: true}),
  map: new TokenTypes({collectionVerb: true, chainIndex: 2, arrayVerb: true, len: [3, 4], stable: true}),
  recursiveMapValues: new TokenTypes({collectionVerb: true, chainIndex: 2, recursive: true, len: [3, 4], stable: true}),
  recursiveMap: new TokenTypes({collectionVerb: true, chainIndex: 2, arrayVerb: true, recursive: true, len: [3, 4], stable: true}),
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
    len: [3, 4],
    stable: true
  }),
  filter: new TokenTypes({
    collectionVerb: true,
    chainIndex: 2,
    arrayVerb: true,
    len: [3, 4],
    stable: true
  }),
  anyValues: new TokenTypes({
    collectionVerb: true,
    chainIndex: 2,
    len: [3, 4]
  }),
  filterBy: new TokenTypes({collectionVerb: true, chainIndex: 2, len: [3, 4], stable: true}),
  mapKeys: new TokenTypes({collectionVerb: true, chainIndex: 2, len: [3, 4], stable: true}),
  groupBy: new TokenTypes({collectionVerb: true, chainIndex: 2, len: [3, 4], stable: true}),
  values: new TokenTypes({collectionVerb: true, chainIndex: 1, len: [2, 2], stable: true}),
  keys: new TokenTypes({collectionVerb: true, chainIndex: 1, len: [2, 2], stable: true}),
  flatten: new TokenTypes({collectionVerb: true, chainIndex: 1, len: [2, 2], expectedTypes: ['array'], stable: true}),
  size: new TokenTypes({collectionVerb: true, chainIndex: 1, len: [2, 2], expectedTypes: ['array', 'object']}),
  sum: new TokenTypes({collectionVerb: true, chainIndex: 1, len: [2, 2], expectedTypes: ['array']}),
  range: new TokenTypes({chainIndex: 1, len: [2, 4], stable: true}),
  assign: new TokenTypes({collectionVerb: true, chainIndex: 1, len: [2, 2], expectedTypes: ['array'], stable: true}),
  defaults: new TokenTypes({collectionVerb: true, chainIndex: 1, len: [2, 2], expectedTypes: ['array'], stable: true}),
  loop: new TokenTypes({nonVerb: true}),
  recur: new TokenTypes({chainIndex: 2, len: [3, 3]}),
  context: new TokenTypes({nonVerb: true}),
  func: new TokenTypes({private: true, len: [2, 2]}),
  invoke: new TokenTypes({private: true, len: [2, Number.MAX_SAFE_INTEGER]}),
  val: new TokenTypes({nonVerb: true}),
  key: new TokenTypes({nonVerb: true}),
  arg0: new TokenTypes({nonVerb: true}),
  arg1: new TokenTypes({nonVerb: true}),
  arg2: new TokenTypes({nonVerb: true}),
  arg3: new TokenTypes({nonVerb: true}),
  arg4: new TokenTypes({nonVerb: true}),
  arg5: new TokenTypes({nonVerb: true}),
  arg6: new TokenTypes({nonVerb: true}),
  arg7: new TokenTypes({nonVerb: true}),
  arg8: new TokenTypes({nonVerb: true}),
  arg9: new TokenTypes({nonVerb: true}),
  topLevel: new TokenTypes({nonVerb: true, private: true}),
  cond: new TokenTypes({private: true}),
  null: new TokenTypes({nonVerb: true, private: true}),
  eq: new TokenTypes({chainIndex: 1, len: [3, 3]}),
  gt: new TokenTypes({chainIndex: 1, len: [3, 3], expectedTypes: ['number']}),
  lt: new TokenTypes({chainIndex: 1, len: [3, 3], expectedTypes: ['number']}),
  gte: new TokenTypes({chainIndex: 1, len: [3, 3], expectedTypes: ['number']}),
  lte: new TokenTypes({chainIndex: 1, len: [3, 3], expectedTypes: ['number']}),
  plus: new TokenTypes({chainIndex: 1, len: [3, 3], expectedTypes: ['number', 'string']}),
  minus: new TokenTypes({chainIndex: 1, len: [3, 3], expectedTypes: ['number']}),
  mult: new TokenTypes({chainIndex: 1, len: [3, 3], expectedTypes: ['number']}),
  div: new TokenTypes({chainIndex: 1, len: [3, 3], expectedTypes: ['number']}),
  mod: new TokenTypes({chainIndex: 1, len: [3, 3], expectedTypes: ['number']}),
  breakpoint: new TokenTypes({chainIndex: 1, len: [2, 2]}),
  call: new TokenTypes({nonChained: true, chainIndex: 2, len: [3, Number.MAX_SAFE_INTEGER], tryToHoist: true}),
  bind: new TokenTypes({nonChained: true, chainIndex: 2, len: [2, Number.MAX_SAFE_INTEGER], tryToHoist: true, stable: true}),
  effect: new TokenTypes({nonChained: true, chainIndex: 2, len: [3, Number.MAX_SAFE_INTEGER]}),
  startsWith: new TokenTypes({nonChained: true, chainIndex: 1, len: [3, 3], expectedTypes: ['string']}),
  endsWith: new TokenTypes({nonChained: true, chainIndex: 1, len: [3, 3], expectedTypes: ['string']}),
  toUpperCase: new TokenTypes({nonChained: true, chainIndex: 1, len: [2, 2], expectedTypes: ['string']}),
  toLowerCase: new TokenTypes({nonChained: true, chainIndex: 1, len: [2, 2], expectedTypes: ['string']}),
  stringLength: new TokenTypes({nonChained: true, chainIndex: 1, len: [2, 2], expectedTypes: ['string']}),
  floor: new TokenTypes({nonChained: true, chainIndex: 1, len: [2, 2], expectedTypes: ['number']}),
  ceil: new TokenTypes({nonChained: true, chainIndex: 1, len: [2, 2], expectedTypes: ['number']}),
  round: new TokenTypes({nonChained: true, chainIndex: 1, len: [2, 2], expectedTypes: ['number']}),
  parseInt: new TokenTypes({nonChained: true, chainIndex: 1, len: [2, 3], expectedTypes: ['string']}),
  substring: new TokenTypes({nonChained: true, chainIndex: 1, len: [4, 4], expectedTypes: ['string']}),
  split: new TokenTypes({nonChained: true, chainIndex: 1, len: [3, 3]}),
  isUndefined: new TokenTypes({nonChained: true, chainIndex: 1, len: [2, 2]}),
  isBoolean: new TokenTypes({nonChained: true, chainIndex: 1, len: [2, 2]}),
  isString: new TokenTypes({nonChained: true, chainIndex: 1, len: [2, 2]}),
  isNumber: new TokenTypes({nonChained: true, chainIndex: 1, len: [2, 2]}),
  isArray: new TokenTypes({nonChained: true, chainIndex: 1, len: [2, 2]}),
  abstract: new TokenTypes({nonChained: true, len: [3, 3], private: true}),
  quote: new TokenTypes({nonChained: true, len: [2, 2], private: true, stable: true})
};

const AllTokens = Object.keys(TokenTypeData).reduce((acc, k) => {
  acc[k[0].toUpperCase() + k.slice(1)] = new Token(k);
  return acc;
}, {});

class Expression extends Array {
  /**
   * @param {...string} tokens
   */
  constructor(...tokens) { //eslint-disable-line no-useless-constructor
    super(...tokens);
  }
}

class SetterExpression extends Array {
  toJSON() {
    return ['*setter*'].concat(this)
  }
}
class SpliceSetterExpression extends SetterExpression {
  toJSON() {
    return ['*splice*'].concat(this)
  }
}
AllTokens.Token = Token;
AllTokens.Expr = (...args) => new Expression(Clone(args[0]), ...args.slice(1));

function validatePathSegmentArguments(args) {
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
  if (args.length === 0) {
    throw new Error('Invalid arguments for setter/splice - must receive a path');
  }
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

AllTokens.isSetterExpression = expression => expression instanceof SetterExpression;
AllTokens.isSpliceExpression = expression => expression instanceof SpliceSetterExpression;
AllTokens.isExpression = expression => expression instanceof Expression;
AllTokens.isToken = token => token instanceof Token;

AllTokens.Clone = Clone;
AllTokens.cloneToken = cloneToken;
AllTokens.SourceTag = SourceTag;
AllTokens.WrappedPrimitive = WrappedPrimitive;
module.exports = AllTokens;
