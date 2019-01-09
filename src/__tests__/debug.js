const { compile, chain, root, arg0, arg1, setter, splice, withName } = require('../../index');
const {
  describeCompilers,
  currentValues,
  funcLibrary,
  expectTapFunctionToHaveBeenCalled,
  rand
} = require('../test-utils');
const _ = require('lodash');

describe('Tests for usability and debugging carmi', () => {
  describeCompilers(['simple', 'optimizing'], compiler => {
    it('should store source files and ast in debug mode', async () => {
      const makeSureThisCanBeFound = root.map(item => item.mult(2));
      const res = makeSureThisCanBeFound.map(item => item.plus(80));
      const model = { res, set: setter(arg0) }
      const optCode = eval(compile(model, { compiler, debug: true }));
      const inst = optCode([1, 2, 3], funcLibrary);
      expect(inst.res).toEqual([82, 84, 86]);
      const sources = JSON.stringify(inst.$source());
      const ast = JSON.stringify(inst.$ast());
      // expect(sources.indexOf('makeSureThisCanBeFound')).toBeGreaterThan(-1)
      expect(ast.indexOf('80')).toBeGreaterThan(-1)
    });
    it('withName', async () => {
      const negated = withName('negated', root.map(val => val.not()));
      const model = { doubleNegated: negated.map(val => val.not().call('tap')), set: setter(arg0) };
      const optCode = eval(compile(model, { compiler }));
      const inst = optCode([true, 1, 0, false, null], funcLibrary);
      expect(inst.doubleNegated).toEqual([true, true, false, false, false]);
      expectTapFunctionToHaveBeenCalled(inst.$model.length, compiler);
      inst.set(1, null);
      const nameGiven = Object.keys(inst).find(k => k.indexOf('negated') !== -1);
      expect(nameGiven).toContain('negated');
      expect(inst.doubleNegated).toEqual([true, false, false, false, false]);
      expectTapFunctionToHaveBeenCalled(1, compiler);
    });
    it('chain should work in loop and on primitives', async () => {
      const model = {
        test1: chain({test: true}),
        test2: chain({test: chain(true)}),
        test3: chain({test: chain(true).not()})
      }
      const optCode = eval(compile(model, { compiler }));
      const inst = optCode([], funcLibrary);
      expect(inst.test1).toEqual({test:true});
      expect(inst.test2).toEqual({test:true});
      expect(inst.test3).toEqual({test:false});
    });
    it('throw on invalid arguments in setter function', async () => {
      const args = ['store', arg0, true]
      expect(() => setter(...args)).toThrowError(`Invalid arguments for setter/splice - can only accept path (use arg0/arg1/arg2 - to define placeholders in the path), received [${args}]`);
    });
    it('throw on invalid arguments in splice function', async () => {
      const args = ['store', arg0, true]
      expect(() => splice(...args)).toThrowError(`Invalid arguments for setter/splice - can only accept path (use arg0/arg1/arg2 - to define placeholders in the path), received [${args}]`);
    });
    it('throw on invalids reuse of key/val/loop/context inside other functions', () => {
      expect(() => {
        root.map(item => item.map(child => child.eq(item)))
      }).toThrowError();
      expect(() => {
        root.map((item, val) => item.map(child => child.eq(val)))
      }).toThrowError();
      expect(() => {
        root.map((item, val, context) => item.map(child => child.eq(context)), root.get(1))
      }).toThrowError();
    })
    it('expect to hoist shared expressions', async () => {
      const once = root.map(val => val.call('tap'));
      const twice = root.map(val => val.call('tap')).filter(val => val);
      const model = { once, twice, set: setter(arg0) };
      const optCode = eval(compile(model, { compiler }));
      const inst = optCode([false, 1, 0], funcLibrary);
      expect(inst.once).toEqual([false, 1, 0]);
      expect(inst.twice).toEqual([1]);
      expectTapFunctionToHaveBeenCalled(inst.$model.length, compiler);
      inst.set(2, true);
      expect(inst.once).toEqual([false, 1, true]);
      expect(inst.twice).toEqual([1, true]);
      expectTapFunctionToHaveBeenCalled(1, compiler);
    })
    it('passing item between functions should throw nicer error message', async () => {
      let e = null
      try {
        root.mapValues(item =>
          root.filterBy(innerItem => innerItem.eq(item))
        )
      } catch (err) {
        e = err
      }
      expect(e.message).toContain('eq')
      expect(e.message).toContain('filterBy')
    });
    
    it('allow primitives on the model', async () => {
      const model = {three: chain(3)}
      const optCode = eval(compile(model, { compiler }));
      const inst = optCode([], funcLibrary);
      expect(inst.three).toEqual(3);
    })
  });
});
