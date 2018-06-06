const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const templatesBlob = fs.readFileSync(path.join(__dirname, 'rust-simple.rs')).toString();
const templatesParts = templatesBlob
  .split('////')
  .map(t => t.trim())
  .slice(1);
const templates = _.range(0, templatesParts.length, 2).reduce((acc, idx) => {
  acc[templatesParts[idx]] = templatesParts[idx + 1];
  return acc;
}, {});

module.exports = templates;
