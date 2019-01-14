const { root, compile } = require('../../index');
const { describeCompilers } = require('../test-utils');

describe('switch', () => {
  describeCompilers(['simple', 'optimizing'], compiler => {
    it('should return the result of the matching case tuple', () => {
      const model = {
        result: root.get('a').switch([
          [1, 'One'],
          [2, 'Two'],
          [3, 'Three']
        ])
      };

      const optModel = eval(compile(model, { compiler }));
      const initialData = {
        a: 2
      };

      const inst = optModel(initialData);
      expect(inst.result).toEqual('Two');
    })

    it('should return the default result if no case matches', () => {
      const model = {
        result: root.get('a').switch([
          [1, 'One'],
          [2, 'Two'],
          [3, 'Three']
        ], 'Oops')
      };

      const optModel = eval(compile(model, { compiler }));
      const initialData = {
        a: 4
      };

      const inst = optModel(initialData);
      expect(inst.result).toEqual('Oops');
    })
  })
})
