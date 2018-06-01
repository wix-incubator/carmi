const { Expr, Token, Setter, Expression, SetterExpression, SpliceSetterExpression, TokenTypeData } = require('./lang');
const _ = require('lodash');
const SimpleCompiler = require('./simple-compiler');
const { applyPatch } = require('diff');
const { promisify } = require('util');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { readFile, writeFile, mkdtemp, mkdir, rmdir } = _(fs)
  .pick(['readFile', 'writeFile', 'mkdtemp', 'mkdir', 'rmdir'])
  .mapValues(promisify)
  .value();
const { spawn } = require('child_process');
const { extractTypes } = require('./flow-types');

function spawnAsync(proc, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(proc, args);
    let results = '';
    child.stdout.on('data', msg => {
      results += msg;
    });
    child.on('close', code => {
      if (code === 0) {
        resolve(results);
      } else {
        reject(code);
      }
    });
  });
}

const EMPTY_FLOW_CONFIG = `[ignore]
[include]
[libs]
[lints]
[options]
[strict]
`;

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

  generateExpr(expr) {
    const currentToken = expr instanceof Expression ? expr[0] : expr;
    if (currentToken.hasOwnProperty('$id')) {
      return `annotate_${expr[0].$id}(${super.generateExpr(expr)})`;
    }
    return super.generateExpr(expr);
  }

  buildExprFunctionsByTokenType(acc, expr) {
    acc.push(`function annotate_${expr[0].$id} (src){return src}`);
    super.buildExprFunctionsByTokenType(acc, expr);
  }

  async postProcess(src) {
    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'flow-'));
    const tempFilename = path.join(tempDirectory, `${this.options.name}.js`);
    const flowConfigFile = path.join(tempDirectory, '.flowconfig');
    console.log(tempFilename);
    const srcBeforeFlowSuggest = `// @flow
type Model = ${this.options.flowModel};
type FuncLib = ${this.options.flowFuncLib};
    ${src.replace(/\/\*::(.*?)\*\//g, '$1').replace(/\/\*:(.*?)\*\//g, ':$1')}
`;
    await writeFile(tempFilename, srcBeforeFlowSuggest);
    await writeFile(flowConfigFile, EMPTY_FLOW_CONFIG);
    // const flowVer = await spawnAsync(flowBin, ['version'], { cwd: tempDirectory });
    // console.log(flowVer);
    // const flowDiff = await spawnAsync('flow', ['suggest', tempFilename], { cwd: tempDirectory });
    const postFlowSrc = await spawnAsync(require.resolve('flow-bin/cli'), ['suggest', tempFilename]);
    this.annotations = extractTypes(postFlowSrc);
    console.log(this.annotations);

    return postFlowSrc;
  }
}

module.exports = FlowCompiler;
