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
        loader: DocsPlugin.extract()
      }
    ]
  },

  plugins: [
    new DocsPlugin()
  ]
};