var path = require('path');

/**
 * @typedef {Object} DocsPluginConfig
 */
var config = {
  entries: {
    styles: [
      '!!',
      require.resolve('file-loader'), '?name=styles.css',
      '!',
      require.resolve('primer-css/css/primer.css')
    ].join('')
  },
  page: {
    extractor: require('./extractors/default'),
    extractorOptions: null,
    template: path.resolve(__dirname, '../assets/templates/page.twig'),
    name: 'docs/[path][name].[ext]/index.html'
  },
  example: {
    template: path.resolve(__dirname, '../assets/templates/example.twig'),
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