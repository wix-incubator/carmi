const { compile, and, or, context, root, val, loop, key, arg0, Setter, Splice } = require('../../index');
const { currentValues, funcLibrary, expectTapFunctionToHaveBeenCalled, rand } = require('../test-utils');
const _ = require('lodash');

describe('testing array', () => {
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
  it('recursiveMapValues', () => {
    const model = {
      allDone: root.recursiveMapValues(todo =>
        and(
          todo.get('done'),
          todo
            .get('subTasks')
            .any((idx, _, context) => idx.recur(context).not(), loop)
            .not()
        ).call('tap')
      ),
      setDone: Setter(arg0, 'done'),
      spliceBlockedBy: Splice(arg0, 'subTasks')
    };
    const optModel = eval(compile(model));
    const initialData = {
      a: { done: true, subTasks: [] },
      b: { done: false, subTasks: ['c'] },
      c: { done: false, subTasks: ['d'] },
      d: { done: true, subTasks: [] },
      e: { done: false, subTasks: ['a', 'c'] }
    };
    const inst = optModel(initialData, funcLibrary);
    expect(inst.allDone).toEqual({ a: true, b: false, c: false, d: true, e: false });
    inst.setDone('c', true);
    expect(inst.allDone).toEqual({ a: true, b: false, c: true, d: true, e: false });
    inst.setDone('d', false);
    expect(inst.allDone).toEqual({ a: true, b: false, c: false, d: false, e: false });
  });
});
