const { compile, and, or, root, arg0, setter, chain, splice } = require('../../index');

const {
  describeCompilers,
  currentValues,
  funcLibrary,
  expectTapFunctionToHaveBeenCalled,
  rand
} = require('../test-utils');
const _ = require('lodash');

describe('testing objects', () => {
  describeCompilers(['simple', 'optimizing'], compiler => {
    it('mapValues context value', async () => {
      const model = {
        shared: root.mapValues(item =>
          root.filterBy((innerItem, innerKey, outerItem) => innerItem.eq(outerItem), item)
        ),
        setItem: setter(arg0)
      };
      const optModel = eval(await compile(model, { compiler }));
      const initialData = { One: 1, Two: 2, First: 1, Second: 2 };
      const inst = optModel(initialData);
      expect(inst.shared).toEqual({
        First: { First: 1, One: 1 },
        One: { First: 1, One: 1 },
        Second: { Second: 2, Two: 2 },
        Two: { Second: 2, Two: 2 }
      });
      inst.setItem('First', 2);
      expect(inst.shared).toEqual({
        First: { First: 2, Second: 2, Two: 2 },
        One: { One: 1 },
        Second: { First: 2, Second: 2, Two: 2 },
        Two: { First: 2, Second: 2, Two: 2 }
      });
    });
    it('mapValues context key', async () => {
      const model = {
        shared: root.mapValues((item, key) =>
          root.filterBy((innerItem, innerKey, outerItem) => innerItem.eq(root.get(outerItem)), key)
        ),
        setItem: setter(arg0)
      };
      const optModel = eval(await compile(model, { compiler }));
      const initalData = { One: 1, Two: 2, First: 1, Second: 2 };
      const inst = optModel(initalData);
      expect(inst.shared).toEqual({
        First: { First: 1, One: 1 },
        One: { First: 1, One: 1 },
        Second: { Second: 2, Two: 2 },
        Two: { Second: 2, Two: 2 }
      });
      inst.setItem('First', 2);
      expect(inst.shared).toEqual({
        First: { First: 2, Second: 2, Two: 2 },
        One: { One: 1 },
        Second: { First: 2, Second: 2, Two: 2 },
        Two: { First: 2, Second: 2, Two: 2 }
      });
    });
    it('using simple constant objects', async () => {
      const translate = chain({ First: 'a', Second: 'b', Third: 'c' });
      const model = {
        lookUp: root
          .get('source')
          .mapValues(item => or(and(translate.get(item), root.get('results').get(translate.get(item))), '')),
        setItem: setter('source', arg0)
      };
      const optModel = eval(await compile(model, { compiler }));
      const initalData = {
        source: { One: 'First', Two: 'Second', Three: 'Unknown' },
        results: { a: 'A', b: 'B', c: 'C' }
      };
      const inst = optModel(initalData);
      expect(inst.lookUp).toEqual({ One: 'A', Two: 'B', Three: '' });
      inst.setItem('Three', 'Third');
      expect(inst.lookUp).toEqual({ One: 'A', Two: 'B', Three: 'C' });
    });
    it('mapKeys', async () => {
      const model = {
        byName: root
          .mapValues((title, idx) => ({ title, idx }))
          .mapKeys(item => item.get('title'))
          .mapValues(item => item.call('tap')),

        set: setter(arg0)
      };
      const optModel = eval(await compile(model, { compiler }));
      const initalData = { '1': 'One', '2': 'Two', '3': 'Three' };
      const inst = optModel(initalData, funcLibrary);
      expect(inst.byName).toEqual({
        One: { title: 'One', idx: '1' },
        Two: { title: 'Two', idx: '2' },
        Three: { title: 'Three', idx: '3' }
      });
      expectTapFunctionToHaveBeenCalled(3, compiler);
      inst.set('3', 'Third');
      expect(inst.byName).toEqual({
        One: { title: 'One', idx: '1' },
        Two: { title: 'Two', idx: '2' },
        Third: { title: 'Third', idx: '3' }
      });
      expectTapFunctionToHaveBeenCalled(1, compiler);
      inst.set('3');
      expect(inst.byName).toEqual({
        One: { title: 'One', idx: '1' },
        Two: { title: 'Two', idx: '2' }
      });
      expectTapFunctionToHaveBeenCalled(0, compiler);
      inst.$startBatch();
      inst.set('1', 'Two');
      inst.set('2', 'One');
      inst.$endBatch();
      expect(inst.byName).toEqual({
        One: { title: 'One', idx: '2' },
        Two: { title: 'Two', idx: '1' }
      });
      expectTapFunctionToHaveBeenCalled(2, compiler);
    });
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
      const optModel = eval(await compile(model, { compiler }));
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
      expectTapFunctionToHaveBeenCalled(3, compiler);
      inst.setCenter(9);
      expect(inst.inRange).toEqual({ eight: 'eight', twelve: 'twelve', ten: 'ten' });
      expectTapFunctionToHaveBeenCalled(3, compiler);
      inst.setCenter(6);
      expect(inst.inRange).toEqual({ eight: 'eight', five: 'five', three: 'three' });
      expectTapFunctionToHaveBeenCalled(2, compiler);
      inst.$startBatch();
      inst.setRange(7);
      expectTapFunctionToHaveBeenCalled(0, compiler); // batch
      inst.setCenter(2);
      inst.$endBatch();
      expect(inst.inRange).toEqual({ five: 'five', three: 'three', one: 'one', eight: 'eight' });
      expectTapFunctionToHaveBeenCalled(1, compiler);
      inst.setCenter(15);
      expect(inst.inRange).toEqual({ twelve: 'twelve', ten: 'ten', eight: 'eight' });
      expectTapFunctionToHaveBeenCalled(2, compiler);
    });
    it('mapValues', async () => {
      const textsIfDone = root
        .mapValues(val => val.get('done').ternary(val.get('text'), val.get('missingProp')))
        .mapValues(text => text.call('tap'));
      const model = { textsIfDone, update: setter(arg0, 'done') };
      const optModel = eval(await compile(model, { compiler }));
      const initialData = {
        a: { done: true, text: 'a' },
        b: { done: true, text: 'b' },
        c: { done: false, text: 'c' }
      };
      const inst = optModel(initialData, funcLibrary);
      expect(inst.textsIfDone).toEqual({ a: 'a', b: 'b', c: undefined });
      expectTapFunctionToHaveBeenCalled(3, compiler);
      inst.update('b', false);
      expect(inst.textsIfDone).toEqual({ a: 'a', b: undefined, c: undefined });
      expectTapFunctionToHaveBeenCalled(1, compiler);
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
      const optModel = eval(await compile(model, { compiler }));
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
    it('getIn', async () => {
      const model = {
        defined: root.getIn(['a', 'b']),
        notDefined: root.getIn(['c', 'b'])
      };
      const optModel = eval(await compile(model, { compiler }));
      const initialData = { a: { b: 1 } };

      const inst = optModel(initialData);
      expect(inst.defined).toEqual(1);
      expect(inst.notDefined).not.toBeDefined();
    });
  });
});
