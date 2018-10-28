const pify = require("pify");
const { exec } = require("child_process");
const path = require("path");
const asyncExec = pify(exec);
const BINARY_PATH = path.resolve(__dirname, "carmi");

const runBinary = args => asyncExec(`${BINARY_PATH} ${args}`);

describe("carmi binary", () => {
  it("has a help menu", async () => {
    const helpMessage = await runBinary("--help");
    expect(helpMessage).toMatch(/shows this very help message/);
  });

  it("compiles a carmi file", async () => {
    const filePath = path.resolve(
      __dirname,
      "..",
      "src",
      "babelPlugin",
      "test.carmi.js"
    );
    const file = await runBinary(`--source ${filePath}`);
    eval(file);
    expect(typeof model).toBe("function");
  });
});
