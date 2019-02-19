const _ = require('lodash');

function omit(node, fields) {
  if (Array.isArray(node)) {
    return node.map(child => omit(child, fields));
  } else if (typeof node === 'object' && node !== null) {
    return Object.keys(node).reduce((acc, k) => {
      if (!fields.hasOwnProperty(k)) {
        acc[k] = omit(node[k], fields);
      }
      return acc;
    }, {});
  }
  return node;
}

function setTo(dst, src) {
  const keysPendingDelete = new Set(Object.keys(dst));
  Object.keys(src).forEach(key => {
    dst[key] = src[key];
    keysPendingDelete.delete(key);
  });
  keysPendingDelete.forEach(key => {
    delete dst[key];
  });
  return dst;
}

function collectAllNodes(node, predicate, output) {
  output = output || [];
  if (_.isObjectLike(node)) {
    if (predicate(node)) {
      output.push(node);
    }
    _.forEach(node, child => collectAllNodes(child, predicate, output));
  }
  return output;
}

module.exports = {omit, collectAllNodes, setTo};
