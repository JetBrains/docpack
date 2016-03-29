var path = require('path');
var DocsPlugin = require('../../../lib/plugin');

module.exports = {
  context: __dirname,

  entry: {
    simple: './simple'
  },

  output: {
    path: path.resolve(__dirname, '../../../build'),
    filename: '[name].js'
  },

  module: {
    loaders: [
      {
        test: /\.js/,
        exclude: [path.resolve(__dirname, '../../../node_modules')],
        loader: DocsPlugin.extract()
      }
    ]
  },

  plugins: [
    new DocsPlugin()
  ]
};