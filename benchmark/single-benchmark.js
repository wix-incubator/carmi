const args = process.argv.slice(2);
// const args = 'todos ./generated/todos.carmi 50000 5000 10'.split(' ');
const test = require('./' + args[0]);
const modelFunc = require(args[1]);
const countItems = args[2] ? parseInt(args[2], 10) : 50000;
const countChanges = args[3] ? parseInt(args[3], 10) : countItems / 10;
const batchSize = args[4] ? parseInt(args[4], 10) : 1;

const initialState = test.getInitialState(countItems);
const inst = modelFunc(initialState);

console.log(`${process.argv[2]} - ${process.argv[3]}: items:${countItems} ops:${countChanges} inBatches:${batchSize}`);
if (batchSize > 1) {
  for (let batchCount = 0; batchCount < countChanges / batchSize; batchCount++) {
    inst.$runInBatch(() => {
      test.benchmark(inst, batchCount * batchSize, Math.min(countChanges, batchCount + 1 * batchSize));
    });
  }
} else {
  test.benchmark(inst, 0, countChanges);
}
process.send(Object.assign({}, process.cpuUsage(), process.memoryUsage()));
