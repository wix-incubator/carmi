const carmi = require('../index');
const path = require('path');
const fs = require('fs-extra');
const {fork} = require('child_process');

const tests = ['todos', 'names'];
const testsConfigs = {
  names: ['simple', 'carmi'],
  todos: ['simple', 'carmi', 'mobx']
}
const runTypesParams = {
  justInit: [1000, 0, 0],
  batched: [1000, 250, 5],
  nonBatched: [1000, 50, 0]
};
const runTypes = {
  simple: ['justInit', 'batched', 'nonBatched'],
  mobx: ['justInit', 'batched', 'nonBatched'],
  carmi: ['justInit', 'batched', 'nonBatched']
};
const runsCount = 11;

function resolveTestName(testname, type) {
  if (type === 'mobx') {
    return `./${testname}.mobx`;
  }
  const targetDir = path.resolve(__dirname, 'generated')
  fs.ensureDirSync(targetDir)
  return path.resolve(targetDir, `${testname}.${type}`);
}

function precompileModel(testname, type) {
  const model = require(path.resolve(__dirname, `${testname}.carmi`));
  const src = carmi.compile(model, {
    compiler: type,
    format: 'cjs',
    name: testname
  });
  fs.writeFileSync(`${resolveTestName(testname, type)}.js`, src);
}

function runSingleTest(testname, model, count, changes, batch) {
  return new Promise(resolve => {
    const child = fork(path.resolve(__dirname, './single-benchmark'), [testname, model, count, changes, batch]);
    let results = null;
    child.on('message', msg => results = msg);
    child.on('close', () => resolve(results));
  });
}

async function runBenchmarks(testname) {
  precompileModel(testname, 'carmi');
  precompileModel(testname, 'simple');
  const results = [];
  for (let runIndex = 0; runIndex < runsCount; runIndex++) {
    for (const type of testsConfigs[testname]) {
      for (const run of runTypes[type]) {
        const vals = await runSingleTest(testname, resolveTestName(testname, type), ...runTypesParams[run]);
        results.push(Object.assign({type, run}, vals));
      }
    }
  }
  return results;
}

async function runAllBenchmarks() {
  const results = {};
  for (const testname of tests) {
    results[testname] = await runBenchmarks(testname);
  }
  fs.writeJsonSync(path.resolve(__dirname, 'generated', 'results.json'), results, {spaces: 2});
}

try {
  runAllBenchmarks();
} catch (e) {
  console.error(e);
}
