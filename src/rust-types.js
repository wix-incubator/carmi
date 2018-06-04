const _ = require('lodash');
const objectHash = require('object-hash');
const flowTypes = require('./flow-types');

const shouldOmit = {
  optional: true,
  variance: true,
  exact: true,
  static: true
};
const { omit, collectAllNodes, setTo } = require('./annotation-utils');

function flowAnnotationToRustType(annotation) {
  const fail = () => {
    throw new Error(`unknown annotation ${JSON.stringify(annotation, null, 2)}`);
  };
  switch (annotation.type) {
    case 'NullableTypeAnnotation':
      return `Option<${annotation.typeAnnotation}>`;
    case 'BooleanTypeAnnotation':
      return 'bool';
    case 'StringTypeAnnotation':
      return 'str';
    case 'NumberTypeAnnotation':
      return 'f64';
    case 'UnionTypeAnnotation':
      return `enum ${annotation.name} {
            ${annotation.types
              .map((type, index) => {
                const name = _.upperFirst(_.get(type, 'name.id', 'e' + index));
                return `${name}(${flowAnnotationToRustType(type)})`;
              })
              .join('\n')}
        }`;
    case 'GenericTypeAnnotation':
      return annotation.id.name;
    case 'ObjectTypeProperty':
      return `${annotation.key.name}: ${flowAnnotationToRustType(annotation.value)},`;
    case 'ObjectTypeAnnotation':
      if (annotation.indexers.length === 0) {
        return `struct ${annotation.name} {
            ${annotation.properties.map(flowAnnotationToRustType).join('\n')}
        }`;
      } else if (annotation.indexers.length === 1) {
        return `HashMap<${flowAnnotationToRustType(annotation.indexers[0].key)},${flowAnnotationToRustType(
          annotation.indexers[0].value
        )}>`;
      }
      fail();
    default:
      fail();
  }
}

function sortUnionsAndProperties(source) {
  collectAllNodes(source, node => node.type === 'UnionTypeAnnotation').forEach(node =>
    setTo(node, Object.assign({}, node, { types: _.sortBy(node.types, objectHash) }))
  );
  collectAllNodes(source, node => node.type === 'ObjectTypeAnnotation').forEach(node =>
    setTo(node, Object.assign({}, node, { properties: _.sortBy(node.properties, objectHash) }))
  );
}

function replaceTypeRefsWithFull(source, types) {
  const nodesWithTypes = collectAllNodes(
    source,
    node => node.type === 'GenericTypeAnnotation' && node.id.type === 'Identifier' && types[node.id.name]
  ).forEach(node => {
    setTo(node, _.cloneDeep(types[node.id.name]));
  });
}

function replaceFullWithTypeRefs(source, types) {
  console.log(types);
  const hashToTypes = _(types)
    .mapValues(type => objectHash(type))
    .invert()
    .value();
  console.log(hashToTypes);
  let cnt = 0;
  const allNodesWithTypes = collectAllNodes(source, node => {
    cnt++;
    const res = node.type === 'UnionTypeAnnotation' || node.type === 'ObjectTypeAnnotation';
    return res;
  });

  const allNodesHashed = allNodesWithTypes.map(node => objectHash(node));
  console.log(
    'allNodesWithTypes',
    allNodesWithTypes.length,
    'tested',
    cnt,
    '\n',
    JSON.stringify(allNodesWithTypes, null, 2)
  );
  allNodesWithTypes.forEach((node, idx) => {
    const hash = allNodesHashed[idx];
    if (!hashToTypes[hash]) {
      const typeName = `Type${hash}`;
      hashToTypes[hash] = `Type${hash}`;
      console.log('new type', typeName, hash, node);
      types[typeName] = node;
    }
  });
  allNodesWithTypes.forEach((node, idx) => {
    const hash = allNodesHashed[idx];
    if (node !== types[hashToTypes[hash]]) {
      console.log('reuse type', hashToTypes[hash]);
      setTo(node, {
        type: 'GenericTypeAnnotation',
        typeParameters: null,
        id: { type: 'Identifier', name: hashToTypes[hash] }
      });
    }
  });
}

function extractAllTypeDeclerations(annotations) {
  const { types, expr } = annotations;

  // console.log(JSON.stringify({ types, expr }, null, 2));
  console.log(Object.keys(types));
  // inflate all types and expressions
  replaceTypeRefsWithFull([types, expr], types);
  // sort enums and properties
  sortUnionsAndProperties([types, expr]);
  // go back to types
  replaceFullWithTypeRefs([types, expr], types);
  console.log(Object.keys(types));

  require('fs').writeFileSync('tmp.json', JSON.stringify({ types, expr }, null, 2));
  return { types, expr };
}

module.exports = { flowAnnotationToRustType, extractAllTypeDeclerations };
