const babylon = require('babylon');
const {omit, collectAllNodes} = require('./annotation-utils');
const omitFields = {
  loc: true,
  start: true,
  end: true,
  optional: true,
  variance: true,
  exact: true,
  static: true
};

function extractTypes(source) {
  const ast = babylon.parse(source, {plugins: ['flow']});
  const types = collectAllNodes(ast, node => node.type === 'TypeAlias').reduce((acc, node) => {
    acc[node.id.name] = omit(node.right, omitFields);
    return acc;
  }, {});
  const expr = collectAllNodes(
    ast,
    node =>
      node.type === 'FunctionDeclaration' &&
      node.returnType &&
      node.returnType.typeAnnotation &&
      node.id.name.indexOf('annotate_') === 0
  ).reduce((acc, node) => {
    acc[node.id.name.replace('annotate_', '')] = omit(node.returnType.typeAnnotation, omitFields);
    return acc;
  }, {});
  return {expr, types};
}

module.exports = {extractTypes};
