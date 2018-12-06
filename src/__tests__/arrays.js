const { compile, and, or, root, arg0, arg1, setter, splice, bind, chain } = require('../../index');
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
    it('simple map', async () => {
      const model = { negated: root.map(val => val.not().call('tap')), set: setter(arg0) };
      const optCode = eval(await compile(model, { compiler }));
      const inst = optCode([true, true, false, false, false], funcLibrary);
      expect(inst.negated).toEqual([false, false, true, true, true]);
      expectTapFunctionToHaveBeenCalled(inst.$model.length, compiler);
      inst.set(1, false);
      expect(inst.negated).toEqual([false, true, true, true, true]);
      expectTapFunctionToHaveBeenCalled(1, compiler);
    });
    it('map return empty object if falsy', async () => {
      const model = { orEmpty: root.map(val => or(val, {}).call('tap')), set: setter(arg0) };
      const optCode = eval(await compile(model, { compiler }));
      const inst = optCode([{ x: 1 }, false, { x: 2 }], funcLibrary);
      expect(inst.orEmpty).toEqual([{ x: 1 }, {}, { x: 2 }]);
      expectTapFunctionToHaveBeenCalled(inst.$model.length, compiler);
      inst.set(2, false);
      expect(inst.orEmpty).toEqual([{ x: 1 }, {}, {}]);
      expectTapFunctionToHaveBeenCalled(1, compiler);
    });
    it('map return empty object if falsy', async () => {
      const model = { orEmpty: root.map(val => or(val, []).call('tap')), set: setter(arg0) };
      const optCode = eval(await compile(model, { compiler }));
      const inst = optCode([[1], false, [2]], funcLibrary);
      expect(inst.orEmpty).toEqual([[1], [], [2]]);
      expectTapFunctionToHaveBeenCalled(inst.$model.length, compiler);
      inst.set(2, false);
      expect(inst.orEmpty).toEqual([[1], [], []]);
      expectTapFunctionToHaveBeenCalled(1, compiler);
    });
    it('simple any', async () => {
      const model = {
        anyTruthy: root.any(val => val.call('tap')),
        set: setter(arg0)
      };
      const optModel = eval(await compile(model, { compiler }));
      const inst = optModel([true, false, false, false, false], funcLibrary);
      expectTapFunctionToHaveBeenCalled(1, compiler);
      expect(inst.anyTruthy).toEqual(true);
      inst.set(0, false);
      expectTapFunctionToHaveBeenCalled(inst.$model.length, compiler);
      expect(inst.anyTruthy).toEqual(false);
      inst.set(3, true);
      expectTapFunctionToHaveBeenCalled(1, compiler);
      expect(inst.anyTruthy).toEqual(true);
      inst.set(4, true);
      expectTapFunctionToHaveBeenCalled(0, compiler);
      expect(inst.anyTruthy).toEqual(true);
      inst.set(3, false);
      expectTapFunctionToHaveBeenCalled(2, compiler);
      expect(inst.anyTruthy).toEqual(true);
      inst.set(4, false);
      expectTapFunctionToHaveBeenCalled(1, compiler);
      expect(inst.anyTruthy).toEqual(false);
    });
    it('simple keyBy', async () => {
      const model = {
        itemByIdx: root.keyBy(val => val.get('idx')).mapValues(val => val.get('text').call('tap')),
        set: setter(arg0),
        splice: splice()
      };
      const optModel = eval(await compile(model, { compiler }));
      const inst = optModel([{ idx: 1, text: 'a' }, { idx: 2, text: 'b' }, { idx: 3, text: 'c' }], funcLibrary);
      expectTapFunctionToHaveBeenCalled(3, compiler);
      expect(inst.itemByIdx).toEqual({ 1: 'a', 2: 'b', 3: 'c' });
      inst.set(0, { idx: 4, text: 'd' });
      expectTapFunctionToHaveBeenCalled(1, compiler);
      expect(inst.itemByIdx).toEqual({ 4: 'd', 2: 'b', 3: 'c' });
      inst.splice(1, 2, { idx: 3, text: 'e' });
      expect(inst.itemByIdx).toEqual({ 4: 'd', 3: 'e' });
      expectTapFunctionToHaveBeenCalled(1, compiler);
      const reverseArray = [...inst.$model].reverse();
      inst.splice(0, inst.$model.length, ...reverseArray);
      expect(inst.itemByIdx).toEqual({ 4: 'd', 3: 'e' });
      expectTapFunctionToHaveBeenCalled(0, compiler);
    });
    it('simple comparison operations', async () => {
      const arr = root.get('arr');
      const compareTo = root.get('compareTo');
      const model = {
        greaterThan: arr.map(val => val.gt(compareTo).call('tap')),
        lessThan: arr.map(val => val.lt(compareTo).call('tap')),
        greaterOrEqual: arr.map(val => val.gte(compareTo).call('tap')),
        lessThanOrEqual: arr.map(val => val.lte(compareTo).call('tap')),
        setArr: setter('arr', arg0),
        setCompareTo: setter('compareTo')
      };
      const optModel = eval(await compile(model, { compiler }));
      const inst = optModel({ arr: [0, 1, 2, 3, 4], compareTo: 2 }, funcLibrary);
      expect(currentValues(inst)).toEqual({
        greaterThan: [false, false, false, true, true],
        lessThan: [true, true, false, false, false],
        greaterOrEqual: [false, false, true, true, true],
        lessThanOrEqual: [true, true, true, false, false]
      });
      expectTapFunctionToHaveBeenCalled(20, compiler);
      inst.setArr(4, 0);
      expect(currentValues(inst)).toEqual({
        greaterThan: [false, false, false, true, false],
        lessThan: [true, true, false, false, true],
        greaterOrEqual: [false, false, true, true, false],
        lessThanOrEqual: [true, true, true, false, true]
      });
      expectTapFunctionToHaveBeenCalled(4, compiler);
      inst.setCompareTo(100);
      expect(currentValues(inst)).toEqual({
        greaterThan: [false, false, false, false, false],
        lessThan: [true, true, true, true, true],
        greaterOrEqual: [false, false, false, false, false],
        lessThanOrEqual: [true, true, true, true, true]
      });
      expectTapFunctionToHaveBeenCalled(6, compiler);
    });
    it('test creation of arrays', async () => {
      const sumsTuple = root.map(item => [item.get(0).plus(item.get(1))]);
      const mapOfSum = sumsTuple.map(item => item.get(0).call('tap'));

      const model = { mapOfSum, set0: setter(arg0, 0), set1: setter(arg0, 1) };
      const optCode = eval(await compile(model, { compiler }));
      const initialData = [[1, 2], [3, 4], [5, 6]];
      const inst = optCode(initialData, funcLibrary);
      expect(inst.mapOfSum).toEqual([3, 7, 11]);
      expectTapFunctionToHaveBeenCalled(3, compiler);
      inst.set0(0, 7);
      expect(inst.mapOfSum).toEqual([9, 7, 11]);
      expectTapFunctionToHaveBeenCalled(1, compiler);
      inst.$startBatch();
      inst.set0(1, 4);
      inst.set1(1, 3);
      inst.$endBatch();
      expect(inst.mapOfSum).toEqual([9, 7, 11]);
      expectTapFunctionToHaveBeenCalled(0, compiler);
    });
    it('test assign/defaults', async () => {
      const model = {
        assign: root.assign().mapValues(val => val.call('tap')),
        defaults: root.defaults().mapValues(val => val.call('tap')),
        set: setter(arg0),
        setInner: setter(arg0, arg1),
        splice: splice()
      };
      const optCode = eval(await compile(model, { compiler }));
      const initialData = [{ a: 1 }, { b: 2 }, { a: 5 }];
      const inst = optCode(initialData, funcLibrary);
      expect(currentValues(inst)).toEqual({ assign: { a: 5, b: 2 }, defaults: { a: 1, b: 2 } });
      expectTapFunctionToHaveBeenCalled(4, compiler);
      inst.set(0, { a: 7 });
      expect(currentValues(inst)).toEqual({ assign: { a: 5, b: 2 }, defaults: { a: 7, b: 2 } });
      expectTapFunctionToHaveBeenCalled(1, compiler);
      inst.setInner(2, 'a', 9);
      expect(currentValues(inst)).toEqual({ assign: { a: 9, b: 2 }, defaults: { a: 7, b: 2 } });
      expectTapFunctionToHaveBeenCalled(1, compiler);
      inst.splice(1, 1);
      expect(currentValues(inst)).toEqual({ assign: { a: 9 }, defaults: { a: 7 } });
      expectTapFunctionToHaveBeenCalled(0, compiler);
    });
    it('ranges', async () => {
      const model = {
        range: root
          .get('end')
          .range()
          .map(item => item.call('tap')),
        rangeStart: root
          .get('end')
          .range(root.get('start'))
          .map(item => item.call('tap')),
        rangeStep: root
          .get('end')
          .range(root.get('start'), root.get('step'))
          .map(item => item.call('tap')),
        setEnd: setter('end'),
        setStep: setter('step'),
        setStart: setter('start')
      };
      const initialData = { start: 2, end: 5, step: 2 };
      const optCode = eval(await compile(model, { compiler }));
      const inst = optCode(initialData, funcLibrary);
      expect(inst.range).toEqual([0, 1, 2, 3, 4]);
      expect(inst.rangeStart).toEqual([2, 3, 4]);
      expect(inst.rangeStep).toEqual([2, 4]);
      expectTapFunctionToHaveBeenCalled(10, compiler);
      inst.setEnd(7);
      expect(inst.range).toEqual([0, 1, 2, 3, 4, 5, 6]);
      expect(inst.rangeStart).toEqual([2, 3, 4, 5, 6]);
      expect(inst.rangeStep).toEqual([2, 4, 6]);
      expectTapFunctionToHaveBeenCalled(5, compiler);
    });
    it('test range/size', async () => {
      const matches = root.get('items').filter(val => val.eq(root.get('match')));
      const model = {
        fizzBuzz: matches
          .size()
          .range(1)
          .map(val =>
            val
              .mod(15)
              .eq(0)
              .ternary(
                'fizzbuzz',
                val
                  .mod(3)
                  .eq(0)
                  .ternary(
                    'fizz',
                    val
                      .mod(5)
                      .eq(0)
                      .ternary('buzz', val)
                  )
              )
          )
          .map(val => val.call('tap')),
        spliceItems: splice('items'),
        setMatch: setter('match')
      };
      const initialData = {
        items: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 2, 2, 2, 2],
        match: 1
      };
      const optCode = eval(await compile(model, { compiler }));
      const inst = optCode(initialData, funcLibrary);
      expect(inst.fizzBuzz).toEqual([1, 2, 'fizz', 4, 'buzz']);
      inst.setMatch(0);
      expect(inst.fizzBuzz).toEqual([
        1,
        2,
        'fizz',
        4,
        'buzz',
        'fizz',
        7,
        8,
        'fizz',
        'buzz',
        11,
        'fizz',
        13,
        14,
        'fizzbuzz'
      ]);
      inst.setMatch(2);
      expect(inst.fizzBuzz).toEqual([1, 2, 'fizz']);
    });
    it('range from primitive', async () => {
      const model = {
        result: chain(10)
          .range()
          .filter(item => item.mod(root.get('skip')).eq(0))
          .map(item => item.call('tap')),
        set: setter('skip')
      };
      const optModel = eval(await compile(model, { compiler }));
      const initialData = { skip: 3 };
      const inst = optModel(initialData, funcLibrary);
      expect(inst.result).toEqual([0, 3, 6, 9]);
      expectTapFunctionToHaveBeenCalled(4, compiler);
      inst.set(6);
      expect(inst.result).toEqual([0, 6]);
      expectTapFunctionToHaveBeenCalled(1, compiler);
    });
    it('reduce', async () => {
      const model = {
        result: root.reduce((agg, value) => agg.plus(value).call('tap'), 0),
        set: setter(arg0)
      };
      const optModel = eval(await compile(model, { compiler }));
      const initialData = [1, 3, 5];
      const inst = optModel(initialData, funcLibrary);
      expect(inst.result).toEqual(9);
      expectTapFunctionToHaveBeenCalled(3, compiler);
      inst.set(2, 1);
      expect(inst.result).toEqual(5);
      expectTapFunctionToHaveBeenCalled(1, compiler);
    });
    it('reduce with empty array', async () => {
      const model = {
        result: root.reduce((agg, value) => agg.plus(value).call('tap'), 0),
        set: setter(arg0)
      };
      const optModel = eval(await compile(model, { compiler }));
      const initialData = [];
      const inst = optModel(initialData, funcLibrary);
      expect(inst.result).toEqual(0);
    });
    it('sum', async () => {
      const model = {
        result: root.sum(),
        set: setter(arg0)
      };
      const optModel = eval(await compile(model, { compiler }));
      const initialData = [1, 3, 5];
      const inst = optModel(initialData, funcLibrary);
      expect(inst.result).toEqual(9);
      inst.set(2, 1);
      expect(inst.result).toEqual(5);
    });
    it('sum with empty array', async () => {
      const model = {
        result: root.sum(),
        set: setter(arg0)
      };
      const optModel = eval(await compile(model, { compiler }));
      const initialData = [];
      const inst = optModel(initialData, funcLibrary);
      expect(inst.result).toEqual(0);
    });
    it('concat', async () => {
      const model = {
        result: root.get('a').concat(root.get('b')),
        set: setter('a', arg0)
      };
      const optModel = eval(await compile(model, { compiler }));
      const initialData = {a: [1, 3, 5], b: [2, 6]};
      const inst = optModel(initialData, funcLibrary);
      expect(inst.result).toEqual([1, 3, 5, 2, 6]);
      inst.set(2, 1);
      expect(inst.result).toEqual([1, 3, 1, 2, 6]);
    });
    it('concat with empty array', async () => {
      const model = {
        result: root.get('a').concat(root.get('b')),
        set: setter('a', arg0)
      };
      const optModel = eval(await compile(model, { compiler }));
      const initialData = {a: [1, 3, 5], b: []};
      const inst = optModel(initialData, funcLibrary);
      expect(inst.result).toEqual([1, 3, 5]);
      inst.set(2, 1);
      expect(inst.result).toEqual([1, 3, 1]);
    });
    it('join', async () => {
      const initialData = ['a', 'b', 'c'];
      const model = {
        result: root.join('~')
      };
      const optModel = eval(await compile(model, { compiler }));
      const inst = optModel(initialData);
      expect(inst.result).toEqual('a~b~c');
    });
    it('join with empty array', async () => {
      const initialData = [];
      const model = {
        result: root.join('~')
      };
      const optModel = eval(await compile(model, { compiler }));
      const inst = optModel(initialData);
      expect(inst.result).toEqual('');
    });
    it('append with primitive', async () => {
      const initialData = ['a', 'b', 'c'];
      const model = {
        result: root.append('d')
      };
      const optModel = eval(await compile(model, { compiler }));
      const inst = optModel(initialData);
      expect(inst.result).toEqual(['a', 'b', 'c', 'd']);
    });
    it('append with array', async () => {
      const initialData = ['a', 'b', 'c'];
      const model = {
        result: root.append(['d'])
      };
      const optModel = eval(await compile(model, { compiler }));
      const inst = optModel(initialData);
      expect(inst.result).toEqual(['a', 'b', 'c', ['d']]);
    });
    describe('includes', () => {
      it('should return true if includes value', async () => {
        const initialData = { data: [1, 2, 3]};
        const value = 1
        const model = {
          includes: root.get('data').includes(value),
        };
        const optModel = eval(await compile(model, { compiler }));

        const inst = optModel(initialData);
        expect(inst.includes).toEqual(_.includes(initialData.data, value));
      });
      it('should return false if not includes value', async () => {
        const initialData = { data: [1, 2, 3]};
        const value = 4
        const model = {
          includes: root.get('data').includes(value),
        };
        const optModel = eval(await compile(model, { compiler }));

        const inst = optModel(initialData);
        expect(inst.includes).toEqual(_.includes(initialData.data, value));
      });
    })
    it('branching - soft tracking', async () => {
      const valuesInArrays = root.map(item => or(item.get('arr'), [item.get('val')]));
      const indexes = root.map((item, idx) => idx);
      const model = {
        result: indexes.map(idx => valuesInArrays.get(idx).get(0)),
        set: setter(arg0)
      };
      const optModel = eval(await compile(model, { compiler }));
      const initialData = [{ arr: [1] }, { val: 2 }, { arr: [3] }];
      const inst = optModel(initialData);
      expect(inst.result).toEqual([1, 2, 3]);
      inst.set(0, { val: 4 });
      expect(inst.result).toEqual([4, 2, 3]);
      inst.set(1, { arr: [5] });
      expect(inst.result).toEqual([4, 5, 3]);
    });
    it('test binding', async () => {
      const model = {
        doubleFunctions: root.map(item => bind('double', item)).map(item => item.call('tap')),
        multFunctions: root.map(item => bind('mult', item)).map(item => item.call('tap')),
        updateFunctions: root.map((item, key) => bind('updateSelf', key, item.mult(2))).map(item => item.call('tap')),
        set: setter(arg0)
      };
      const initialData = [3, 4];
      const optModel = eval(await compile(model, { compiler }));
      const extraFn = {
        double: x => x * 2,
        mult: (x, y) => x * y,
        updateSelf: function(index, val) {
          this.set(index, val);
        }
      };
      const inst = optModel(initialData, { ...extraFn, ...funcLibrary });
      expect(inst.doubleFunctions[0]()).toEqual(6);
      expect(inst.doubleFunctions[1]()).toEqual(8);
      expect(inst.multFunctions[0](5)).toEqual(15);
      expect(inst.multFunctions[1](5)).toEqual(20);
      const old = inst.doubleFunctions[0];
      expectTapFunctionToHaveBeenCalled(6, compiler);
      inst.updateFunctions[0]();
      expectTapFunctionToHaveBeenCalled(0, compiler);
      expect(inst.doubleFunctions[0]()).toEqual(12);
      expect(inst.doubleFunctions[1]()).toEqual(8);
    });

  });
});
