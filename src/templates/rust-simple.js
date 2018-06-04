const fs = require('fs');
const path = require('path');
const readTemplate = templateName => fs.readFileSync(path.join(__dirname, 'rust', `${templateName}.rs`));
const templates = { base: 'simple', topLevel: 'top-level', func: 'func' };
module.exports = Object.keys(templates).reduce((acc, key) => {
  acc[key] = readTemplate(templates[key]);
  return acc;
}, {});
