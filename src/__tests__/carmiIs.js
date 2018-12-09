const { setter, splice, isSetterExpression, isSpliceExpression, root } = require('../../index');
const _ = require('lodash');

describe('carmi is', () => {
  it('should return true if it is a setterExpression', async () => {
    const set = setter('path');
    expect(isSetterExpression(set)).toBe(true);
  });

  it('should return false if it is not a setterExpression', async () => {
    const transformFunc = root.get('something');
    expect(isSetterExpression(transformFunc)).toBe(false);
  });

  it('should return true if it is a spliceExpression', async () => {
    const splicer = splice('path');
    expect(isSpliceExpression(splicer)).toBe(true);
  });

  it('should return false if it is not a spliceExpression', async () => {
    const transformFunc = root.get('something');
    expect(isSpliceExpression(transformFunc)).toBe(false);
  });
});

