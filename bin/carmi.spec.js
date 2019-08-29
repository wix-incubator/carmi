const pify = require('pify');
const childProcess = require('child_process');
const {exec} = pify(childProcess);
const path = require('path');
const tempy = require('tempy');
const invert = require('invert-promise');
const carmi = require('../index');

jest.mock('../index');

const BINARY_PATH = path.resolve(__dirname, 'carmi');
const MOCKED_BINARY_PATH = path.resolve(__dirname, '__mocks__/carmi');
const CARMI_MODEL = path.resolve(
  __dirname,
  '..',
  'src',
  'babelPlugin',
  'test.carmi.js'
);

const runBinary = args => exec(`${BINARY_PATH} ${args}`);
const getCompileCalls = (args, cacheDir) =>
  new Promise((resolve, reject) => {
    const child = childProcess.fork(MOCKED_BINARY_PATH, args.split(' '), {
      env: {CACHE_DIR: cacheDir}
    });
    let compileCalls = 0;
    child.on('message', name => name === 'carmi:compile' && compileCalls++);
    child.on('error', error => reject(error));
    child.on('exit', () => resolve(compileCalls));
  });

describe('carmi binary', () => {
  it('has a help menu', async () => {
    const helpMessage = await runBinary('--help');
    expect(helpMessage).toMatch(/shows this very help message/);
  });

  it('compiles a carmi file', async () => {
    const file = await runBinary(`--source ${CARMI_MODEL}`)
    /*eslint no-new-func:0*/
    const model = new Function(`${file}; return model`)()
    expect(typeof model).toBe('function');
  });

  it('saves the file', async () => {
    const filepath = tempy.file({extension: 'js'})
    const file = await runBinary(
      `--source ${CARMI_MODEL} --output ${filepath} --format cjs --no-cache`
    );
    const model = require(filepath);

    expect(typeof model).toBe('function');
  });

  it('exits with exit code 1 in case carmi fails', async () => {
    const error = await invert(runBinary(
      '--source dummy.js --output irrelevant --format cjs'
    ));

    expect(error.code).toBe(1);
  });

  describe('caching', () => {
    let carmiCompileCalls;
    let cacheDir;
    beforeEach(() => {
      carmiCompileCalls = 0;
      cacheDir = tempy.directory();
    })

    it('gets result from cache for same options', async () => {
      carmiCompileCalls += await getCompileCalls(`--source ${CARMI_MODEL} --format cjs --debug`, cacheDir);
      carmiCompileCalls += await getCompileCalls(`--source ${CARMI_MODEL} --format cjs --debug`, cacheDir);

      expect(carmiCompileCalls).toBe(1);
    });

    it('doesn\'t get result from cache if debug argument was changed', async () => {
      carmiCompileCalls += await getCompileCalls(`--source ${CARMI_MODEL} --debug`, cacheDir);
      carmiCompileCalls += await getCompileCalls(`--source ${CARMI_MODEL}`, cacheDir);

      expect(carmiCompileCalls).toBe(2);
    });

    it('doesn\'t override cache for different options', async () => {
      carmiCompileCalls += await getCompileCalls(`--source ${CARMI_MODEL} --format cjs`, cacheDir);
      carmiCompileCalls += await getCompileCalls(`--source ${CARMI_MODEL} --format iife`, cacheDir);
      carmiCompileCalls += await getCompileCalls(`--source ${CARMI_MODEL} --format cjs`, cacheDir);

      expect(carmiCompileCalls).toBe(2);
    });
  });
});
