const {execSync} = require('child_process');
const path = require('path');

const carmiPath = path.resolve(__dirname, '..', '..', 'bin', 'carmi');

const formatCarmiResult = carmiResult =>
  carmiResult
    .replace(/^var model = /, '') // We need an expression, variable declaration is not an expression
    .trim() // Remove redundant spaces
    .replace(/;$/, ''); // Remove the last comma. It causes errors in babylon

const compileFile = carmiModelFilePath => {
  const moduleSupport = path.extname(carmiModelFilePath) === '.mjs' ? '--experimental-modules' : '';
  const compiled = execSync(
    `node --inspect-brk=127.0.0.1:9222 ${moduleSupport} ${carmiPath} --compiler optimizing --format iife --source ${carmiModelFilePath}`
  ).toString('utf8');
  return formatCarmiResult(compiled);
};

module.exports = compileFile;
