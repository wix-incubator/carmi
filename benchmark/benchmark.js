const carmi = require('../index');
const path = require('path');
const { fork } = require('child_process');
const tests = ['todos'];

async function precompileModel(testname) {
  let model;
  model = require(path.resolve(__dirname, `${testname}.carmi`));
  await carmi.compile(model, {
    output: path.resolve(__dirname, 'generated', `${testname}.js`),
    naive: false,
    format: 'cjs',
    name: testname,
    minify: true
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
  await precompileModel(testname);
  const resultsMobx = await runSingleTest(testname, `./${testname}.mobx`, 50000, 50000, 100);
  const resultsCarmi = await runSingleTest(testname, `./generated/${testname}`, 50000, 50000, 100);
  console.log(resultsMobx, resultsCarmi);
}

runBenchmarks('todos');
