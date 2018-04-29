const { currentValues, compile, and, or, context, root, val, key, arg0, Setter } = require('../../index');
const _ = require('lodash');
const rand = require('random-seed').create();
const defaultSeed = 'CARMI';

describe('testing array', () => {
  const funcLibrary = {
    tap: x => x
  };

  beforeEach(() => {
    rand.seed(defaultSeed);
    jest.spyOn(funcLibrary, 'tap');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('simple map', () => {
    const model = { negated: root.map(val.not().call('tap')), set: Setter(arg0) };
    const optCode = eval(compile(model));
    const inst = optCode([true, true, false, false, false], funcLibrary);
    expect(inst.negated).toEqual([false, false, true, true, true]);
    inst.set(1, false);
    expect(inst.negated).toEqual([false, true, true, true, true]);
    expect(funcLibrary.tap.mock.calls.length).toEqual(inst.$model.length + 1);
  });
  it('simple any', () => {
    const model = {
      anyTruthy: root.any(val.call('tap')),
      set: Setter(arg0)
    };
    const optModel = eval(compile(model));
    const inst = optModel([true, false, false, false, false], funcLibrary);
    expect(funcLibrary.tap.mock.calls.length).toEqual(1);
    expect(inst.anyTruthy).toEqual(true);
    inst.set(0, false);
    expect(funcLibrary.tap.mock.calls.length).toEqual(inst.$model.length + 1);
    expect(inst.anyTruthy).toEqual(false);
    inst.set(3, true);
    expect(funcLibrary.tap.mock.calls.length).toEqual(inst.$model.length + 2);
    expect(inst.anyTruthy).toEqual(true);
    inst.set(4, true);
    expect(funcLibrary.tap.mock.calls.length).toEqual(inst.$model.length + 2);
    expect(inst.anyTruthy).toEqual(true);
    inst.set(3, false);
    expect(funcLibrary.tap.mock.calls.length).toEqual(inst.$model.length + 4);
    expect(inst.anyTruthy).toEqual(true);
    inst.set(4, false);
    expect(funcLibrary.tap.mock.calls.length).toEqual(inst.$model.length + 5);
    expect(inst.anyTruthy).toEqual(false);
  });
});
