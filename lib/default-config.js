var path = require('path');

module.exports = {
  page: {
    extractor: require('./extractor/extractor'),
    template: path.resolve(__dirname, 'templates/page.html'),
    namePattern: 'docs/[path][name].[ext]/index.html'
  },
  examples: {
    extractor: require('./extractor/examples-extractor'),
    template: path.resolve(__dirname, 'templates/example.html'),
    compile: {
      js: true
    },
    webpackConfig: null
  },
  templateEngine: {
    name: 'nunjucks',
    cache: true,
    context: null
  }
};