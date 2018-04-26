class TokenType {
  constructor(options) {
    options = options || {};
    this.private = options.private || false;
    this.nonVerb = options.nonVerb || false;
    this.arrayVerb = options.arrayVerb || false;
    this.collectionVerb = options.collectionVerb || false;
    this.anyVerb = options.anyVerb || false;
    this.chainIndex = options.chainIndex || null;
    this.nonChained = options.nonChained || this.nonVerb || false;
  }
}

module.exports = TokenType;
