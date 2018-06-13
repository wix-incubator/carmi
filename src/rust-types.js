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

function rustTypeBorrows(annotation) {
  switch (annotation.type) {
    case 'GenericTypeAnnotation':
    case 'ObjectTypeAnnotation':
    case 'UnionTypeAnnotation':
      return true;
    default:
      return false;
  }
}

function isHashMap(annotation) {
  return annotation.type === 'ObjectTypeAnnotation' && annotation.indexers.length === 1;
}

function isStruct(annotation) {
  return annotation.type === 'ObjectTypeAnnotation' && annotation.indexers.length === 0;
}

function flowAnnotationToRustType(annotation) {
  const fail = () => {
    throw new Error(`unknown annotation ${JSON.stringify(annotation, null, 2)}`);
  };
  switch (annotation.type) {
    case 'NullableTypeAnnotation':
      return `Option<${flowAnnotationToRustType(annotation.typeAnnotation)}>`;
    case 'VoidTypeAnnotation':
      return '()';
    case 'BooleanTypeAnnotation':
      return 'bool';
    case 'StringTypeAnnotation':
      return 'StringSymbol';
    case 'NumberTypeAnnotation':
      return 'f64';
    case 'NullLiteralTypeAnnotation':
      return 'Option<f64>';
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
      return `#[serde(deserialize_state)]
${annotation.key.name}: ${flowAnnotationToRustType(annotation.value)},`;
    case 'ObjectTypeAnnotation':
      if (annotation.indexers.length === 0) {
        return `
#[derive(Debug, DeserializeState, Default)]
#[serde(de_parameters = "S")]
#[serde(bound(deserialize = "S: ToSymbol"))]
#[serde(deserialize_state = "S")]
struct ${annotation.name} {
${annotation.properties.map(t => flowAnnotationToRustType(t)).join('\n')}
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

function sortUnionsAndProperties({ expr, types }) {
  collectAllNodes({ expr, types }, node => node.type === 'UnionTypeAnnotation').forEach(node =>
    setTo(node, Object.assign({}, node, { types: _.sortBy(node.types, objectHash) }))
  );
  collectAllNodes({ expr, types }, node => node.type === 'ObjectTypeAnnotation').forEach(node =>
    setTo(node, Object.assign({}, node, { properties: _.sortBy(node.properties, objectHash) }))
  );
  return { expr, types };
}

function replaceTypeRefsWithFull({ expr, types }) {
  collectAllNodes(
    { expr, types },
    node => node.type === 'GenericTypeAnnotation' && node.id.type === 'Identifier' && types[node.id.name]
  ).forEach(node => {
    setTo(node, _.cloneDeep(types[node.id.name]));
  });
  return { expr, types };
}

function replaceFullWithTypeRefs({ expr, types }) {
  const hashToTypes = _(types)
    .mapValues(type => objectHash(type))
    .invert()
    .value();
  let cnt = 0;
  const allNodesWithTypes = collectAllNodes(
    { expr, types },
    node => node.type === 'UnionTypeAnnotation' || (node.type === 'ObjectTypeAnnotation' && node.indexers.length === 0)
  );

  const allNodesHashed = allNodesWithTypes.map(node => objectHash(node));

  allNodesWithTypes.forEach((node, idx) => {
    const hash = allNodesHashed[idx];
    if (!hashToTypes[hash]) {
      const typeName = `Type${hash}`;
      hashToTypes[hash] = `Type${hash}`;
      types[typeName] = node;
    }
  });
  allNodesWithTypes.forEach((node, idx) => {
    const hash = allNodesHashed[idx];
    if (node !== types[hashToTypes[hash]]) {
      setTo(node, {
        type: 'GenericTypeAnnotation',
        typeParameters: null,
        id: { type: 'Identifier', name: hashToTypes[hash] }
      });
    }
  });
  _.forEach(types, (type, name) => (type.name = name));
  return { expr, types };
}

const extractionPipeline = [replaceTypeRefsWithFull, sortUnionsAndProperties, replaceFullWithTypeRefs];

function extractAllTypeDeclerations(annotations) {
  for (let i = 0; i < extractionPipeline.length; i++) {
    annotations = extractionPipeline[i](_.cloneDeep(annotations));
  }
  require('fs').writeFileSync('tmp.json', JSON.stringify(annotations, null, 2));
  return annotations;
}

module.exports = { flowAnnotationToRustType, extractAllTypeDeclerations, rustTypeBorrows, isHashMap, isStruct };
