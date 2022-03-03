const path = require('path')
const {compile, and, or, root, arg0, arg1, setter, splice, bind, chain} = require('../../index');
const {
  describeCompilers,
  evalOrLoad,
  currentValues,
  funcLibrary,
  expectTapFunctionToHaveBeenCalled,
  rand
} = require('../test-utils');
const _ = require('lodash');

describe('testing array', () => {
  describeCompilers(['simple', 'optimizing', 'bytecode'], compiler => {
    describe('map', () => {
      it('simple map', () => {
        const model = {negated: root.map(val => val.not().call('tap')), set: setter(arg0)};
        const optCode = evalOrLoad(compile(model, {compiler}));
        const inst = optCode([true, true, false, false, false], funcLibrary);
        expect(inst.negated).toEqual([false, false, true, true, true]);
        expectTapFunctionToHaveBeenCalled(inst.$model.length, compiler);
        inst.set(1, false);
        expect(inst.negated).toEqual([false, true, true, true, true]);
        expectTapFunctionToHaveBeenCalled(1, compiler);
      });
      it('simple map with effect', () => {
        const model = {effect: root.map(val => or(val.ternary(chain(true).effect('tap'), null), val)), set: setter(arg0)};
        const optCode = evalOrLoad(compile(model, {compiler}));
        const inst = optCode([true, true, false, false, false], funcLibrary);
        expect(inst.effect).toEqual([true, true, false, false, false]);
        expectTapFunctionToHaveBeenCalled(inst.$model.filter(k => k).length, {compiler: 'optimizing'});
        inst.set(1, false);
        expect(inst.effect).toEqual([true, false, false, false, false]);
        expectTapFunctionToHaveBeenCalled(0, {compiler: 'optimizing'});
        inst.set(2, true);
        expect(inst.effect).toEqual([true, false, true, false, false]);
        expectTapFunctionToHaveBeenCalled(1, {compiler: 'optimizing'});
      });
      it('map return empty object if falsy', () => {
        const model = {orEmpty: root.map(val => or(val, {}).call('tap')), set: setter(arg0)};
        const optCode = evalOrLoad(compile(model, {compiler}));
        const inst = optCode([{x: 1}, false, {x: 2}], funcLibrary);
        expect(inst.orEmpty).toEqual([{x: 1}, {}, {x: 2}]);
        expectTapFunctionToHaveBeenCalled(inst.$model.length, compiler);
        inst.set(2, false);
        expect(inst.orEmpty).toEqual([{x: 1}, {}, {}]);
        expectTapFunctionToHaveBeenCalled(1, compiler);
      });
      it('map return empty object if falsy', () => {
        const model = {orEmpty: root.map(val => or(val, []).call('tap')), set: setter(arg0)};
        const optCode = evalOrLoad(compile(model, {compiler}));
        const inst = optCode([[1], false, [2]], funcLibrary);
        expect(inst.orEmpty).toEqual([[1], [], [2]]);
        expectTapFunctionToHaveBeenCalled(inst.$model.length, compiler);
        inst.set(2, false);
        expect(inst.orEmpty).toEqual([[1], [], []]);
        expectTapFunctionToHaveBeenCalled(1, compiler);
      });
    });

    describe('any', () => {
      it('simple any', () => {
        const model = {
          anyTruthy: root.any(val => val.call('tap')),
          set: setter(arg0)
        };
        const optModel = evalOrLoad(compile(model, {compiler}));
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

      it('any when removing elements', () => {
        const model = {
          anyTruthy: root.get('data').any(a => a.get('val')),
          set: setter('data', arg0),
          clear: setter('data')
        };
        const optModel = evalOrLoad(compile(model, {compiler}));
        const inst = optModel({data: [{val: false}, {val: true}, {val: false}]}, funcLibrary);
        expect(inst.anyTruthy).toEqual(true);
        inst.clear([]);
        expect(inst.anyTruthy).toEqual(false);
      });
    })

    it('simple keyBy', () => {
      const model = {
        itemByIdx: root.keyBy(val => val.get('idx')).mapValues(val => val.get('text').call('tap')),
        set: setter(arg0),
        splice: splice()
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const inst = optModel([{idx: 1, text: 'a'}, {idx: 2, text: 'b'}, {idx: 3, text: 'c'}], funcLibrary);
      expectTapFunctionToHaveBeenCalled(3, compiler);
      expect(inst.itemByIdx).toEqual({1: 'a', 2: 'b', 3: 'c'});
      inst.set(0, {idx: 4, text: 'd'});
      expectTapFunctionToHaveBeenCalled(1, compiler);
      expect(inst.itemByIdx).toEqual({4: 'd', 2: 'b', 3: 'c'});
      inst.splice(1, 2, {idx: 3, text: 'e'});
      expect(inst.itemByIdx).toEqual({4: 'd', 3: 'e'});
      expectTapFunctionToHaveBeenCalled(1, compiler);
      const reverseArray = [...inst.$model].reverse();
      inst.splice(0, inst.$model.length, ...reverseArray);
      expect(inst.itemByIdx).toEqual({4: 'd', 3: 'e'});
      expectTapFunctionToHaveBeenCalled(0, compiler);
    });

    it('raw keyBy', () => {
      const model = {
        itemByIdx: root.keyBy(val => val.get('idx')),
        set: setter(arg0),
        splice: splice()
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const inst = optModel([{idx: 1, text: 'a', foo: 'bar'}, {idx: 2, text: 'b'}, {idx: 1, text: 'c'}], funcLibrary);
      expect(inst.itemByIdx).toEqual({1: {idx: 1, text: 'c'}, 2: {idx: 2, text: 'b'}});
    });

    it('double-valued keyBy', () => {
      const model = {
        asObject: root.keyBy(val => val),
        set: setter(arg0)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const inst = optModel(['a', 'a'], funcLibrary);
      expect(inst.asObject).toEqual({a: 'a'})
      inst.set(0, 'b')
      expect(inst.asObject).toEqual({a: 'a', b: 'b'})
    });

    it('keyBy should support "constructor" as key', () => {
      const model = {
        asObject: root.keyBy(val => val)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const inst = optModel(['a', 'constructor'], funcLibrary);
      expect(inst.asObject).toEqual({a: 'a', constructor: 'constructor'})
    })

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
      const compiled = compile(model, {compiler});
      const optModel = evalOrLoad(compiled.replace ? compiled.replace('carmi/src/lib', path.resolve(__dirname, '../lib')) : compiled);
      const inst = optModel({arr: [0, 1, 2, 3, 4], compareTo: 2}, funcLibrary);
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
    it('test creation of arrays', () => {
      const sumsTuple = root.map(item => [item.get(0).plus(item.get(1))]);
      const mapOfSum = sumsTuple.map(item => item.get(0).call('tap'));

      const model = {mapOfSum, set0: setter(arg0, 0), set1: setter(arg0, 1)};
      const optCode = evalOrLoad(compile(model, {compiler}));
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
    it('test assign/defaults', () => {
      const model = {
        assign: root.assign().mapValues(val => val.call('tap')),
        defaults: root.defaults().mapValues(val => val.call('tap')),
        set: setter(arg0),
        setInner: setter(arg0, arg1),
        splice: splice()
      };
      const optCode = evalOrLoad(compile(model, {compiler}));
      const initialData = [{a: 1}, {b: 2}, {a: 5}];
      const inst = optCode(initialData, funcLibrary);
      expect(currentValues(inst)).toEqual({assign: {a: 5, b: 2}, defaults: {a: 1, b: 2}});
      expectTapFunctionToHaveBeenCalled(4, compiler);
      inst.set(0, {a: 7});
      expect(currentValues(inst)).toEqual({assign: {a: 5, b: 2}, defaults: {a: 7, b: 2}});
      expectTapFunctionToHaveBeenCalled(1, compiler);
      inst.setInner(2, 'a', 9);
      expect(currentValues(inst)).toEqual({assign: {a: 9, b: 2}, defaults: {a: 7, b: 2}});
      expectTapFunctionToHaveBeenCalled(1, compiler);
      inst.splice(1, 1);
      expect(currentValues(inst)).toEqual({assign: {a: 9}, defaults: {a: 7}});
      expectTapFunctionToHaveBeenCalled(0, compiler);
    });
    it('ranges', () => {
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
      const initialData = {start: 2, end: 5, step: 2};
      const optCode = evalOrLoad(compile(model, {compiler}));
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
      const optCode = evalOrLoad(compile(model, {compiler}));
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
    it('range from primitive', () => {
      const model = {
        result: chain(10)
          .range()
          .filter(item => item.mod(root.get('skip')).eq(0))
          .map(item => item.call('tap')),
        set: setter('skip')
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = {skip: 3};
      const inst = optModel(initialData, funcLibrary);
      expect(inst.result).toEqual([0, 3, 6, 9]);
      expectTapFunctionToHaveBeenCalled(4, compiler);
      inst.set(6);
      expect(inst.result).toEqual([0, 6]);
      expectTapFunctionToHaveBeenCalled(1, compiler);
    });
    it('range to map from length 0', () => {
      const model = {
        result: chain(root.get('len'))
          .range()
          .map(item => item.plus(root.get('base')).call('tap')),
        set: setter('len')
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = {len: 0, base: 2};
      const inst = optModel(initialData, funcLibrary);
      expect(inst.result).toEqual([]);
      expectTapFunctionToHaveBeenCalled(0, compiler);
      inst.set(1);
      expect(inst.result).toEqual([2]);
      expectTapFunctionToHaveBeenCalled(1, compiler);
    });
    it('flatten thats not deep', () => {
      const model = {
        result: root.flatten().map((v) => v),
        set: setter(arg0)
      }
      const optModel = evalOrLoad(compile(model, {compiler}))
      const initialData = [[1], [3], [4, [5]]]
      const inst = optModel(initialData, funcLibrary)
      expect(inst.result).toEqual([1, 3, 4, [5]])
      inst.set(0, [2])
      expect(inst.result).toEqual([2, 3, 4, [5]])
    })
    it('flatten thats not deep with objects', () => {
      const model = {
        result: root.flatten().map((v) => v),
        set: setter(arg0)
      }
      const optModel = evalOrLoad(compile(model, {compiler}))
      const initialData = [[{a: 1}], [{a: 3}], [{a: 4}]]
      const inst = optModel(initialData, funcLibrary)
      expect(inst.result).toEqual([{a: 1}, {a: 3}, {a: 4}])
    })
    it('flatten array changes length', () => {
      const model = {
        clean: root.get('target'),
        data: root.get('target').map(v => v),
        result: root.get('target').map(v => v).flatten(),
        result2: root.get('target').flatten(),
        splice: splice('target')
      }
      const optModel = evalOrLoad(compile(model, {compiler}))
      const initialData = {target: [[1], [2], [3], [4]]}
      const inst = optModel(initialData, funcLibrary)
      expect(inst.result).toEqual([1, 2, 3, 4])
      inst.splice(0, 2, [6], [6], [6])
      expect(inst.data).toEqual([[6], [6], [6], [3], [4]], 'sanity')
      expect(inst.result).toEqual([6, 6, 6, 3, 4])
      inst.splice(0, 3, [67, 67])
      expect(inst.data).toEqual([[67, 67], [3], [4]], 'sanity')
      expect(inst.result).toEqual([67, 67, 3, 4])
      expect(inst.result2).toEqual([67, 67, 3, 4])
      inst.splice(0, 1, [68, 68])
      expect(inst.data).toEqual([[68, 68], [3], [4]], 'sanity')
      expect(inst.result).toEqual([68, 68, 3, 4])
      expect(inst.result2).toEqual([68, 68, 3, 4])
    })
    it('flatten root.array changes length', () => {
      const model = {
        clean: root,
        data: root.map(v => v),
        result: root.map(v => v).flatten(),
        result2: root.flatten(),
        splice: splice()
      }
      const optModel = evalOrLoad(compile(model, {compiler}))
      const initialData = [[1], [2], [3], [4]]
      const inst = optModel(initialData, funcLibrary)
      expect(inst.result).toEqual([1, 2, 3, 4])
      inst.splice(0, 2, [6], [6], [6])
      expect(inst.data).toEqual([[6], [6], [6], [3], [4]], 'sanity')
      expect(inst.result).toEqual([6, 6, 6, 3, 4])
      inst.splice(0, 3, [67, 67])
      expect(inst.data).toEqual([[67, 67], [3], [4]], 'sanity')
      expect(inst.result).toEqual([67, 67, 3, 4])
      expect(inst.result2).toEqual([67, 67, 3, 4])
      inst.splice(0, 1, [68, 68])
      expect(inst.data).toEqual([[68, 68], [3], [4]], 'sanity')
      expect(inst.result).toEqual([68, 68, 3, 4])
      expect(inst.result2).toEqual([68, 68, 3, 4])
    })
    it('flatten with two empty arrays', () => {
       const model = {
        clean: root.get('target'),
        data: root.get('target').map(v => v),
        result: root.get('target').map(v => v).flatten(),
        result2: root.get('target').flatten(),
        splice: splice('target')
      }
      const optModel = evalOrLoad(compile(model, {compiler}))
      const initialData = {target: [[], []]}
      const inst = optModel(initialData, funcLibrary)
      expect(inst.result).toEqual([])
      inst.splice(0, 0, [], [], [])
      expect(inst.result).toEqual([])
      inst.splice(2, 0, [1])
      expect(inst.result).toEqual([1])
    })
    it('flatten with adding empty array', () => {
       const model = {
        clean: root.get('target'),
        data: root.get('target').map(v => v),
        result: root.get('target').map(v => v).flatten(),
        result2: root.get('target').flatten(),
        splice: splice('target')
      }
      const optModel = evalOrLoad(compile(model, {compiler}))
      const initialData = {target: [[1], [2], [3], [4]]}
      const inst = optModel(initialData, funcLibrary)
      expect(inst.result).toEqual([1, 2, 3, 4])
      inst.splice(0, 2, [], [], [])
      expect(inst.result).toEqual([3, 4])
      inst.splice(0, 0, [], [6], [])
      expect(inst.result).toEqual([6, 3, 4])
    })
    it('flatten with empty array', () => {
      const model = {
        result: root.flatten(),
        set: setter(arg0)
      };
      const optModel = evalOrLoad(compile(model, {compiler}))
      const initialData = []
      const inst = optModel(initialData, funcLibrary)
      expect(inst.result).toEqual([])
    })
    it('sum', () => {
      const model = {
        result: root.sum(),
        set: setter(arg0)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = [1, 3, 5];
      const inst = optModel(initialData, funcLibrary);
      expect(inst.result).toEqual(9);
      inst.set(2, 1);
      inst.set(0, 5);
      expect(inst.result).toEqual(9);
    });
    it('sum with empty array', () => {
      const model = {
        result: root.sum(),
        set: setter(arg0)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = [];
      const inst = optModel(initialData, funcLibrary);
      expect(inst.result).toEqual(0);
    });
    it('sum with array that changes length', () => {
      const model = {
        result: root.sum(),
        splice: splice(),
        set: setter(arg0)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = [1, 2, 3, 4];
      const inst = optModel(initialData, funcLibrary);
      expect(inst.result).toEqual(10);
      inst.splice(0, 1)
      expect(inst.result).toEqual(9);
      inst.splice(0, 0, 6)
      expect(inst.result).toEqual(15)
    });
    it('concat', () => {
      const model = {
        result: root.get('a').concat(root.get('b')),
        set: setter('a', arg0)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = {a: [1, 3, 5], b: [2, 6]};
      const inst = optModel(initialData, funcLibrary);
      expect(inst.result).toEqual([1, 3, 5, 2, 6]);
      inst.set(2, 1);
      expect(inst.result).toEqual([1, 3, 1, 2, 6]);
    });
    it('concat with empty array', () => {
      const model = {
        result: root.get('a').concat(root.get('b')),
        set: setter('a', arg0)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = {a: [1, 3, 5], b: []};
      const inst = optModel(initialData, funcLibrary);
      expect(inst.result).toEqual([1, 3, 5]);
      inst.set(2, 1);
      expect(inst.result).toEqual([1, 3, 1]);
    });

    it('concat with empty array', () => {
      const model = {
        result: root.get('b').concat(root.get('a')),
        set: setter('a', arg0)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = {a: [1, 3, 5], b: []};
      const inst = optModel(initialData, funcLibrary);
      expect(inst.result).toEqual([1, 3, 5]);
    });
    it('append with primitive', () => {
      const initialData = ['a', 'b', 'c'];
      const model = {
        result: root.append('d')
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const inst = optModel(initialData);
      expect(inst.result).toEqual(['a', 'b', 'c', 'd']);
    });
    it('append with array', () => {
      const initialData = ['a', 'b', 'c'];
      const model = {
        result: root.append(['d'])
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const inst = optModel(initialData);
      expect(inst.result).toEqual(['a', 'b', 'c', ['d']]);
    });
    describe('includes', () => {
      it('should return true if includes value', () => {
        const initialData = {data: [1, 2, 3]};
        const value = 1
        const model = {
          includes: root.get('data').includes(value)
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.includes).toEqual(_.includes(initialData.data, value));
      });
      it('should return false if not includes value', () => {
        const initialData = {data: [1, 2, 3]};
        const value = 4
        const model = {
          includes: root.get('data').includes(value)
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.includes).toEqual(_.includes(initialData.data, value));
      });
    })
    describe('findIndex', () => {
      it('should return right index by predicate', () => {
        const initialData = {data: [{id: 1}, {id: 2}, {id: 3}]};
        const findId = 2;
        const model = {
          findIndex: root.get('data').findIndex(item => item.get('id').eq(findId))
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.findIndex).toEqual(1);
      });
      it('should support findding the first element', () => {
        const initialData = {data: [{id: 1}, {id: 2}, {id: 3}]};
        const findId = 1;
        const model = {
          findIndex: root.get('data').findIndex(item => item.get('id').eq(findId))
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.findIndex).toEqual(0);
      });

      it('should return -1 if not found', () => {
        const initialData = {data: [{id: 1}, {id: 2}, {id: 3}]};
        const findId = 4;
        const model = {
          findIndex: root.get('data').findIndex(item => item.get('id').eq(findId))
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.findIndex).toEqual(-1);
      });
    })
    it('branching - soft tracking', () => {
      const valuesInArrays = root.map(item => or(item.get('arr'), [item.get('val')]));
      const indexes = root.map((item, idx) => idx);
      const model = {
        result: indexes.map(idx => valuesInArrays.get(idx).get(0)),
        set: setter(arg0)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = [{arr: [1]}, {val: 2}, {arr: [3]}];
      const inst = optModel(initialData);
      expect(inst.result).toEqual([1, 2, 3]);
      inst.set(0, {val: 4});
      expect(inst.result).toEqual([4, 2, 3]);
      inst.set(1, {arr: [5]});
      expect(inst.result).toEqual([4, 5, 3]);
    });
    it('test binding', () => {
      const model = {
        doubleFunctions: root.map(item => bind('double', item)).map(item => item.call('tap')),
        multFunctions: root.map(item => bind('mult', item)).map(item => item.call('tap')),
        updateFunctions: root.map((item, key) => bind('updateSelf', key, item.mult(2))).map(item => item.call('tap')),
        set: setter(arg0)
      };
      const initialData = [3, 4];
      const optModel = evalOrLoad(compile(model, {compiler}));
      const extraFn = {
        double: x => x * 2,
        mult: (x, y) => x * y,
        updateSelf(index, val) {
          this.set(index, val);
        }
      };
      const inst = optModel(initialData, {...extraFn, ...funcLibrary});
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
    it('test reverse', () => {
      const model = {
        numbers: root.reverse()
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = [1, 2, 3, 4, 5];

      const inst = optModel(initialData);
      expect(inst.numbers).toEqual(initialData.reverse());
    });

    it('test reverse inside map', () => {
      const model = {
        numbers: root.map(arr => arr.reverse())
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = [[1, 2, 3], [4, 5, 6]]

      const inst = optModel(initialData);
      expect(inst.numbers).toEqual(initialData.map(data => data.reverse()));
    });

    describe('isEmpty', () => {
      it('should return true for empty array', () => {
        const initialData = {data: []}
        const model = {
          isEmpty: root.get('data').isEmpty()
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.isEmpty).toEqual(true);
      });

      it('should return false for non empty array', () => {
        const initialData = {data: [1]}
        const model = {
          isEmpty: root.get('data').isEmpty()
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.isEmpty).toEqual(false);
      });
    })

    describe('intersection', () => {
      it('should return an array of unique values that are included in given arrays', () => {
        const initialData = {a: ['a', 'b', 'c', 'd'], b: ['b', 'd']}
        const model = {
          result: root.get('a').intersection(root.get('b'))
        };
        const optModel = evalOrLoad(compile(model, {compiler}));
        const inst = optModel(initialData, funcLibrary);
        expect(inst.result).toEqual(['b', 'd']);
      })
    })

    describe('uniq', () => {
      it('should return a duplicate-free version of an array', () => {
        const initialData = {a: ['a', 'a', 'b', 'c', 'c', 'c']}
        const model = {
          result: root.get('a').uniq()
        };
        const optModel = evalOrLoad(compile(model, {compiler}));
        const inst = optModel(initialData, funcLibrary);
        expect(inst.result).toEqual(['a', 'b', 'c']);
      })
    })

    it('test head', () => {
      const model = {
        first: root.head()
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = ['a', 2, 3, 4, 5];

      const inst = optModel(initialData);
      expect(inst.first).toEqual(initialData[0]);
    });
    it('test last', () => {
      const model = {
        last: root.last()
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = [1, 2, 3, 4, 5];

      const inst = optModel(initialData);
      expect(inst.last).toEqual(initialData[initialData.length - 1]);
    });
    it('test compact', () => {
      const initialData = {data: [null, 1, '', false, 'test']};
      const model = {
        compact: root.get('data').compact()
      };
      const optModel = evalOrLoad(compile(model, {compiler}));

      const inst = optModel(initialData);
      expect(inst.compact).toEqual(_.compact(initialData.data));
    });
    it('join', () => {
      const model = {
        joinWithDelimiter: root.join(' '),
        joinNoDelimiter: root.join(),
        joinEmptyStringDelimiter: root.join('')
      }
      const code = compile(model, {compiler});
      const optModel = evalOrLoad(code);
      const initialData = ['join', 'succeeded'];

      const inst = optModel(initialData);
      expect(inst.joinWithDelimiter).toEqual('join succeeded');
      expect(inst.joinNoDelimiter).toEqual('join,succeeded');
      expect(inst.joinEmptyStringDelimiter).toEqual('joinsucceeded');
  })

    describe('every', () => {
      it('should return true if predicate returns truthy for all elements in the array', () => {
        const initialData = {data: [1, 1, 1]};
        const model = {
          every: root.get('data').every(item => item.eq(1))
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.every).toBe(true);
      });

      it('should return false if predicate does not return truthy for all elements in the array', () => {
        const initialData = {data: [1, 2, 1]};
        const model = {
          every: root.get('data').every(item => item.eq(1))
        };
        const optModel = evalOrLoad(compile(model, {compiler}));

        const inst = optModel(initialData);
        expect(inst.every).toBe(false);
      });
    });
    describe('isArray tests', () => {
      it('should return true if is array', () => {
        const model = {
          isArray: root.isArray()
        };
        const optModel = evalOrLoad(compile(model, {compiler}));
        const initialData = [1, 2, 3];

        const inst = optModel(initialData);
        expect(inst.isArray).toEqual(true);
      });
      it('should return false if not array', () => {
        const model = {
          isArray: root.isArray()
        };
        const optModel = evalOrLoad(compile(model, {compiler}));
        const initialData = 5;

        const inst = optModel(initialData);
        expect(inst.isArray).toEqual(false);
      });
    });
    describe('test rewrite local functions', () => {
      it('should hoist the reused function', () => {
        const add10 = src => new Array(10).fill().reduce(v => v.plus(1), src)
        const model = {
          add30: root.map(val => add10(val).plus(add10(val)).plus(add10(val)))
        };
        const src = compile(model, {compiler, prettier: true})
        if (typeof src === 'string') {
          expect(src.split(' + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1').length - 1).toEqual(1)
        }
        const optModel = evalOrLoad(src);
        const initialData = [1, 2, 3];

        const inst = optModel(initialData);
        expect(inst.add30).toEqual([33, 36, 39]);
      })
    })
  });
});
