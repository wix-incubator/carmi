const fs = require('fs');

module.exports = ['readFile', 'writeFile', 'mkdtemp', 'rmdir', 'unlink'].reduce((acc, func, key) => {
  acc[key] = (...args) => {
    return new Promise((resolve, reject) => {
      func.apply(
        fs,
        args.concat([
          (err, result) => {
            if (err) {
              reject(err);
            }
            resolve(result);
          }
        ])
      );
    });
  };
  return acc;
}, {});
