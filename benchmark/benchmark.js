const carmi = require('../index');
const path = require('path');
const { fork } = require('child_process');
const tests = ['todos'];

const runTypesParams = {
  justInit: [10000, 0, 0],
  batched: [10000, 2500, 10],
  nonBatched: [10000, 250, 0]
};
const runTypes = {
  simple: ['justInit', 'batched', 'nonBatched'],
  mobx: ['justInit', 'batched', 'nonBatched'],
  carmi: ['justInit', 'batched', 'nonBatched']
};
const runsCount = 10;

function resolveTestName(testname, type) {
  if (type === 'mobx') {
    return `./${testname}.mobx`;
  } else {
    return path.resolve(__dirname, 'generated', `${testname}.${type}`);
  }
}

async function precompileModel(testname, type) {
  const model = require(path.resolve(__dirname, `${testname}.carmi`));
  await carmi.compile(model, {
    output: resolveTestName(testname, type) + '.js',
    compiler: type,
    format: 'cjs',
    name: testname,
    minify: false
  });
}

function runSingleTest(testname, model, count, changes, batch) {
  return new Promise(resolve => {
    const child = fork(path.resolve(__dirname, './single-benchmark'), [testname, model, count, changes, batch]);
    let results = null;
    child.on('message', msg => (results = msg));
    child.on('close', () => resolve(results));
  });
}

async function runBenchmarks(testname) {
  await precompileModel(testname, 'carmi');
  await precompileModel(testname, 'simple');
  const results = [];
  for (let runIndex = 0; runIndex < runsCount; runIndex++) {
    for (let type of ['simple', 'carmi', 'mobx']) {
      for (let run of runTypes[type]) {
        const vals = await runSingleTest(testname, resolveTestName(testname, type), ...runTypesParams[run]);
        results.push(Object.assign({ type, run }, vals));
      }
    }
  }
  return results;
}

async function runAllBenchmarks() {
  const results = {};
  for (let testname of tests) {
    results[testname] = await runBenchmarks(testname);
  }
  require('fs').writeFileSync(path.resolve(__dirname, 'generated', 'results.json'), JSON.stringify(results, null, 2));
}

runAllBenchmarks().catch(e => console.error(e));
