const path = require('path')
const crypto = require('crypto');
const findCacheDir = require('find-cache-dir');

const cacheDir = findCacheDir({name: 'carmi'});

module.exports = absPath => {
  const hash = crypto.createHash('md5').update(absPath).digest('hex');
  return path.resolve(cacheDir, hash);
}
