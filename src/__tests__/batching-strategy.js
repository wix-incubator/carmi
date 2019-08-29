const {compile, root, setter, bind, arg0} = require('../../index');
const {evalOrLoad, funcLibrary} = require('../test-utils');

describe('batching', () => {
  describe('re-entrant runInBatch', () => {
    it('should work', () => {
      const modelFactory = evalOrLoad(compile({
        sum: root.get('items').sum().call('updateTotal', bind('setTotal')),
        total: root.get('total').call('tap'),
        setTotal: setter('total'),
        updateItems: setter('items', arg0)
      }, {compiler: 'optimizing'}))
      function updateTotal(newTotal, setTotal) {// eslint-disable-line func-style
        this.$runInBatch(() => {
          setTotal(newTotal)
        })
      }
      const inst = modelFactory({items: [1, 2, 3]}, {...funcLibrary, updateTotal});
      expect(inst.total).toEqual(6);
      expect(inst.$model.total).toEqual(6);
      inst.$runInBatch(() => {
        inst.updateItems(3, 4);
      })
    })
  })
  describe('empty batching strategy', () => {
    const emptyBatchingStrategy = function () { // eslint-disable-line func-style
      this.$endBatch();
    };

    it('should behave as if there is no batching at all', () => {
      const carmiModelFactory = evalOrLoad(
        compile(
          {
            counter: root.get('model').get('counter'),
            setCounter: setter('model', 'counter'),
            incrementCounter: bind('incrementCounter', bind('setCounter'), root.get('model').get('counter'))
          },
          true
        )
      );

      const carmiInstance = carmiModelFactory(
        {model: {counter: 1}},
        {
          incrementCounter: (setCounter, originalCounter) => {
            setCounter(originalCounter + 1);
          }
        },
        emptyBatchingStrategy
      );

      carmiInstance.incrementCounter();
      carmiInstance.incrementCounter();

      expect(carmiInstance.counter).toBe(3);
    });
  });
});
