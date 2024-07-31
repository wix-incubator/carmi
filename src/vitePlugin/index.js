const babel = require('@babel/core');
const carmiBabelPlugin = require('../babelPlugin');
const compileFile = require('../babelPlugin/compileFile');

const isCarmiFile = (id) => /\.carmi\.(js|mjs)$/.test(id);

function carmiVitePlugin(options = {}) {
  return {
    name: 'vite-plugin-carmi',
    enforce: 'pre',

    async transform(code, id) {
      if (!isCarmiFile(id)) {
        return null;
      }

      const babelResult = await babel.transformAsync(code, {
        filename: id,
        plugins: [carmiBabelPlugin],
        ast: true
      });

      if (!babelResult || !babelResult.code) {
        return null;
      }

      const compiledCode = compileFile(id, {
        isDebug: options.debug,
        disableCurrentLineFunctionName: options.disableCurrentLineFunctionName,
      });

      return {
        code: compiledCode,
        map: babelResult.map
      };
    }
  };
}

module.exports = carmiVitePlugin;
