const path = require('path')
const crypto = require('crypto');
const findCacheDir = require('find-cache-dir');

const cacheDir = findCacheDir({name: 'carmi'});

module.exports = options => {
  const hash = crypto.createHash('md5').update(JSON.stringify(options)).digest('hex');
  return path.resolve(cacheDir, hash);
}
