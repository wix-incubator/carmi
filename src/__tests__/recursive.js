const { currentValues, compile, and, or, context, root, val, loop, key, arg0, Setter, Splice } = require('../../index');
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

  it('simple sum', () => {
    const model = {
      sum: root.recursiveMap((val, key, context, loop) =>
        key
          .gt(0)
          .ternary(val.plus(key.minus(1).recur(loop)), val)
          .call('tap', key)
      ),
      set: Setter(arg0)
    };
    const optModel = eval(compile(model));
    const inst = optModel([1, 2, 3, 4, 5], funcLibrary);
    expectTapFunctionToHaveBeenCalled(5);
    expect(inst.sum).toEqual([1, 3, 6, 10, 15]);
    inst.set(2, 13);
    expectTapFunctionToHaveBeenCalled(3);
    expect(inst.sum).toEqual([1, 3, 16, 20, 25]);
  });
  it('chains', () => {
    const model = {
      chain: root.recursiveMap((val, key) =>
        val
          .gte(0)
          .ternary(val.recur(loop), val)
          .call('tap', key)
      ),
      set: Setter(arg0)
    };
    const optModel = eval(compile(model));
    const initialData = [1, 2, 3, -1, -2, 4];
    const inst = optModel(initialData, funcLibrary);
    expect(inst.chain).toEqual([-1, -1, -1, -1, -2, -2]);
    expectTapFunctionToHaveBeenCalled(6);
    inst.set(2, 5);
    expectTapFunctionToHaveBeenCalled(3);
    expect(inst.chain).toEqual([-2, -2, -2, -1, -2, -2]);
  });
});
