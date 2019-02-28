const {
    Expr,
    Gte,
    Gt,
    Or,
    And,
    Not,
    Ne,
    Lte,
    Lt,
    Eq,
    Token,
    Expression,
    SetterExpression,
    TopLevel,
    Root,
    Get,
    Clone,
    WrappedPrimitive,
    TokenTypeData,
    SourceTag,
    cloneToken
  } = require('./lang');

const MathInverseMap = {
    eq: Ne,
    ne: Eq,
    gt: Lte,
    gte: Lt,
    lt: Gte,
    lte: Gt
}

const LogicInverseMap = {
    and: Or,
    or: And
}

function or(...conds) {
    conds = conds.filter(t => t !== false)
    if (conds.some(t => t === true)) {
        return true;
    }
    if (conds.length === 0) {
      return false;
    }
    if (conds.length === 1) {
      return conds[0]
    }
    return Expr(Or, ...conds);
  }
  
  function and(...conds) {
    conds = conds.filter(t => t !== true)
    if (conds.some(t => t === false)) {
      return false;
    }
    if (conds.length === 0) {
      return true;
    }
    if (conds.length === 1) {
      return conds[0]
    }
    return Expr(And, ...conds);
  }
  
  function not(cond) {
    if (typeof cond === 'boolean') {
      return !cond;
    }
    const tokenType = cond[0].$type;
    if (MathInverseMap[tokenType]) {
        return Expr(MathInverseMap[tokenType], ...cond.slice(1))
    }
    if (LogicInverseMap[tokenType]) {
        return Expr(LogicInverseMap[tokenType], ...cond.slice(1).map(not))
    }
    return Expr(Not, cond);
  }

  module.exports = {or, and, not}