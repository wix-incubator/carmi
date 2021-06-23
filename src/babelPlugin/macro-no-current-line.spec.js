const pluginTester = require('babel-plugin-tester');
const plugin = require('babel-plugin-macros');
const path = require('path');
const babel = require('babel-core');

jest.mock('../../babel-plugin-macros.config.js', () => ({carmi: {disableCurrentLineFunctionName: true}}))

pluginTester({
  plugin,
  snapshot: true,
  babelOptions: {
    filename: path.resolve(__dirname, 'temp.js'),
    presets: ['react']
  },
  tests: {
    'template-literal': `
      const carmi = require('./macro')

      const modelBuilder = carmi\`
        const {root} = require('../..')
        module.exports = {all: root.get('list'), first: root.get('list').get(0)}
      \`
    `,
    'magic-comment': `
  // @carmi
  import carmi from './macro'
  const { root } = require('../../index');
  module.exports = { first: root.get(0), second: root.get(1) };
`,
    'carmi-react': `
    // @carmi
    import carmi from './macro'
    const { root } = require('../../index');
    const {createElement} = require('../../jsx');
    const todosList = <div>{root.get(0)}</div>;
    module.exports = {todosList};
`
  }
});

describe('Macro with disableCurrentLineFunctionName option', () => {
  it('works with disableCurrentLineFunctionName mode', done => {
    const code = `
      const carmi = require('./macro')

      const modelBuilder = carmi\`
        const {root} = require('../..')
        module.exports = {all: root.get('list'), first: root.get('list').get(0)}
      \`

      const model = modelBuilder({ list: [1,2,3] })
      global.onModel(model)
    `;

    const transformedCode = babel.transform(code, {
      filename: __filename,
      plugins: [plugin]
    });

    global.onModel = model => {
      expect(model.all).toEqual([1, 2, 3]);
      expect(model.first).toBe(1);
      done();
    };

    // eval the script
    eval(transformedCode.code);
  });
});