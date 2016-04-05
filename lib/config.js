var path = require('path');

/**
 * @typedef {Object} DocsPluginConfig
 */
var config = {
  page: {
    extractor: require('./extractors/default'),
    extractorOptions: {ololo: true},
    template: path.resolve(__dirname, '../assets/templates/page.html'),
    namePattern: 'docs/[path][name].[ext]/index.html'
  },
  example: {
    template: path.resolve(__dirname, '../assets/templates/example.html'),
    emit: true,
    files: {
      compile: ['js'],
      emit: true
    },
    webpackConfig: null
  },
  templateEngine: {
    name: 'twig',
    cache: true,
    context: null
  },
  onPageBuild: function (pages) {

  }
};

module.exports = config;