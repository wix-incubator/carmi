const { compile, and, or, root, arg0, arg1, setter, splice, bind, chain } = require('../../index');
const {
  describeCompilers,
  currentValues,
  funcLibrary,
  expectTapFunctionToHaveBeenCalled,
  rand
} = require('../test-utils');
const _ = require('lodash');

describe('testing string functions', () => {
  describeCompilers(['simple', 'optimizing'], compiler => {
    function testStringFunction(str, func, args, expected) {
        it(`string function: ${func}`, async() => {
            const model = { transform: root.map(val => val[func](...args).call('tap')) };
            const optCode = eval(await compile(model, { compiler }));
            const inst = optCode([str], funcLibrary);
            expect(inst.transform[0]).toEqual(expected);
            expectTapFunctionToHaveBeenCalled(inst.$model.length, compiler);
        })
    }

    it('startsWith', async () => {
      const model = { withWith: root.filter(val => val.startsWith('with-').call('tap')), set: setter(arg0) };
      const optCode = eval(await compile(model, { compiler }));
      const inst = optCode(['garbage', 'with-prefix', 'with-something', 'nothing'], funcLibrary);
      expect(inst.withWith).toEqual(['with-prefix', 'with-something']);
      expectTapFunctionToHaveBeenCalled(inst.$model.length, compiler);
      inst.set(0, 'with-good-stuff');
      expect(inst.withWith).toEqual(['with-good-stuff', 'with-prefix', 'with-something']);
      expectTapFunctionToHaveBeenCalled(1, compiler);
    });
    testStringFunction('abc', 'endsWith', ['c'], true)
    testStringFunction('abcde', 'substring', [1, 3], 'bc')
    testStringFunction('abcde', 'toUpperCase', [], 'ABCDE')
    testStringFunction('abcDE', 'toLowerCase', [], 'abcde')

    describe('String.split', () => {
      testStringFunction('ab/cd/e', 'split', ['/'], ['ab','cd','e'])
      testStringFunction('ab', 'split', ['/'], ['ab'])
      //String.split(RegExp) does not work yet:
      //testStringFunction('abfoobar', 'split', [/foo/], ['ab', 'bar'])
    })
  })
})
