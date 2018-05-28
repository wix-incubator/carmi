const { compile, and, or, root, arg0, arg1, setter, splice } = require('../../index');
const { currentValues, funcLibrary, expectTapFunctionToHaveBeenCalled, rand } = require('../test-utils');
const _ = require('lodash');

describe('testing array', () => {
  it('simple map', () => {
    const model = { negated: root.map(val => val.not().call('tap')), set: setter(arg0) };
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
      anyTruthy: root.any(val => val.call('tap')),
      set: setter(arg0)
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
      itemByIdx: root.keyBy(val => val.get('idx')).mapValues(val => val.get('text').call('tap')),
      set: setter(arg0),
      splice: splice()
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
  it('simple comparison operations', () => {
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
    const optModel = eval(compile(model));
    const inst = optModel({ arr: [0, 1, 2, 3, 4], compareTo: 2 }, funcLibrary);
    expect(currentValues(inst)).toEqual({
      greaterThan: [false, false, false, true, true],
      lessThan: [true, true, false, false, false],
      greaterOrEqual: [false, false, true, true, true],
      lessThanOrEqual: [true, true, true, false, false]
    });
    expectTapFunctionToHaveBeenCalled(20);
    inst.setArr(4, 0);
    expect(currentValues(inst)).toEqual({
      greaterThan: [false, false, false, true, false],
      lessThan: [true, true, false, false, true],
      greaterOrEqual: [false, false, true, true, false],
      lessThanOrEqual: [true, true, true, false, true]
    });
    expectTapFunctionToHaveBeenCalled(4);
    inst.setCompareTo(100);
    expect(currentValues(inst)).toEqual({
      greaterThan: [false, false, false, false, false],
      lessThan: [true, true, true, true, true],
      greaterOrEqual: [false, false, false, false, false],
      lessThanOrEqual: [true, true, true, true, true]
    });
    expectTapFunctionToHaveBeenCalled(20);
  });
  it('test creation of arrays', () => {
    const sumsTuple = root.map(item => [item.get(0).plus(item.get(1))]);
    const mapOfSum = sumsTuple.map(item => item.get(0).call('tap'));

    const model = { mapOfSum, set0: setter(arg0, 0), set1: setter(arg0, 1) };
    const optCode = eval(compile(model));
    const initialData = [[1, 2], [3, 4], [5, 6]];
    const inst = optCode(initialData, funcLibrary);
    expect(inst.mapOfSum).toEqual([3, 7, 11]);
    expectTapFunctionToHaveBeenCalled(3);
    inst.set0(0, 7);
    expect(inst.mapOfSum).toEqual([9, 7, 11]);
    expectTapFunctionToHaveBeenCalled(1);
    inst.$startBatch();
    inst.set0(1, 4);
    inst.set1(1, 3);
    inst.$endBatch();
    expect(inst.mapOfSum).toEqual([9, 7, 11]);
    expectTapFunctionToHaveBeenCalled(0);
  });
  it('test assign/defaults', () => {
    const model = {
      assign: root.assign().mapValues(val => val.call('tap')),
      defaults: root.defaults().mapValues(val => val.call('tap')),
      set: setter(arg0),
      setInner: setter(arg0, arg1),
      splice: splice()
    };
    const optCode = eval(compile(model));
    const initialData = [{ a: 1 }, { b: 2 }, { a: 5 }];
    const inst = optCode(initialData, funcLibrary);
    expect(currentValues(inst)).toEqual({ assign: { a: 5, b: 2 }, defaults: { a: 1, b: 2 } });
    expectTapFunctionToHaveBeenCalled(4);
    inst.set(0, { a: 7 });
    expect(currentValues(inst)).toEqual({ assign: { a: 5, b: 2 }, defaults: { a: 7, b: 2 } });
    expectTapFunctionToHaveBeenCalled(1);
    inst.setInner(2, 'a', 9);
    expect(currentValues(inst)).toEqual({ assign: { a: 9, b: 2 }, defaults: { a: 7, b: 2 } });
    expectTapFunctionToHaveBeenCalled(1);
    inst.splice(1, 1);
    expect(currentValues(inst)).toEqual({ assign: { a: 9 }, defaults: { a: 7 } });
    expectTapFunctionToHaveBeenCalled(0);
  });
  it('test range/size', () => {
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
    const optCode = eval(compile(model));
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
});
