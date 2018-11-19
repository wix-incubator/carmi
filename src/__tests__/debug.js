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
  describe('expect to hoist shared expressions', async () => {
    const once = root.map(val => val.call('tap'));
    const twice = root.map(val => val.call('tap')).filter(val => val);
    const model = {once, twice, set: setter(arg0) };
    const optCode = eval(await compile(model, { compiler }));
    const inst = optCode([false, 1, 0], funcLibrary);
    expect(inst.once).toEqual([false, 1, 0]);
    expect(inst.twice).toEqual([1]);
    expectTapFunctionToHaveBeenCalled(inst.$model.length, compiler);
    inst.set(2, true);
    expect(inst.once).toEqual([false, 1, true]);
    expect(inst.twice).toEqual([1, true]);
    expectTapFunctionToHaveBeenCalled(1, compiler);
  })
  describe('throw on invalids reuse of key/val/loop/context inside other functions', () => {
    expect(() => {
      root.map(item => item.map(child => child.eq(item)))
    }).toThrowError();
    expect(() => {
      root.map((item,val) => item.map(child => child.eq(val)))
    }).toThrowError();
    expect(() => {
      root.map((item,val,context) => item.map(child => child.eq(context)), root.get(1))
    }).toThrowError();
  })
});
