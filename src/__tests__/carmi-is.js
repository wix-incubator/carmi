const { setter, splice, isExpression, isSetterExpression, isSpliceExpression, root } = require('../../index');
const _ = require('lodash');

describe('carmi-is', () => {
  describe('SetterExpression', function() {
    it('should return true if it is a setterExpression', async () => {
      const set = setter('path');
      expect(isSetterExpression(set)).toBe(true);
    });

    it('should return false if it is not a setterExpression', async () => {
      const transformFunc = root.get('something');
      expect(isSetterExpression(transformFunc)).toBe(false);
    });
  });

  describe('SpliceExpression', function() {
    it('should return true if it is a spliceExpression', async () => {
      const splicer = splice('path');
      expect(isSpliceExpression(splicer)).toBe(true);
    });

    it('should return false if it is not a spliceExpression', async () => {
      const transformFunc = root.get('something');
      expect(isSpliceExpression(transformFunc)).toBe(false);
    });
  });

  describe('Expression', function() {
    it('should return true if it is an expression', async () => {
      const expression = root.get('path');
      expect(isExpression(expression)).toBe(true);
    });

    it('should return false if it is not an expression', async () => {
      const set = setter('path');
      expect(isExpression(set)).toBe(false);
    });
  });
});

