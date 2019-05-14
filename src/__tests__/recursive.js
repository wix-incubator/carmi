const {compile, and, or, root, arg0, setter, splice} = require('../../index');
const {
  describeCompilers,
  evalOrLoad,
  currentValues,
  funcLibrary,
  expectTapFunctionToHaveBeenCalled,
  rand
} = require('../test-utils');
const _ = require('lodash');

describe('testing recursion', () => {
  describeCompilers(['simple', 'optimizing'], compiler => {
    it('simple sum', () => {
      const model = {
        sum: root.recursiveMap((loop, val, key) =>
          key
            .gt(0)
            .ternary(val.plus(key.minus(1).recur(loop)), val)
            .call('tap', key)
        ),
        set: setter(arg0)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const inst = optModel([1, 2, 3, 4, 5], funcLibrary);
      expectTapFunctionToHaveBeenCalled(5, compiler);
      expect(inst.sum).toEqual([1, 3, 6, 10, 15]);
      inst.set(2, 13);
      expectTapFunctionToHaveBeenCalled(3, compiler);
      expect(inst.sum).toEqual([1, 3, 16, 20, 25]);
    });
    it('chains', () => {
      const model = {
        chain: root.recursiveMap((loop, val, key) =>
          val
            .gte(0)
            .ternary(val.recur(loop), val)
            .call('tap', key)
        ),
        set: setter(arg0)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = [1, 2, 3, -1, -2, 4];
      const inst = optModel(initialData, funcLibrary);
      expect(inst.chain).toEqual([-1, -1, -1, -1, -2, -2]);
      expectTapFunctionToHaveBeenCalled(6, compiler);
      inst.set(2, 5);
      expectTapFunctionToHaveBeenCalled(3, compiler);
      expect(inst.chain).toEqual([-2, -2, -2, -1, -2, -2]);
    });
    it('recursiveMapValues', () => {
      const model = {
        allDone: root.recursiveMapValues((loop, todo, idx) =>
          and(
            todo.get('done'),
            todo
              .get('subTasks')
              .any((idx, _, context) => idx.recur(context).not(), loop) //eslint-disable-line no-shadow
              .not()
          ).call('tap')
        ),
        setDone: setter(arg0, 'done'),
        spliceBlockedBy: splice(arg0, 'subTasks')
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = {
        a: {done: true, subTasks: []},
        b: {done: false, subTasks: ['c']},
        c: {done: false, subTasks: ['d']},
        d: {done: true, subTasks: []},
        e: {done: false, subTasks: ['a', 'c']}
      };
      const inst = optModel(initialData, funcLibrary);
      expect(inst.allDone).toEqual({a: true, b: false, c: false, d: true, e: false});
      inst.setDone('c', true);
      expect(inst.allDone).toEqual({a: true, b: false, c: true, d: true, e: false});
      inst.setDone('d', false);
      expect(inst.allDone).toEqual({a: true, b: false, c: false, d: false, e: false});
    });
    it('join', () => {
      const initialData = ['a', 'b', 'c'];
      const model = {
        result: root.join('~')
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const inst = optModel(initialData);
      expect(inst.result).toEqual('a~b~c');
    });
    it('join with empty array', () => {
      const initialData = [];
      const model = {
        result: root.join('~')
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const inst = optModel(initialData);
      expect(inst.result).toEqual('');
    });
    it('reduce', () => {
      const model = {
        result: root.reduce((agg, value) => agg.plus(value).call('tap'), 0),
        set: setter(arg0)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = [1, 3, 5];
      const inst = optModel(initialData, funcLibrary);
      expect(inst.result).toEqual(9);
      expectTapFunctionToHaveBeenCalled(3, compiler);
      inst.set(2, 1);
      expect(inst.result).toEqual(5);
      expectTapFunctionToHaveBeenCalled(1, compiler);
    });
    it('reduce with empty array', () => {
      const model = {
        result: root.reduce((agg, value) => agg.plus(value).call('tap'), 0),
        set: setter(arg0)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = [];
      const inst = optModel(initialData, funcLibrary);
      expect(inst.result).toEqual(0);
    });
  });
});
