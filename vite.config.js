const {defineConfig} = require('vite');
const carmiPlugin = require('./src/vitePlugin');
const {resolve} = require('path')

module.exports = api => defineConfig({
  plugins: [carmiPlugin()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'test.carmi.js')
      },
      output: {
        dir: 'dist',
        format: 'es'
      }
    }
  }
});
