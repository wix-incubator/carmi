const { currentValues, compile, and, or, context, root, val, key, arg0, Setter, Splice } = require('../../index');
const _ = require('lodash');
const rand = require('random-seed').create();
const defaultSeed = 'CARMI';

describe('testing array', () => {
  const funcLibrary = {
    tap: x => x
  };

  function expectTapFunctionToHaveBeenCalled(n) {
    expect(funcLibrary.tap.mock.calls.length).toEqual(n);
    funcLibrary.tap.mockClear();
  }

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
    expectTapFunctionToHaveBeenCalled(inst.$model.length);
    inst.set(1, false);
    expect(inst.negated).toEqual([false, true, true, true, true]);
    expectTapFunctionToHaveBeenCalled(1);
  });
  it('simple any', () => {
    const model = {
      anyTruthy: root.any(val.call('tap')),
      set: Setter(arg0)
    };
    const optModel = eval(compile(model));
    const inst = optModel([true, false, false, false, false], funcLibrary);
    expectTapFunctionToHaveBeenCalled(1);
    expect(inst.anyTruthy).toEqual(true);
    inst.set(0, false);
    expectTapFunctionToHaveBeenCalled(inst.$model.length);
    expect(inst.anyTruthy).toEqual(false);
    inst.set(3, true);
    expectTapFunctionToHaveBeenCalled(1);
    expect(inst.anyTruthy).toEqual(true);
    inst.set(4, true);
    expectTapFunctionToHaveBeenCalled(0);
    expect(inst.anyTruthy).toEqual(true);
    inst.set(3, false);
    expectTapFunctionToHaveBeenCalled(2);
    expect(inst.anyTruthy).toEqual(true);
    inst.set(4, false);
    expectTapFunctionToHaveBeenCalled(1);
    expect(inst.anyTruthy).toEqual(false);
  });
  it('simple keyBy', () => {
    const model = {
      itemByIdx: root.keyBy(val.get('idx')).mapValues(val.get('text').call('tap')),
      set: Setter(arg0),
      splice: Splice()
    };
    const optModel = eval(compile(model));
    const inst = optModel([{ idx: 1, text: 'a' }, { idx: 2, text: 'b' }, { idx: 3, text: 'c' }], funcLibrary);
    expectTapFunctionToHaveBeenCalled(3);
    expect(inst.itemByIdx).toEqual({ 1: 'a', 2: 'b', 3: 'c' });
    inst.set(0, { idx: 4, text: 'd' });
    expectTapFunctionToHaveBeenCalled(1);
    expect(inst.itemByIdx).toEqual({ 4: 'd', 2: 'b', 3: 'c' });
    inst.splice(1, 2, { idx: 3, text: 'e' });
    expect(inst.itemByIdx).toEqual({ 4: 'd', 3: 'e' });
    expectTapFunctionToHaveBeenCalled(1);
    const reverseArray = [...inst.$model].reverse();
    inst.splice(0, inst.$model.length, ...reverseArray);
    expect(inst.itemByIdx).toEqual({ 4: 'd', 3: 'e' });
    expectTapFunctionToHaveBeenCalled(0);
  });
});
