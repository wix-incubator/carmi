const {compile, root} = require('../../index');

const {
  describeCompilers,
  evalOrLoad} = require('../test-utils');
const {destruct} = require('../utils/destruct');

describe('testing destruct', () => {
  describeCompilers(['simple', 'optimizing', 'bytecode'], compiler => {
    it('destruct object', () => {
      const {a, b} = destruct(root.get('obj'))
      const model = {
        sum: a.plus(b)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = {
        obj: {
          a: 1, b: 2
        }
      };

      const inst = optModel(initialData);
      expect(inst.sum).toEqual(3);
    })

    it('destruct object', () => {
      const [, a, b] = destruct(root.get('array'))
      const model = {
        sum: a.plus(b)
      };
      const optModel = evalOrLoad(compile(model, {compiler}));
      const initialData = {
        array: [1, 2, 3]
      };

      const inst = optModel(initialData);
      expect(inst.sum).toEqual(5);
    })
  });
});
