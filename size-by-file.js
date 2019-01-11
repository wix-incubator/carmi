const babylon = require('babylon');
const args = process.argv.slice(2);
const src = require('fs')
  .readFileSync(args[0])
  .toString();
const byLine = true;
const ast = babylon.parse(src);

const linesByFile = {};
const charsByFile = {};
console.log(ast.program.body[0].expression.right);
ast.program.body[0].expression.right.body.body.forEach(token => {
  if (token.type === 'FunctionDeclaration') {
    const name = token.id.name;
    const parts = name.split('_');
    if (name.indexOf('$') !== -1) {
      const fileName = name;//byLine ? parts[1] + '_' + parts[2] : parts[1];
      linesByFile[fileName] = linesByFile[fileName] || 0;
      linesByFile[fileName] += token.loc.end.line - token.loc.start.line;
      charsByFile[fileName] = charsByFile[fileName] || 0;
      charsByFile[fileName] += token.end - token.start
    }
  }
});

console.log('total lines', Object.values(linesByFile).reduce((acc, cnt) => acc + cnt, 0));
console.log('top sources');
Object.keys(linesByFile)
  .sort((a, b) => linesByFile[b] - linesByFile[a])
  .slice(0, 50)
  .forEach(k => console.log(k, linesByFile[k]));



console.log('total chars', Object.values(charsByFile).reduce((acc, cnt) => acc + cnt, 0));
console.log('top sources');
Object.keys(charsByFile)
  .sort((a, b) => charsByFile[b] - charsByFile[a])
  .slice(0, 50)
  .forEach(k => console.log(k, charsByFile[k]));