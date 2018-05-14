const { currentValues, compile, and, or, context, root, val, key, arg0, Setter, Splice } = require('../../index');
const _ = require('lodash');
const rand = require('random-seed').create();
const defaultSeed = 'CARMI';

describe('testing objects', () => {
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

  it('values/keys', () => {
    const rangeMin = root.get('center').minus(root.get('range'));
    const rangeMax = root.get('center').plus(root.get('range'));
    const model = {
      inRange: root
        .get('numbers')
        .filterBy(val => and(val.gte(rangeMin), val.lte(rangeMax)))
        .keys()
        .keyBy(val => val.call('tap')),
      set: Setter('numbers', arg0),
      setCenter: Setter('center'),
      setRange: Setter('range')
    };

    // const naiveModel = eval(compile(model, true));
    const optModel = eval(compile(model, false));
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
  it('create objects', () => {
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
      updateIdx: Setter(arg0, 'idx'),
      updateItem: Setter(arg0)
    };
    const optModel = eval(compile(model));
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
