const {Expr, Token, Setter, Expression, SetterExpression, SpliceSetterExpression, TokenTypeData} = require('./lang');
const SimpleCompiler = require('./simple-compiler');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {spawn, spawnSync} = require('child_process');
const {extractTypes} = require('./flow-types');

function spawnAsync(proc, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(proc, args, options);
    let results = '';
    let err = '';
    child.stdout.on('data', msg => {
      results += msg;
    });
    child.stderr.on('data', msg => {
      err += msg;
    });
    child.on('close', code => {
      if (code === 0) {
        resolve(results);
      } else {
        console.error(err);
        reject(code);
      }
    });
  });
}

const {splitSettersGetters, normalizeAndTagAllGetters} = require('./expr-tagging');

class FlowCompiler extends SimpleCompiler {
  constructor(model, options) {
    const {getters, setters} = splitSettersGetters(model);
    super({...model, ...normalizeAndTagAllGetters(getters, setters)}, options);
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

  compile() {
    const src = super.compile();
    console.log(src);
    const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'flow-'));
    const tempFilename = path.join(tempDirectory, `${this.options.name}.js`);
    const flowConfigFile = path.join(tempDirectory, '.flowconfig');
    const srcBeforeFlowSuggest = `// @flow
${this.options.flow};
    ${src.replace(/\/\*::(.*?)\*\//g, '$1').replace(/\/\*:(.*?)\*\//g, ':$1')}
`;
    fs.writeFileSync(tempFilename, srcBeforeFlowSuggest);
    const flowCliOptions = {cwd: tempDirectory + path.sep};
    spawnSync(require.resolve('flow-bin/cli'), ['init'], flowCliOptions);
    const postFlowSrc = spawnSync(require.resolve('flow-bin/cli'), ['suggest', tempFilename], flowCliOptions);
    this.annotations = extractTypes(postFlowSrc);
    console.log(JSON.stringify(this.annotations));
    console.log(postFlowSrc);
    fs.unlinkSync(flowConfigFile);
    fs.unlinkSync(tempFilename);
    fs.rmdirSync(tempDirectory);
    return postFlowSrc;
  }

  get lang() {
    return 'flow';
  }
}

module.exports = FlowCompiler;
