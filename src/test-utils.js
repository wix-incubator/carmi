const rand = require('random-seed').create();
const defaultSeed = 'CARMI';
const loadBytecode = require('../bytecode/carmi-instance');

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
  tap: x => x,
  invoke: (fn, ...args) => fn && fn(...args)
};

function expectTapFunctionToHaveBeenCalled(n, compiler) {
  if (typeof compiler === 'string' && (compiler === 'optimizing' || compiler === 'bytecode')) {
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
  // compilers = compilers.filter(t => t !== 'bytecode')
  compilers.forEach(compiler => {
    describe(`compiler:${compiler}`, () => tests(compiler));
  });
}

function evalOrLoad(src) {
  if (typeof src === 'string') {
    try {
      // eslint-disable-next-line no-eval
      return eval(src);
    } catch (e) {
      require('fs').writeFileSync('./tmp.js', src);
      throw e;
    }
  }
  return loadBytecode(src.buffer);
}

module.exports = {currentValues, expectTapFunctionToHaveBeenCalled, funcLibrary, describeCompilers, rand, evalOrLoad};
