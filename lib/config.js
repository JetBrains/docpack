var path = require('path');

/**
 * @typedef {Object} DocsPluginConfig
 */
module.exports = {

  test: /\.js$/,
  include: null,

  extractor: require('./extractors/default'),
  extractorOptions: null,

  page: {
    name: 'docs/[path][name].[ext]/index.html',
    template: path.resolve(__dirname, '../assets/templates/page.twig'),
    templateContext: null,
    render: true,
    emit: true
  },

  sourcePage: {
    name: 'docs/[path][name].[ext].html',
    template: null,
    templateContext: null,
    render: false,
    emit: false
  },

  example: {
    name: '[doc-path]/examples/[example-id].html',
    template: path.resolve(__dirname, '../assets/templates/example.twig'),
    templateContext: null,
    render: true,
    emit: true,

    files: {
      compile: ['js'],
      emit: true,
      webpackConfig: null
    }
  },

  templateEngine: {
    name: 'twig',
    cache: true,
    context: null
  },

  staticAssets: [],

  onPageBuild: function (pages) {

  }
};