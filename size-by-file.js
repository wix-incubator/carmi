const babylon = require('babylon');
const args = process.argv.slice(2);
const src = require('fs')
  .readFileSync(args[0])
  .toString();
const byLine = true;
const ast = babylon.parse(src);

const sizeByFile = {};
ast.program.body[0].body.body.forEach(token => {
  if (token.type === 'FunctionDeclaration') {
    const name = token.id.name;
    const parts = name.split('_');
    if (name.indexOf('$') === 0 && parts.length > 3) {
      const fileName = byLine ? parts[1] + '_' + parts[2] : parts[1];
      sizeByFile[fileName] = sizeByFile[fileName] || 0;
      sizeByFile[fileName] += token.loc.end.line - token.loc.start.line;
    }
  }
});

console.log('total lines', Object.values(sizeByFile).reduce((acc, cnt) => acc + cnt, 0));
console.log('top sources');
Object.keys(sizeByFile)
  .sort((a, b) => sizeByFile[b] - sizeByFile[a])
  .slice(0, 50)
  .forEach(k => console.log(k, sizeByFile[k]));