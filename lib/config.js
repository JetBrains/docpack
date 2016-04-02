var path = require('path');

/**
 * @typedef {Object} DocsPluginConfig
 */
var config = {
  page: {
    extractor: require('./extractor/extractor'),
    template: path.resolve(__dirname, '../assets/templates/page.html'),
    namePattern: 'docs/[path][name].[ext]/index.html'
  },
  examples: {
    extractor: require('./extractor/examples-extractor'),
    template: path.resolve(__dirname, '../assets/templates/example.html'),
    compile: {
      js: true
    },
    webpackConfig: null
  },
  templateEngine: {
    name: 'nunjucks',
    cache: true,
    context: null
  },
  onPageBuild: function (pages, compilation) {

  }
};

module.exports = config;