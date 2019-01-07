const fs = require('fs');
const pify = require('pify');
module.exports = pify(fs);
