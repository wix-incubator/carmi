const { compile, and, or, root, arg0, setter, splice } = require('../../index');
const { currentValues, funcLibrary, expectTapFunctionToHaveBeenCalled, rand } = require('../test-utils');
const _ = require('lodash');

describe('testing objects', () => {
  it('values/keys', async () => {
    const rangeMin = root.get('center').minus(root.get('range'));
    const rangeMax = root.get('center').plus(root.get('range'));
    const model = {
      inRange: root
        .get('numbers')
        .filterBy(val => and(val.gte(rangeMin), val.lte(rangeMax)))
        .keys()
        .keyBy(val => val.call('tap')),
      set: setter('numbers', arg0),
      setCenter: setter('center'),
      setRange: setter('range')
    };

    // const naiveModel = eval(await compile(model, true));
    const optModel = eval(await compile(model, false));
    const initialData = {
      numbers: {
        eight: 8,
        five: 5,
        twelve: 12,
        three: 3,
        ten: 10,
        one: 1
      },
      center: 4,
      range: 3
    };
    const inst = optModel(initialData, funcLibrary);
    expect(inst.inRange).toEqual({ five: 'five', three: 'three', one: 'one' });
    expectTapFunctionToHaveBeenCalled(3);
    inst.setCenter(9);
    expect(inst.inRange).toEqual({ eight: 'eight', twelve: 'twelve', ten: 'ten' });
    expectTapFunctionToHaveBeenCalled(3);
    inst.setCenter(6);
    expect(inst.inRange).toEqual({ eight: 'eight', five: 'five', three: 'three' });
    expectTapFunctionToHaveBeenCalled(2);
    inst.$startBatch();
    inst.setRange(7);
    expectTapFunctionToHaveBeenCalled(0); // batch
    inst.setCenter(2);
    inst.$endBatch();
    expect(inst.inRange).toEqual({ five: 'five', three: 'three', one: 'one', eight: 'eight' });
    expectTapFunctionToHaveBeenCalled(1);
    inst.setCenter(15);
    expect(inst.inRange).toEqual({ twelve: 'twelve', ten: 'ten', eight: 'eight' });
    expectTapFunctionToHaveBeenCalled(2);
  });
  it('mapValues', async () => {
    const textsIfDone = root
      .mapValues(val => val.get('done').ternary(val.get('text'), val.get('missingProp')))
      .mapValues(text => text.call('tap'));
    const model = { textsIfDone, update: setter(arg0, 'done') };
    const optModel = eval(await compile(model));
    const initialData = {
      a: { done: true, text: 'a' },
      b: { done: true, text: 'b' },
      c: { done: false, text: 'c' }
    };
    const inst = optModel(initialData, funcLibrary);
    expect(inst.textsIfDone).toEqual({ a: 'a', b: 'b', c: undefined });
    expectTapFunctionToHaveBeenCalled(3);
    inst.update('b', false);
    expect(inst.textsIfDone).toEqual({ a: 'a', b: undefined, c: undefined });
    expectTapFunctionToHaveBeenCalled(1);
  });
  it('create objects', async () => {
    const itemsWithKey = root.mapValues((item, key) => {
      return {
        key: key,
        text: item.get('text'),
        idx: item.get('idx')
      };
    });
    const itemsByIdx = itemsWithKey.values().keyBy(item => item.get('idx'));
    const model = {
      itemsByIdx,
      updateIdx: setter(arg0, 'idx'),
      updateItem: setter(arg0)
    };
    const optModel = eval(await compile(model));
    const initialData = {
      a: { text: 'A', idx: '0' },
      b: { text: 'B', idx: '1' },
      c: { text: 'C', idx: '2' }
    };
    const inst = optModel(initialData, funcLibrary);
    expect(inst.itemsByIdx).toEqual({
      '0': {
        idx: '0',
        key: 'a',
        text: 'A'
      },
      '1': {
        idx: '1',
        key: 'b',
        text: 'B'
      },
      '2': {
        idx: '2',
        key: 'c',
        text: 'C'
      }
    });
    inst.updateIdx('a', '4');
    expect(inst.itemsByIdx).toEqual({
      '4': {
        idx: '4',
        key: 'a',
        text: 'A'
      },
      '1': {
        idx: '1',
        key: 'b',
        text: 'B'
      },
      '2': {
        idx: '2',
        key: 'c',
        text: 'C'
      }
    });
    inst.updateItem('a'); /// delete key
    expect(inst.itemsByIdx).toEqual({
      '1': {
        idx: '1',
        key: 'b',
        text: 'B'
      },
      '2': {
        idx: '2',
        key: 'c',
        text: 'C'
      }
    });
  });
});
