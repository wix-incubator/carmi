const _ = require('lodash');
const path = require('path');
const ignoredLinePatterns =
  [
    'sugar.js',
    'expressionBuilder.js',
    'frontend.js',
    'proxyHandler.js',
    'currentLine'
  ]
  .map(relative => path.resolve(__dirname, relative))
  .concat([path.resolve(__dirname, '../index.js'), path.resolve(__dirname, '../jsx.js')]);

module.exports = () => {
  const e = new Error();
  const lines = e.stack.split('\n');
  const externalLine =
    lines
      .slice(1)
      .filter(l => !_.some(ignoredLinePatterns, p => l.indexOf(p) !== -1) && l.indexOf(':') !== -1)[0] || 'unknown';
  return externalLine.substr(externalLine.indexOf(path.sep)).split(':').map((str, idx) => idx > 0 ? `${parseInt(str, 10)}` : str).join(':')
}
