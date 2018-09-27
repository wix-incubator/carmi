const { createMacro, MacroError } = require('babel-plugin-macros');
const compileFile = require('./compileFile');
const fs = require('fs');
const babylon = require('babylon');
const generate = require('babel-generator');

const path = require('path');
const uuid = require('uuid');

module.exports = createMacro(macro);

const extractNodeFromCarmiCode = code => babylon.parse(code).program.body[0].expression;

const wrapWithModuleExports = node => {
  return {
    type: 'ExpressionStatement',
    expression: {
      type: 'AssignmentExpression',
      operator: '=',
      left: {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'module' },
        property: { type: 'Identifier', name: 'exports' },
        computed: false
      },
      right: node
    }
  };
};

const compile = (code, filename, isMJS = false) => {
  const newFilename = path.resolve(
    filename,
    '..',
    `.${path.basename(filename)}.${uuid()}.carmi${isMJS ? '.mjs' : '.js'}`
  );
  console.log({ newFilename });
  fs.writeFileSync(newFilename, code, 'utf-8');
  const transformed = compileFile(newFilename);
  fs.unlink(newFilename, () => {});
  return transformed;
};

const CARMI_COMMENT_RE = /\s*\@carmi\s*/;

function macro({ babel, state, references, source, config }) {
  const commentTag = state.file.ast.comments.some(comment => CARMI_COMMENT_RE.test(comment.value));
  references = references.default || [];
  if (commentTag && references.length === 0) {
    const filename = state.file.opts.filename;
    const body = state.file.ast.program.body;
    const importIdx = body.find(node => node.type === 'ImportDeclaration' && node.value === source);
    body.splice(importIdx, 1);
    const isMJS = body.some(node => node.type === 'ExportDefaultDeclaration');
    const code = generate.default(state.file.ast).code;
    const transformed = compile(code, filename, isMJS);
    const node = extractNodeFromCarmiCode(transformed);
    body.splice(0, body.length, wrapWithModuleExports(node));
    return { keepImports: true };
  } else if (references.length) {
    references.forEach(referencePath => {
      if (referencePath.parentPath.type === 'TaggedTemplateExpression') {
        const filename = referencePath.context.scope.hub.file.opts.filename;
        const code = referencePath.parentPath.get('quasi').evaluate().value;
        const transformed = compile(code, filename);
        const node = extractNodeFromCarmiCode(transformed);
        node.callee = babel.types.sequenceExpression([node.callee]);
        referencePath.parentPath.replaceWith(node);
      }
    });
  } else {
    throw new MacroError('Please use Carmi as tagged template literals or as a comment tag on the entire file');
  }
}
