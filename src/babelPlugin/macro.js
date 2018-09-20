const { createMacro, MacroError } = require("babel-plugin-macros");
const compileFile = require("./compileFile");
const fs = require("fs");
const babylon = require("babylon");
const path = require("path");
const uuid = require("uuid");

module.exports = createMacro(macro);

const extractNodeFromCarmiCode = code =>
  babylon.parse(code).program.body[0].expression;

const compile = (code, filename) => {
  const newFilename = path.resolve(
    filename,
    "..",
    `.${path.basename(filename)}.${uuid()}.carmi.js`
  );
  console.log({ newFilename });
  fs.writeFileSync(newFilename, code, "utf-8");
  const transformed = compileFile(newFilename);
  fs.unlink(newFilename, () => {});
  return transformed;
};

function macro({ babel, references }) {
  (references.default || []).forEach(referencePath => {
    if (referencePath.parentPath.type === "TaggedTemplateExpression") {
      const filename = referencePath.context.scope.hub.file.opts.filename;
      const code = referencePath.parentPath.get("quasi").evaluate().value;
      const transformed = compile(code, filename);
      const node = extractNodeFromCarmiCode(transformed);
      node.callee = babel.types.sequenceExpression([node.callee]);
      referencePath.parentPath.replaceWith(node);
    } else {
      throw MacroError("Please use Carmi as tagged template literal");
    }
  });
}
