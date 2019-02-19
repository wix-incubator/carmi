/*eslint no-nested-ternary:0*/

class TokenType {
  constructor(options) {
    options = options || {};
    this.private = options.private || false;
    this.nonVerb = options.nonVerb || false;
    this.len = options.len || [1, Number.MAX_SAFE_INTEGER];
    this.arrayVerb = options.arrayVerb || false;
    this.collectionVerb = options.collectionVerb || false;
    this.chainIndex = options.chainIndex || null;
    this.nonChained = options.nonChained || this.nonVerb || false;
    this.recursive = options.recursive || false;
    this.tryToHoist = options.tryToHoist || this.collectionVerb;
    this.expectedTypes =
      options.expectedTypes ||
      (this.arrayVerb ? ['array'] :
        this.collectionVerb ? ['object'] : null)
  }
}

module.exports = TokenType;
