const { Expr, Token, Setter, Expression, SetterExpression, SpliceSetterExpression, TokenTypeData } = require('./lang');
const _ = require('lodash');
const SimpleCompiler = require('./simple-compiler');
const { applyPatch } = require('diff');
const { promisify } = require('util');
const spawn = require('child_process').spawn;
const fs = require('fs');
const os = require('os');
const path = require('path');
const { readFile, writeFile, mkdtemp, mkdir, rmdir } = _(fs)
  .pick(['readFile', 'writeFile', 'mkdtemp', 'mkdir', 'rmdir'])
  .mapValues(promisify)
  .value();
const flowBin = require('flow-bin');
const { fork } = require('child_process');

function forkAsync(proc, args) {
  return new Promise((resolve, reject) => {
    const child = fork(proc, args);
    let results = '';
    child.on('message', msg => (results += msg));
    child.on('close', code => {
      if (code === 0) {
        resolve(results);
      } else {
        reject(code);
      }
    });
  });
}

function spawnAsync(proc, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(proc, args, options);
    let result = '';

    child.stdout.on('data', data => {
      result += data;
    });

    child.on('close', code => {
      if (code !== 0) {
        reject(`${proc} process exited with code ${code}`);
      } else {
        resolve(result);
      }
    });
  });
}

const {
  tagExprWithPaths,
  findReferencesToPathInAllGetters,
  splitSettersGetters,
  pathMatches,
  pathFragmentToString,
  normalizeAndTagAllGetters,
  allPathsInGetter
} = require('./expr-tagging');

class FlowCompiler extends SimpleCompiler {
  constructor(model, options) {
    const { getters, setters } = splitSettersGetters(model);
    super({ ...model, ...normalizeAndTagAllGetters(getters, setters) }, options);
  }

  get template() {
    return require('./templates/flow.js');
  }

  async postProcess(src) {
    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'flow-'));
    const tempFilename = path.join(tempDirectory, `${this.options.name}.flow.js`);
    const flowConfigFile = path.join(tempDirectory, '.flowconfig');
    console.log(tempFilename);
    const srcBeforeFlowSuggest = `// @flow
type Model = ${this.options.flowModel};
type FuncLib = ${this.options.flowFuncLib};
    ${src.replace(/\/\*::(.*?)\*\//g, '$1').replace(/\/\*:(.*?)\*\//g, ':$1')}
`;
    await writeFile(tempFilename, srcBeforeFlowSuggest);
    await writeFile(
      flowConfigFile,
      `[ignore]
    [include]
    
    [libs]
    
    [lints]
    
    [options]
    
    [strict]
    `
    );
    // const flowVer = await spawnAsync(flowBin, ['version'], { cwd: tempDirectory });
    // console.log(flowVer);
    // const flowDiff = await spawnAsync('flow', ['suggest', tempFilename], { cwd: tempDirectory });
    const flowDiff = await forkAsync(require.resolve('flow-bin/cli'), ['suggest', tempFilename]);
    console.log('stdout:', flowDiff);
    const postFlowSrc = applyPatch(srcBeforeFlowSuggest, flowDiff);
    // console.log(postFlowSrc);

    return postFlowSrc;
  }
}

module.exports = FlowCompiler;
