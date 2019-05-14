const {setter, splice, isExpression, isSetterExpression, isSpliceExpression, root} = require('../../index');
const _ = require('lodash');

describe('carmi-is', () => {
  describe('SetterExpression', () => {
    it('should return true if it is a setterExpression', () => {
      const set = setter('path');
      expect(isSetterExpression(set)).toBe(true);
    });

    it('should return false if it is not a setterExpression', () => {
      const transformFunc = root.get('something');
      expect(isSetterExpression(transformFunc)).toBe(false);
    });
  });

  describe('SpliceExpression', () => {
    it('should return true if it is a spliceExpression', () => {
      const splicer = splice('path');
      expect(isSpliceExpression(splicer)).toBe(true);
    });

    it('should return false if it is not a spliceExpression', () => {
      const transformFunc = root.get('something');
      expect(isSpliceExpression(transformFunc)).toBe(false);
    });
  });

  describe('Expression', () => {
    it('should return true if it is an expression', () => {
      const expression = root.get('path');
      expect(isExpression(expression)).toBe(true);
    });

    it('should return false if it is not an expression', () => {
      const set = setter('path');
      expect(isExpression(set)).toBe(false);
    });
  });
});

