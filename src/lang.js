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
  not: new TokenTypes({ chainIndex: 1 }),
  get: new TokenTypes({ chainIndex: 2 }),
  root: new TokenTypes({ nonVerb: true }),
  mapValues: new TokenTypes({ collectionVerb: true, chainIndex: 2 }),
  map: new TokenTypes({ collectionVerb: true, chainIndex: 2, arrayVerb: true }),
  any: new TokenTypes({
    collectionVerb: true,
    chainIndex: 2,
    arrayVerb: true,
    anyVerb: true
  }),
  filterBy: new TokenTypes({ collectionVerb: true, chainIndex: 2 }),
  mapKeys: new TokenTypes({ collectionVerb: true, chainIndex: 2 }),
  groupBy: new TokenTypes({ collectionVerb: true, chainIndex: 2 }),
  context: new TokenTypes({ nonVerb: true }),
  func: new TokenTypes({ private: true }),
  val: new TokenTypes({ nonVerb: true }),
  key: new TokenTypes({ nonVerb: true }),
  arg0: new TokenTypes({ nonVerb: true }),
  arg1: new TokenTypes({ nonVerb: true }),
  topLevel: new TokenTypes({ nonVerb: true, private: true }),
  eq: new TokenTypes({ chainIndex: 1 }),
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
AllTokens.Token = Token;
AllTokens.Expr = (...args) => new Expression(...args);
AllTokens.Setter = (...args) => new SetterExpression(...args);
AllTokens.TokensThatOperateOnCollections = Object.keys(TokenTypeData).filter(k => TokenTypeData[k].collectionVerb);
AllTokens.Expression = Expression;
AllTokens.TokenTypeData = TokenTypeData; //AllTokensList;
AllTokens.SetterExpression = SetterExpression;

module.exports = AllTokens;
