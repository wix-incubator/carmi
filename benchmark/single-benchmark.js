const args = process.argv.slice(2);
// const args = 'todos ./generated/todos.carmi 50000 5000 10'.split(' ');
const objectHash = require('object-hash');
const test = require(`./${args[0]}`);
const countItems = parseInt(args[2], 10);
const countChanges = parseInt(args[3], 10);
const batchSize = parseInt(args[4], 10);
const shouldProfile = args[5] === 'true';
const initialState = test.getInitialState(countItems);
const modelFunc = require(args[1]);
const cpuUsageAfterInitialState = process.cpuUsage();

console.log(`${args[0]} - ${args[1]}: items:${countItems} ops:${countChanges} inBatches:${batchSize}`);

if (shouldProfile) {
  console.profile('run');
}
const inst = modelFunc(initialState);

if (batchSize > 1) {
  for (let batchCount = 0; batchCount < countChanges / batchSize; batchCount++) {
    inst.$runInBatch(() => {
      test.benchmark(inst, batchCount * batchSize, Math.min(countChanges, batchCount + 1 * batchSize));
    });
  }
} else {
  test.benchmark(inst, 0, countChanges);
}
if (shouldProfile) {
  console.profileEnd('run');
}
const cpuUsage = process.cpuUsage(cpuUsageAfterInitialState);
const instValues = Object.keys(inst).reduce((acc, key) => {
  if (typeof inst[key] !== 'function' && key[0] !== '$') {
    acc[key] = inst[key];
  }
  return acc;
}, {});
const hash = objectHash(instValues);
const msg = process.send ? process.send.bind(process) : console.log.bind(console);
msg(Object.assign({ hash }, cpuUsage, process.memoryUsage()));
