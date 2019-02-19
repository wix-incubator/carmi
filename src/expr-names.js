const _ = require('lodash');
const {SourceTag} = require('./lang');
const path = require('path');
const {exprHash} = require('./expr-hash');

function tagToSimpleFilename(tag) {
  const lineParts = tag.split(path.sep);
  const fileName = lineParts[lineParts.length - 1].replace(/\).*/, '');
  const simpleName = fileName
    .split('.js:')[0]
    .replace(/\.carmi$/, '')
    .split('.')
    .find(x => x);
  return simpleName;
}

function generateNameFromTag(expr) {
  if (expr[0][SourceTag]) {
    const tag = expr[0][SourceTag];
    return `_${[tagToSimpleFilename(tag)].concat(tag.split(':').slice(1)).join('_')}_`;
  }
  return '';
}

function generateName(namesByExpr, expr) {
  return (
    generateNameFromTag(expr) ||
    _(expr)
      .tail()
      .reverse()
      .map(e => {
        const preNamed = namesByExpr[exprHash(e)];
        if (preNamed) {
          return preNamed;
        }
        return _.find(_.flattenDeep(e), x => typeof x === 'string') || '';
      })
      .join('')
  );
}

module.exports = { generateName, generateNameFromTag, tagToSimpleFilename };
