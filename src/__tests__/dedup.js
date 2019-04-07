const {compile, and, or, root, arg0, arg1, setter, splice, bind, chain} = require('../../index');
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
    it('test compact', async () => {
      const initialData = {aaa: 2, bbb: 3, ccc: 1, ddd: 5, eee: 6};
      const model = {
        res: root.mapValues((val, key) => or(
          and(key.eq('aaa'), val.mult(2)),
          and(key.eq('bbb'), val.mult(2)),
          and(key.eq('ccc'), val.mult(3)),
          and(key.eq('ddd'), val.mult(3)),
          val.mult(4),
        ))
          .filterBy(x => x.gt(5))
      };
      const optModel = eval(await compile(model, {compiler}));

      const inst = optModel(initialData);

      const expected = {bbb: 6, ddd: 15, eee: 24}
      expect(inst.res).toEqual(expected);
    })
  });
});
