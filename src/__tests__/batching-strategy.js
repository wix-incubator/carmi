const {compile, root, setter, bind} = require('../../index')
const {evalOrLoad} = require('../test-utils');

describe('empty batching strategy', () => {
  const emptyBatchingStrategy = function () { // eslint-disable-line func-style
    this.$endBatch()
  }

  it('should behave as if there is no batching at all', () => {
    const carmiModelFactory = evalOrLoad(compile({
      counter: root.get('model').get('counter'),
      setCounter: setter('model', 'counter'),
      incrementCounter: bind('incrementCounter', bind('setCounter'), root.get('model').get('counter'))
    }, true))

    const carmiInstance = carmiModelFactory(
      {model: {counter: 1}},
      {
        incrementCounter: (setCounter, originalCounter) => {
          setCounter(originalCounter + 1)
        }
      },
      emptyBatchingStrategy)

    carmiInstance.incrementCounter()
    carmiInstance.incrementCounter()

    expect(carmiInstance.counter).toBe(3)
  })
})
