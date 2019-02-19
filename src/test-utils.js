const rand = require('random-seed').create();
const defaultSeed = 'CARMI';

function currentValues(inst) {
  if (typeof inst !== 'object' || inst === null) {
    return inst;
  }
  if (Array.isArray(inst)) {
    return inst.map(currentValues);
  }
  return Object.keys(inst)
    .sort()
    .filter(k => typeof inst[k] !== 'function' && k.indexOf('$') !== 0)
    .reduce((acc, k) => {
      acc[k] = currentValues(inst[k]);
      return acc;
    }, {});
}

const funcLibrary = {
  tap: x => x
};

function expectTapFunctionToHaveBeenCalled(n, compiler) {
  if (typeof compiler === 'string' && compiler === 'optimizing') {
    expect(funcLibrary.tap.mock.calls.length).toEqual(n);
  }
  funcLibrary.tap.mockClear();
}

beforeEach(() => {
  rand.seed(defaultSeed);
  jest.spyOn(funcLibrary, 'tap');
});

afterEach(() => {
  jest.clearAllMocks();
});

function describeCompilers(compilers, tests) {
  compilers.forEach(compiler => {
    describe(`compiler:${compiler}`, () => tests(compiler));
  });
}

module.exports = {currentValues, expectTapFunctionToHaveBeenCalled, funcLibrary, describeCompilers, rand};
