/**
 * @typedef {Object} DocsPluginConfig
 */
module.exports = {
  test: /\.js$/,
  exclude: /node_modules/,

  plugins: [
    require('./plugins/JsDocExtractorPlugin')

  ].map(function (Plugin) {
    return new Plugin
  }),

  extractor: null,
  extractorOptions: null
};