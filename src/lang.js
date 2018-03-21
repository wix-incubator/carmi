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

const TokensRequireExpressions = {
  and: true,
  or: true,
  not: true,
  get: true,
  root: false,
  mapValues: true,
  filterBy: true,
  mapKeys: true,
  groupBy: true,
  context: false,
  func: true,
  arg0: false,
  arg1: false,
  topLevel: true,
  eq: true,
  wildcard: false
};

const AllTokens = Object.keys(TokensRequireExpressions).reduce((acc, k) => {
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
AllTokens.TokensThatOperateOnCollections = ['mapValues', 'filterBy', 'mapKeys', 'groupBy'];
AllTokens.Expression = Expression;
AllTokens.TokensRequireExpressions = TokensRequireExpressions; //AllTokensList;
AllTokens.SetterExpression = SetterExpression;

module.exports = AllTokens;
