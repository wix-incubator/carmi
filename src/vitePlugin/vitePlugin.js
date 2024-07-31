const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');
const carmiBabelTransform = require('../babelPlugin/index'); // Adjust the path as needed

module.exports = function carmiPlugin() {
  return {
    name: 'vite-plugin-carmi',
    async transform(code, id) {
      if (!id.endsWith('.carmi')) {
        return null;
      }

      const result = await babel.transformAsync(code, {
        filename: id,
        plugins: [carmiBabelTransform]
      });

      return {
        code: result.code,
        map: result.map
      };
    }
  };
};
