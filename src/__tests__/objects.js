/*eslint no-evalOrLoad:0*/
const {compile, and, or, root, arg0, setter, chain, splice} = require('../../index');

const {
  describeCompilers,
  evalOrLoad,
  currentValues,
  funcLibrary,
  expectTapFunctionToHaveBeenCalled,
  rand
} = require('../test-utils');
const _ = require('lodash');

describe('testing objects', () => {
  describeCompilers(['simple', 'optimizing', 'bytecode'], compiler => {
    describe('get', () => {
      it('not passing', () => {
        const model = {
          set: setter('model', arg0),
          result: root.get('model').get('kofnae')
          // model: root.get('model')
        };
        const optModel = evalOrLoad(compile(model, {compiler}));
        const initialData = {
          model: {}
        };

        const inst = optModel(initialData);
        inst.set('kofnae', 'meod');
        expect(inst.result).toEqual('meod');
      });
      it('passing', () => {
        const model = {
          set: setter('model', arg0),
          result: root.get('model').get('kofnae'),
          model: root.get('model') // TODO Reut - this is the only difference
        };
        const optModel = evalOrLoad(compile(model, {compiler}));
        const initialData = {
          model: {}
        };

        const inst = optModel(initialData);
        inst.set('kofnae', 'meod');
        expect(inst.result).toEqual('meod');
      });
    });
    it('mapValues context value', () => {
      const model = {
        shared: root.mapValues(item =>
          root.filterBy((innerItem, innerKey, outerItem) => innerItem.eq(outerItem), item)
        ),
        setItem: setter(arg0)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = {One: 1, Two: 2, First: 1, Second: 2};
      const inst = optModel(initialData);
      expect(inst.shared).toEqual({
        First: {First: 1, One: 1},
        One: {First: 1, One: 1},
        Second: {Second: 2, Two: 2},
        Two: {Second: 2, Two: 2}
      });
      inst.setItem('First', 2);
      expect(inst.shared).toEqual({
        First: {First: 2, Second: 2, Two: 2},
        One: {One: 1},
        Second: {First: 2, Second: 2, Two: 2},
        Two: {First: 2, Second: 2, Two: 2}
      });
    });
    it('mapValues context key', () => {
      const model = {
        shared: root.mapValues((item, key) =>
          root.filterBy((innerItem, innerKey, outerItem) => innerItem.eq(root.get(outerItem)), key)
        ),
        setItem: setter(arg0)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initalData = {One: 1, Two: 2, First: 1, Second: 2};
      const inst = optModel(initalData);
      expect(inst.shared).toEqual({
        First: {First: 1, One: 1},
        One: {First: 1, One: 1},
        Second: {Second: 2, Two: 2},
        Two: {Second: 2, Two: 2}
      });
      inst.setItem('First', 2);
      expect(inst.shared).toEqual({
        First: {First: 2, Second: 2, Two: 2},
        One: {One: 1},
        Second: {First: 2, Second: 2, Two: 2},
        Two: {First: 2, Second: 2, Two: 2}
      });
    });
    it('groupBy', () => {
      const numOfDoneItems = root
        .groupBy('done')
        .get('true')
        .call('tap')
        .size();
      const model = {numOfDoneItems, update: setter(arg0, 'done')};
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = {
        a: {done: true, text: 'a'},
        b: {done: true, text: 'b'},
        c: {done: false, text: 'c'}
      };
      const inst = optModel(initialData, funcLibrary);
      expect(inst.numOfDoneItems).toEqual(2);
      expectTapFunctionToHaveBeenCalled(1, compiler);
      inst.update('b', false);
      expect(inst.numOfDoneItems).toEqual(1);
      expectTapFunctionToHaveBeenCalled(1, compiler);
    });
    it('groupBy when initial data is empty', () => {
      const doneItems = root
        .get('data')
        .groupBy('done')
        .get('true')
        .call('tap');
      const model = {doneItems, update: setter('data')};
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = {
        data: {}
      };
      const inst = optModel(initialData, funcLibrary);
      expect(inst.doneItems).toEqual(undefined);
      expectTapFunctionToHaveBeenCalled(1, compiler);
      const updateData = {
        a: {done: true, text: 'a'},
        b: {done: true, text: 'b'},
        c: {done: false, text: 'c'}
      };
      inst.update(updateData);
      expect(inst.doneItems).toEqual(_.pick(updateData, ['a', 'b']));
      expectTapFunctionToHaveBeenCalled(1, compiler);
    });

    it('anyValues when removing elements', () => {
        const model = {
          anyTruthy: root.get('data').anyValues(a => a.get('val')),
          set: setter('data', arg0),
          clear: setter('data')
        };
        const optModel = evalOrLoad(compile(model, {compiler}));
        const inst = optModel({data: {a: {val: false}, b: {val: true}, c: {val: false}}}, funcLibrary);
        expect(inst.anyTruthy).toEqual(true);
        inst.clear({});
        expect(inst.anyTruthy).toEqual(false);
    });

    it('should contain only one group after removing item', () => {
      const doneItems = root
        .get('data')
        .groupBy('done')
        .get('true')
        .call('tap');
      const model = {doneItems, update: setter('data', arg0)};
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = {
        data: {
          a: {done: true, text: 'a'},
          b: {done: true, text: 'b'},
          c: {done: false, text: 'c'}
        }
      };
      const inst = optModel(initialData, funcLibrary);
      expect(inst.doneItems).toEqual({a: {done: true, text: 'a'}, b: {done: true, text: 'b'}});
      expectTapFunctionToHaveBeenCalled(1, compiler);

      inst.update('c', undefined);
      expect(Object.keys(inst.doneItems)).toEqual(['a', 'b']);
      expectTapFunctionToHaveBeenCalled(0, compiler);
    });

    it('groupBy should invalidate external', () => {
      const itemsByState = root
        .groupBy(item => item.get('state'))
      const numOfDoneItems =
        chain([itemsByState.get('archive'), itemsByState.get('done')])
          .assign()
          .mapValues(item => item.call('tap'))
          .size();
      const model = {numOfDoneItems, update: setter(arg0)};
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = {
        a: {state: 'done', text: 'a'},
        b: {state: 'done', text: 'b'},
        c: {state: 'archive', text: 'c'},
        d: {state: 'pending', text: 'd'}
      };
      const inst = optModel(initialData, funcLibrary);
      expect(inst.numOfDoneItems).toEqual(3);
      expectTapFunctionToHaveBeenCalled(3, compiler);
      inst.update('e', {state: 'done', text: 'e'});
      expect(inst.numOfDoneItems).toEqual(4);
      expectTapFunctionToHaveBeenCalled(1, compiler);
    })

    it('using simple constant objects', () => {
      const translate = chain({First: 'a', Second: 'b', Third: 'c'});
      const model = {
        lookUp: root
          .get('source')
          .mapValues(item => or(and(translate.get(item), root.get('results').get(translate.get(item))), '')),
        setItem: setter('source', arg0)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initalData = {
        source: {One: 'First', Two: 'Second', Three: 'Unknown'},
        results: {a: 'A', b: 'B', c: 'C'}
      };
      const inst = optModel(initalData);
      expect(inst.lookUp).toEqual({One: 'A', Two: 'B', Three: ''});
      inst.setItem('Three', 'Third');
      expect(inst.lookUp).toEqual({One: 'A', Two: 'B', Three: 'C'});
    });
    it('mapKeys', () => {
      const model = {
        byName: root
          .mapValues((title, idx) => ({title, idx}))
          .mapKeys(item => item.get('title'))
          .mapValues(item => item.call('tap')),

        set: setter(arg0)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initalData = {1: 'One', 2: 'Two', 3: 'Three'};
      const inst = optModel(initalData, funcLibrary);
      expect(inst.byName).toEqual({
        One: {title: 'One', idx: '1'},
        Two: {title: 'Two', idx: '2'},
        Three: {title: 'Three', idx: '3'}
      });
      expectTapFunctionToHaveBeenCalled(3, compiler);
      inst.set('3', 'Third');
      expect(inst.byName).toEqual({
        One: {title: 'One', idx: '1'},
        Two: {title: 'Two', idx: '2'},
        Third: {title: 'Third', idx: '3'}
      });
      expectTapFunctionToHaveBeenCalled(1, compiler);
      inst.set('3');
      expect(inst.byName).toEqual({
        One: {title: 'One', idx: '1'},
        Two: {title: 'Two', idx: '2'}
      });
      expectTapFunctionToHaveBeenCalled(0, compiler);
      inst.$startBatch();
      inst.set('1', 'Two');
      inst.set('2', 'One');
      inst.$endBatch();
      expect(inst.byName).toEqual({
        One: {title: 'One', idx: '2'},
        Two: {title: 'Two', idx: '1'}
      });
      expectTapFunctionToHaveBeenCalled(2, compiler);
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
        set: setter('numbers', arg0),
        setCenter: setter('center'),
        setRange: setter('range')
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
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
      expect(inst.inRange).toEqual({five: 'five', three: 'three', one: 'one'});
      expectTapFunctionToHaveBeenCalled(3, compiler);
      inst.setCenter(9);
      expect(inst.inRange).toEqual({eight: 'eight', twelve: 'twelve', ten: 'ten'});
      expectTapFunctionToHaveBeenCalled(3, compiler);
      inst.setCenter(6);
      expect(inst.inRange).toEqual({eight: 'eight', five: 'five', three: 'three'});
      expectTapFunctionToHaveBeenCalled(2, compiler);
      inst.$startBatch();
      inst.setRange(7);
      expectTapFunctionToHaveBeenCalled(0, compiler); // batch
      inst.setCenter(2);
      inst.$endBatch();
      expect(inst.inRange).toEqual({five: 'five', three: 'three', one: 'one', eight: 'eight'});
      expectTapFunctionToHaveBeenCalled(1, compiler);
      inst.setCenter(15);
      expect(inst.inRange).toEqual({twelve: 'twelve', ten: 'ten', eight: 'eight'});
      expectTapFunctionToHaveBeenCalled(2, compiler);
    });
    it('mapValues', () => {
      const textsIfDone = root
        .mapValues(val => val.get('done').ternary(val.get('text'), val.get('missingProp')))
        .mapValues(text => text.call('tap'));
      const model = {textsIfDone, update: setter(arg0, 'done')};
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = {
        a: {done: true, text: 'a'},
        b: {done: true, text: 'b'},
        c: {done: false, text: 'c'}
      };
      const inst = optModel(initialData, funcLibrary);
      expect(inst.textsIfDone).toEqual({a: 'a', b: 'b', c: undefined});
      expectTapFunctionToHaveBeenCalled(3, compiler);
      inst.update('b', false);
      expect(inst.textsIfDone).toEqual({a: 'a', b: undefined, c: undefined});
      expectTapFunctionToHaveBeenCalled(1, compiler);
    });
    it('create objects', () => {
      const itemsWithKey = root.mapValues((item, key) => ({
          key,
          text: item.get('text'),
          idx: item.get('idx')
        }));
      const itemsByIdx = itemsWithKey.values().keyBy(item => item.get('idx'));
      const model = {
        itemsByIdx,
        updateIdx: setter(arg0, 'idx'),
        updateItem: setter(arg0)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = {
        a: {text: 'A', idx: '0'},
        b: {text: 'B', idx: '1'},
        c: {text: 'C', idx: '2'}
      };
      const inst = optModel(initialData, funcLibrary);
      expect(inst.itemsByIdx).toEqual({
        0: {
          idx: '0',
          key: 'a',
          text: 'A'
        },
        1: {
          idx: '1',
          key: 'b',
          text: 'B'
        },
        2: {
          idx: '2',
          key: 'c',
          text: 'C'
        }
      });
      inst.updateIdx('a', '4');
      expect(inst.itemsByIdx).toEqual({
        4: {
          idx: '4',
          key: 'a',
          text: 'A'
        },
        1: {
          idx: '1',
          key: 'b',
          text: 'B'
        },
        2: {
          idx: '2',
          key: 'c',
          text: 'C'
        }
      });
      inst.updateItem('a'); /// delete key
      expect(inst.itemsByIdx).toEqual({
        1: {
          idx: '1',
          key: 'b',
          text: 'B'
        },
        2: {
          idx: '2',
          key: 'c',
          text: 'C'
        }
      });
    });
    it('getIn', () => {
      const model = {
        defined: root.getIn(['a', 'b']),
        notDefined: root.getIn(['c', 'b'])
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = {a: {b: 1}};

      const inst = optModel(initialData);
      expect(inst.defined).toEqual(1);
      expect(inst.notDefined).not.toBeDefined();
    });
    it('getIn getter', () => {
      const a = root.get('a');
      const model = {
        a,
        defined: a.getIn(['b', 'c', 'd']),
        notDefined: root.getIn(['b', 'e', 'b'])
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = {a: {b: {c: {d: 1}}}};

      const inst = optModel(initialData);
      expect(inst.defined).toEqual(1);
      expect(inst.notDefined).not.toBeDefined();
    });
    it('getIn mapValues', () => {
      const overrides = root.get('overrides');
      const src = root.get('source');
      const select = root.get('select');
      const model = {
        projection: src.mapValues((item, itemId) => or(overrides.getIn([select, itemId]), item)),
        setSelect: setter('select'),
        updateSrc: setter('source', arg0),
        updateOverrides: setter('overrides'),
        updateOneOverride: setter('overrides', arg0)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = {source: {a: 1, b: 2}, overrides: {first: {b: 3}, second: {a: 4}}, select: 'none'};

      const inst = optModel(initialData);
      expect(inst.projection).toEqual({a: 1, b: 2});
      inst.setSelect('first');
      expect(inst.projection).toEqual({a: 1, b: 3});
    });
    describe('find', () => {
      it('should find value if exists', () => {
        const initialData = {a: 'nothing', b: 'something'};
        const model = {
          find: root.find(val => val.eq('something'))
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.find).toEqual('something');
      });
      it('should return undefined if not exists', () => {
        const initialData = {a: 'nothing', b: 'something'};
        const model = {
          find: root.find(val => val.eq('notExists'))
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.find).toEqual(undefined);
      });
      it('should find using context', () => {
        const initialData = {a: 'nothing', b: 'something'};
        const model = {
          find: root.find((val, key, ctx) => val.eq(ctx), root.get('b'))
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.find).toEqual('something');
      });
    });
    describe('setIn', () => {
      it('should setIn simple with array', () => {
        const initialData = {data: {a: 1}};
        const path = ['b'];
        const value = {};
        const model = {
          setIn: root.get('data').setIn(path, value)
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.setIn).toEqual(_.set(initialData.data, path, value));
      });
      it('should setIn deep with array', () => {
        const initialData = {data: {a: 1}};
        const path = ['a', 'b'];
        const value = {};
        const model = {
          setIn: root.get('data').setIn(path, value)
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.setIn).toEqual(_.set(initialData.data, path, value));
      });
      it('should setIn deep without destroying other properties with array', () => {
        const initialData = {data: {a: 1, b: {c: 'hey'}}};
        const path = ['a', 'b', 'z', 'd'];
        const value = 'hello';
        const model = {
          setIn: root.get('data').setIn(path, value)
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.setIn).toEqual(_.set(initialData.data, path, value));
      });
    });
    describe('includesValue', () => {
      it('should return true if includes value', () => {
        const initialData = {data: {a: 1, b: 2}};
        const value = 1;
        const model = {
          includesValue: root.get('data').includesValue(value)
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.includesValue).toEqual(_.includes(initialData.data, value));
      });
      it('should return false if not includes value', () => {
        const initialData = {data: {a: 1, b: 2}};
        const value = 3;
        const model = {
          includesValue: root.get('data').includesValue(value)
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.includesValue).toEqual(_.includes(initialData.data, value));
      });
    });
    describe('pick', () => {
      it('should pick simple', () => {
        const initialData = {data: {a: 1, b: 2}};
        const path = ['b'];
        const model = {
          pick: root.get('data').pick(path)
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.pick).toEqual(_.pick(initialData.data, path));
      });
      it('should pick with non-exisiting props', () => {
        const initialData = {data: {a: 1, b: 2}};
        const path = ['c'];
        const model = {
          pick: root.get('data').pick(path)
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.pick).toEqual(_.pick(initialData.data, path));
      });
      it('should pick with empty array', () => {
        const initialData = {data: {a: 1, b: 2}};
        const path = [];
        const model = {
          pick: root.get('data').pick(path)
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.pick).toEqual(_.pick(initialData.data, path));
      });
      it('should pick with complex', () => {
        const initialData = {data: {a: 1, b: 2, c: {d: 1}, e: [1, 2, 3, 4]}};
        const path = ['c', 'd', 'e', 'f'];
        const model = {
          pick: root.get('data').pick(path)
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.pick).toEqual(_.pick(initialData.data, path));
      });

      it('should pick falsy values', () => {
        const initialData = {data: {a: false, b: 2}};
        const path = ['a'];
        const model = {
          pick: root.get('data').pick(path)
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.pick).toEqual(_.pick(initialData.data, path));
      });
    });

    describe('isEmpty', () => {
      it('should return true for empty object', () => {
        const initialData = {data: {}}
        const model = {
          isEmpty: root.get('data').isEmpty()
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.isEmpty).toEqual(true);
      });

      it('should return false for non empty object', () => {
        const initialData = {data: {a: 1}}
        const model = {
          isEmpty: root.get('data').isEmpty()
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.isEmpty).toEqual(false);
      });
    })

    describe('has', () => {
      it('should return true if contain key', () => {
        const initialData = {data: {a: 1, b: 2}};
        const key = 'b';
        const model = {
          has: root.get('data').has(key)
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.has).toEqual(_.has(initialData.data, key));
      });
      it('should return true if contains key its value is falsy', () => {
        const initialData = {data: {a: 1, b: null}};
        const key = 'b';
        const model = {
          has: root.get('data').has(key)
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.has).toEqual(_.has(initialData.data, key));
      });
      it('should return false if not contain key', () => {
        const initialData = {data: {a: 1, b: 2}};
        const key = 'd';
        const model = {
          has: root.get('data').has(key)
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.has).toEqual(_.has(initialData.data, key));
      });
    });
    it('assignIn', () => {
      const model = {
        defined: root.assignIn([{a: 'women'}]),
        notDefined: root.assignIn([{x: 'men'}])
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = {a: {b: 1}};

      const inst = optModel(initialData);
      expect(inst.defined.a).toEqual('women');
      expect(inst.notDefined.x).toEqual('men');
    });
  });
});
