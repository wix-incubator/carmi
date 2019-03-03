'use strict';

const _ = require('lodash');
const {
  Setter,
  Splice,
  Push,
  isSetterExpression,
  isSpliceExpression,
  isPushExpression,
  isExpression,
  withName
} = require('./src/lang');
const currentLine = require('./src/currentLine');

const GLOBAL_TOKEN = '__$CARMI$__';
if (global[GLOBAL_TOKEN]) {
  throw new Error(
    `require of multiple versions of Carmi is not supported previously loaded from:${global[GLOBAL_TOKEN]}`
  );
}
global[GLOBAL_TOKEN] = currentLine();
const {initProxyHandler} = require('./src/proxyHandler');
const expressionBuilder = require('./src/expressionBuilder');
const unwrapableProxy = require('./src/unwrapable-proxy');
const compile = require('./src/compile');
const frontend = require('./src/frontend');
const sugar = require('./src/sugar');
initProxyHandler({sugar, unwrapableProxy, expressionBuilder, frontend});

const API = {
  compile,
  setter: Setter,
  splice: Splice,
  push: Push,
  isSetterExpression,
  isSpliceExpression,
  isPushExpression,
  isExpression,
  withName,
  inferFromModel: _.identity,
  withSchema,
  ...frontend
};

module.exports = API


function withSchema() {
  return API
}
