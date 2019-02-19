const plugin = require('./index');
const prettier = require('prettier');
const fs = require('fs');
const {resolve} = require('path');
const babel = require('babel-core');

const formatCode = code =>
  prettier
    .format(code, {parser: 'babylon'})
    .trim()
    .replace(/\n+/g, '\n');

it('compiles carmi files to a module that exposes a function', () => {
  const testFile = resolve(__dirname, 'test.carmi.js');
  const original = fs.readFileSync(testFile);
  const {code} = babel.transform(original, {
    plugins: [plugin],
    filename: testFile
  });
  const fnLib = {sum: arr => arr.reduce((a, b) => a + b)};

  // Test simple model
  const modelBuilder = eval(code);
  const model = modelBuilder([1, 2, 3], fnLib);
  expect(model.first).toBe(1);
  expect(model.sum).toBe(6);
});

it('doesn\'t compile non-carmi files', () => {
  const original = `
    const {root} = require('carmi')
    module.exports = {first: root.get(0)}
  `;
  const {code} = babel.transform(original, {
    plugins: [plugin],
    filename: __filename
  });

  expect(formatCode(code)).toEqual(formatCode(original));
});

it('idempotent', () => {
  const testFile = resolve(__dirname, 'test.carmi.js');
  const original = fs.readFileSync(testFile);
  const {code} = babel.transform(original, {
    plugins: [plugin],
    filename: testFile
  });

  const compiledTestFile = resolve(__dirname, 'test.compiled.carmi.js');
  fs.writeFileSync(compiledTestFile, code, 'utf-8');

  const {code: code2} = babel.transform(code, {
    plugins: [plugin],
    filename: compiledTestFile
  });

  expect(formatCode(code2)).toEqual(formatCode(code));
});

it('adds require statements for dependencies', () => {
  jest.mock('./compileFile', () => () => '() => \'carmi result!\'');
  jest.resetModules();
  const plugin = require('./index');
  const original = `
    // @carmi
    const {root} = require('carmi')
    const {resolve} = require('path')
    const _ = require('lodash')
    module.exports = {first: root.get(0)}
  `;
  const {code} = babel.transform(original, {
    plugins: [plugin],
    filename: resolve(__dirname, 'test.carmi.js')
  });

  const requireArgumentRegex = /require\('([^']+)'\)/;
  const requiresRegex = RegExp(requireArgumentRegex, 'g');
  const dependencies = new Set(
    code.match(requiresRegex).map(e => e.match(requireArgumentRegex)[1])
  );
  expect(dependencies).toEqual(new Set(['path', 'lodash']));
});

it('skips files without carmi declaration comment', () => {
  jest.resetModules();
  const plugin = require('./index');
  const original = `
    const {root} = require('carmi')
    const {resolve} = require('path')
    const _ = require('lodash')
    module.exports = {first: root.get(0)}
  `;
  const {code} = babel.transform(original, {
    plugins: [plugin],
    filename: resolve(__dirname, 'test.carmi.js')
  });
  expect(formatCode(code)).toEqual(formatCode(original));
});
