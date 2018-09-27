const { chain } = require('./index');

function createElement(type, props, ...children) {
  if (children.length) {
    return chain({ type, props, children }).call('createElement');
  }
  return chain({ type, props }).call('createElement');
}

function bind(funcName, ...args) {
  return chain([funcName, ...args]).call('bind');
}

module.exports = { createElement, bind };
