const { defineConfig } = require('vite');
const carmiPlugin = require('./src/vitePlugin');

module.exports = api => defineConfig({
  plugins: [carmiPlugin()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'test.carmi.js')
      },
      output: {
        dir: 'dist',
        format: 'es'
      }
    }
  }
});
