const { root, compile } = require('../../index');
const { describeCompilers } = require('../test-utils');

describe('trace', () => {

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('conditionalTrace', () => {
    describeCompilers(['simple', 'optimizing'], compiler => {
      it('should trace if the condition is met', () => {
        jest.spyOn(console, 'log').mockReturnValue(undefined)

        const model = {
          result: root.get('a').conditionalTrace(root.get('a'))
        };

        const optModel = eval(compile(model, { compiler }));
        const initialData = {
          a: true
        };

        const result = optModel(initialData);
        expect(result).toHaveProperty('result', true)
        expect(console.log).toHaveBeenCalled();
      })

      it('should not trace if the condition is not met', () => {
        jest.spyOn(console, 'log').mockReturnValue(undefined)

        const model = {
          result: root.get('a').conditionalTrace(root.get('a'))
        };

        const optModel = eval(compile(model, { compiler }));
        const initialData = {
          a: false
        };

        const result = optModel(initialData);
        expect(result).toHaveProperty('result', false)
        expect(console.log).not.toHaveBeenCalled();
      })
    })
  })

  describe('tapTrace', () => {
    describeCompilers(['simple', 'optimizing'], compiler => {
      it('should trace the result of the tap function', () => {
        jest.spyOn(console, 'log').mockReturnValue(undefined)

        const model = {
          result: root.get('a').tapTrace(x => x.plus(2))
        };

        const optModel = eval(compile(model, { compiler }));
        const initialData = {
          a: 1
        };

        const result = optModel(initialData);
        expect(result).toHaveProperty('result', 1)
        expect(console.log).toHaveBeenCalledWith({ source: expect.any(String), token: 'plus', value: 3 });
      })
    })
  })

})
