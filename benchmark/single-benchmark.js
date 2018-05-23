const test = require('./' + process.argv[2]);
const modelFunc = require(process.argv[3]);
const countItems = process.argv[4] ? parseInt(process.argv[4], 10) : 50000;
const countChanges = process.argv[5] ? parseInt(process.argv[5], 10) : countItems / 10;
const batchSize = process.argv[6] ? parseInt(process.argv[6], 10) : 1;

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
