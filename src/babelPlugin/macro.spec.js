const pluginTester = require("babel-plugin-tester");
const plugin = require("babel-plugin-macros");
const path = require("path");
const babel = require("babel-core");

pluginTester({
  plugin,
  snapshot: true,
  babelOptions: { filename: path.resolve(__dirname, "temp.js") },
  tests: [
    `
      const carmi = require('./macro')

      const modelBuilder = carmi\`
        const {root} = require('../..')
        module.exports = {all: root.get('list'), first: root.get('list').get(0)}
      \`
    `
  ]
});

describe("Macro", () => {
  it("works", () => {
    const code = `
      const carmi = require('./macro')

      global.modelBuilder = carmi\`
        const {root} = require('../..')
        module.exports = {all: root.get('list'), first: root.get('list').get(0)}
      \`
    `;

    const transformedCode = babel.transform(code, {
      filename: __filename,
      plugins: [plugin]
    });

    // eval the script
    eval(transformedCode.code);

    const model = global.modelBuilder({ list: [1, 2, 3] });
    expect(model.first).toBe(1);
  });
});
