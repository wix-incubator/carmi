'use strict';
const {SetterExpression, SpliceSetterExpression} = require('./lang');

const carmiIs = {
  isSetterExpression: (expression) => expression instanceof SetterExpression,
  isSpliceExpression: (expression) => expression instanceof SpliceSetterExpression
};

module.exports = carmiIs;

