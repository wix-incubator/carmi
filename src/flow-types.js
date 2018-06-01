const types = require('babel-types');
const babylon = require('babylon');
const traverse = require('babel-traverse').default;

function omitLocation(node) {
  if (Array.isArray(node)) {
    return node.map(omitLocation);
  } else if (typeof node === 'object' && node !== null) {
    return Object.keys(node).reduce((acc, k) => {
      if (k !== 'loc' && k !== 'start' && k !== 'end') {
        acc[k] = omitLocation(node[k]);
      }
      return acc;
    }, {});
  } else {
    return node;
  }
}

function extractTypes(source) {
  const ast = babylon.parse(source, { plugins: ['flow'] });
  let first = true;
  const annotations = {};
  annotations.expr = {};
  traverse(ast, {
    enter(path) {
      if (
        path.node.type === 'FunctionDeclaration' &&
        path.node.returnType &&
        path.node.returnType.typeAnnotation &&
        (first || path.node.id.name.indexOf('annotate') === 0)
      ) {
        if (first) {
          annotations.model = omitLocation(path.node.params[0].typeAnnotation);
          annotations.funcLib = omitLocation(path.node.params[0].typeAnnotation);
        } else {
          annotations.expr[path.node.id.name.replace('annotate_', '')] = omitLocation(
            path.node.returnType.typeAnnotation
          );
        }
        first = false;
      }
    }
  });
  return annotations;
}

module.exports = { extractTypes };
