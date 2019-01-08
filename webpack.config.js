const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './index.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'carmi',
    libraryTarget: 'umd'
  },
  plugins: [new webpack.IgnorePlugin(/(rust|flow)-compiler/), new webpack.IgnorePlugin(/rollup-plugin-uglify/)],
  resolve: {
    alias: {}
  },
  externals: {
    rollup: 'rollup',
    prettier: 'prettier'
  },
  // mode: 'development'
  mode: 'production'
};
