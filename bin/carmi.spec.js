const pify = require("pify");
const { exec } = pify(require("child_process"));
const path = require("path");
const { existsSync } = require("fs");
const { readFile } = require("../src/promise-fs");
const { file: tmpFile } = require("tmp-promise");
const invert = require('invert-promise');

const runBinary = args => exec(`${BINARY_PATH} ${args}`);

const BINARY_PATH = path.resolve(__dirname, "carmi");
const CARMI_MODEL = path.resolve(
  __dirname,
  "..",
  "src",
  "babelPlugin",
  "test.carmi.js"
);

describe("carmi binary", () => {
  it("has a help menu", async () => {
    const helpMessage = await runBinary("--help");
    expect(helpMessage).toMatch(/shows this very help message/);
  });

  it("compiles a carmi file", async () => {
    const file = await runBinary(`--source ${CARMI_MODEL}`);
    eval(file);
    expect(typeof model).toBe("function");
  });

  it("saves the file", async () => {
    const { cleanup, path: filepath } = await tmpFile();
    try {
      const file = await runBinary(
        `--source ${CARMI_MODEL} --output ${filepath} --format cjs`
      );
      const model = require(filepath);
      expect(typeof model).toBe("function");
    } finally {
      cleanup();
    }
  });

  it('exits with exit code 1 in case carmi fails', async () => {
    const error = await invert(runBinary(
      `--source dummy.js --output irrelevant --format cjs`
    ));

    expect(error.code).toBe(1);
  });
});
