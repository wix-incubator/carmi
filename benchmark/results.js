const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const results = JSON.parse(fs.readFileSync(path.join(__dirname, 'generated', 'results.json')).toString());
const runValues = ['user', 'rss'];
const runClass = ['run', 'type'];
const runClassOrders = {
  run: ['justInit', 'nonBatched', 'batched'],
  type: ['simple', 'mobx', 'carmi']
};

Object.keys(results).forEach(testname => {
  const testResults = results[testname];
  const keys = Object.keys(testResults[0]);
  console.log(testResults.length);
  const grouped = _(testResults)
    .groupBy(run => runClass.map(key => run[key]).join(':'))
    .mapValues(runsOfType => {
      return runValues.reduce((acc, key) => {
        acc[key] =
          _(runsOfType)
            .map(key)
            .sum() / runsOfType.length;
        return acc;
      }, {});
    })
    .mapValues(({ user, rss }) => `${(user / 1000).toFixed(3)}ms ${(rss / 1000000).toFixed(3)}MB`)
    .value();
  console.log(grouped);
  const permCount = runClassOrders.run.length * runClassOrders.type.length;
  for (let perm = 0; perm < permCount; perm++) {
    const type = runClassOrders.type[Math.floor(perm / runClassOrders.run.length)];
    const run = runClassOrders.run[perm % runClassOrders.run.length];
    console.log(run, type, grouped[[run, type].join(':')]);
  }
  console.log(permCount);
});
/*.mapValues()
      .map(({ type, run, user, rss }) => {
        return { type, run, txt: `${user / 1000}ms ${rss / 1000000}MB` };
      })
      .groupBy('run')
      .map(testsByRun => _.keyBy(testsByRun, 'type'))*/
