var path = require('path');

/**
 * @typedef {Object} DocsPluginConfig
 */
var config = {
  page: {
    extractor: require('./extractors/default'),
    template: path.resolve(__dirname, '../assets/templates/page.html'),
    templateContext: null,
    namePattern: 'docs/[path][name].[ext]/index.html'
  },
  example: {
    extractor: require('./extractors/xmlExampleExtractor'),
    template: path.resolve(__dirname, '../assets/templates/example.html'),
    files: {
      compile: ['js'],
      emit: true,
      render: true
    },
    webpackConfig: null
  },
  templateEngine: {
    name: 'nunjucks',
    cache: true
  },
  onPageBuild: function (pages) {

  }
};

module.exports = config;