const { createMacro, MacroError } = require("babel-plugin-macros");
const compileFile = require("./compileFile");
const fs = require("fs");
const babylon = require("babylon");

module.exports = createMacro(macro);

const extractNodeFromCarmiCode = code =>
  babylon.parse(code).program.body[0].expression;

function macro({ babel, references }) {
  (references.default || []).forEach(referencePath => {
    if (referencePath.parentPath.type === "TaggedTemplateExpression") {
      const filename = referencePath.context.scope.hub.file.opts.filename;
      const newFilename = `${filename}.temp.carmi.js`;
      const code = referencePath.parentPath.get("quasi").evaluate().value;
      fs.writeFileSync(newFilename, code, "utf-8");
      const transformed = compileFile(newFilename);
      fs.unlink(newFilename, () => {});
      const node = extractNodeFromCarmiCode(transformed);
      node.callee = babel.types.sequenceExpression([node.callee]);
      referencePath.parentPath.replaceWith(node);
    } else {
      throw MacroError("Please use Carmi as tagged template literal");
    }
  });
}
