const { compile, and, or, root, arg0, arg1, setter, splice, withName } = require('../../index');
const {
  describeCompilers,
  currentValues,
  funcLibrary,
  expectTapFunctionToHaveBeenCalled,
  rand
} = require('../test-utils');
const _ = require('lodash');

describe('testing array', () => {
  describeCompilers(['simple', 'optimizing'], compiler => {
    it('withName', async () => {
      const negated = withName('negated', root.map(val => val.not()));
      const model = { doubleNegated: negated.map(val => val.not().call('tap')), set: setter(arg0) };
      const optCode = eval(await compile(model, { compiler }));
      const inst = optCode([true, 1, 0, false, null], funcLibrary);
      expect(inst.doubleNegated).toEqual([true, true, false, false, false]);
      expectTapFunctionToHaveBeenCalled(inst.$model.length, compiler);
      inst.set(1, null);
      const nameGiven = Object.keys(inst).find(k => k.indexOf('negated') !== -1);
      expect(nameGiven).toContain('negated');
      expect(inst.doubleNegated).toEqual([true, false, false, false, false]);
      expectTapFunctionToHaveBeenCalled(1, compiler);
    });
  });
});
