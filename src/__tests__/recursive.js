const { compile, and, or, root, arg0, setter, splice } = require('../../index');
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
    it('simple sum', async () => {
      const model = {
        sum: root.recursiveMap((loop, val, key) =>
          key
            .gt(0)
            .ternary(val.plus(key.minus(1).recur(loop)), val)
            .call('tap', key)
        ),
        set: setter(arg0)
      };
      const optModel = eval(await compile(model, { compiler }));
      const inst = optModel([1, 2, 3, 4, 5], funcLibrary);
      expectTapFunctionToHaveBeenCalled(5, compiler);
      expect(inst.sum).toEqual([1, 3, 6, 10, 15]);
      inst.set(2, 13);
      expectTapFunctionToHaveBeenCalled(3, compiler);
      expect(inst.sum).toEqual([1, 3, 16, 20, 25]);
    });
    it('chains', async () => {
      const model = {
        chain: root.recursiveMap((loop, val, key) =>
          val
            .gte(0)
            .ternary(val.recur(loop), val)
            .call('tap', key)
        ),
        set: setter(arg0)
      };
      const optModel = eval(await compile(model, { compiler }));
      const initialData = [1, 2, 3, -1, -2, 4];
      const inst = optModel(initialData, funcLibrary);
      expect(inst.chain).toEqual([-1, -1, -1, -1, -2, -2]);
      expectTapFunctionToHaveBeenCalled(6, compiler);
      inst.set(2, 5);
      expectTapFunctionToHaveBeenCalled(3, compiler);
      expect(inst.chain).toEqual([-2, -2, -2, -1, -2, -2]);
    });
    it('recursiveMapValues', async () => {
      const model = {
        allDone: root.recursiveMapValues((loop, todo, idx) =>
          and(
            todo.get('done'),
            todo
              .get('subTasks')
              .any((idx, _, context) => idx.recur(context).not(), loop)
              .not()
          ).call('tap')
        ),
        setDone: setter(arg0, 'done'),
        spliceBlockedBy: splice(arg0, 'subTasks')
      };
      const optModel = eval(await compile(model, { compiler }));
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
    describe('tree', () => {
      it('basic', async() => {
        const model = {
          visibleOnly: root.get('menu').tree(
            (traverseContext, value) => 
              value.mapValues((value, key, traverseContext) => 
                key.eq('items').ternary(value.map((subItem, key, traverseContext) => subItem.traverse(traverseContext), traverseContext).filter(item => item.get('state').eq('visible')), value), traverseContext)
              ).tree((traverseContext, value) =>
                value.filterBy((val, key, traverseContext) => key.eq('state').not()).mapValues((subItem, key, traverseContext) => 
                  key.eq('items').ternary(subItem.map((subItem, key, traverseContext) => subItem.traverse(traverseContext), traverseContext), subItem), traverseContext)),
          update: setter('menu', 'items', arg0, 'state')
        }

        const initialData = {
          menu: {
            name: 'something',
            state: 'visible',
            items: [
              {
                name: 'abc',
                state: 'visible',              
                items: [
                  {
                    name: 'def',
                    items: []
                  },
                  {
                    name: 'zee',
                    state: 'visible',
                    items: []
                  }
                ]
              },
              {
                name: 'ghi'
              }
            ]
          }
        }
      const code = await compile(model, { compiler })
      const optModel = eval(code);
      const inst = optModel(initialData, funcLibrary);
      expect(inst.visibleOnly).toEqual({name: 'something', items: [{name: 'abc', items: [{name: 'zee', items: []}]}]});
      inst.update(1, 'visible');
      expect(inst.visibleOnly).toEqual({name: 'something', items: [{name: 'abc', items: [{name: 'zee', items: []}]}, {name: 'ghi'}]});

      })
      it('implicit dependencies', async() => {
        const model = {
          treeState: root.get('menu').tree((traverse, value) =>
                value.mapValues((subItem, key, context) => 
                  key.eq('items').ternary(subItem.map((subItem, key, traverseContext) => subItem.traverse(traverseContext), context.get('traverse')), 
                  key.eq('state').ternary(root.get('statePerItem').get(context.get('name')), subItem)), {traverse, name: value.get('name')})
                  .filterBy(value => value)),
          update: setter('statePerItem', arg0)
        }

        const initialData = {
          statePerItem: {abc: 'initial'},
          menu: {
            name: 'something',
            state: 'visible',
            items: [
              {
                name: 'abc',
                state: 'visible',              
                items: [
                  {
                    name: 'def',
                    items: []
                  },
                  {
                    name: 'zee',
                    state: 'visible',
                    items: []
                  }
                ]
              },
              {
                name: 'ghi'
              }
            ]
          }
        }
      const code = await compile(model, { compiler })
      const optModel = eval(code);
      const inst = optModel(initialData, funcLibrary);
      expect(inst.treeState).toEqual({
        name: 'something',
        items: [
          {
            name: 'abc',
            state: 'initial',
            items: [
              {
                name: 'def',
                items: []
              },
              {
                name: 'zee',
                items: []
              }
            ]
          },
          {
            name: 'ghi'
          }
        ]
      });
      inst.update('zee', 'state3');
      expect(inst.treeState).toEqual(({
        name: 'something',
        items: [
          {
            name: 'abc',
            state: 'initial',  
            items: [
              {
                name: 'def',
                items: []
              },
              {
                name: 'zee',
                state: 'state3',
                items: []
              }
            ]
          },
          {
            name: 'ghi'
          }
        ]
      }))

      })
    })
  });
});
