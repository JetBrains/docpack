/**
 * Compiled from html-webpack-plugin and webpack-twig-loader.
 * @see https://github.com/ampedandwired/html-webpack-plugin
 * @see https://www.npmjs.com/package/webpack-twig-loader
 */
var loaderUtils = require('loader-utils');
var twig = require('twig').twig;

module.exports = function (source) {
  this.cacheable && this.cacheable();

  var allLoadersButThisOne = this.loaders.filter(function (loader) {
    // Loader API changed from `loader.module` to `loader.normal` in Webpack 2.
    return (loader.module || loader.normal) !== module.exports;
  });

  // This loader shouldn't kick in if there is any other loader
  if (allLoadersButThisOne.length > 0) {
    return source;
  }

  // Skip .js files
  if (/\.js$/.test(this.request)) {
    return source;
  }

  var template = twig({id: this.resource, data: source})
    .compile({module: 'node'});
  var templateAst = template.match(/(?:twig\()(.*)(?:\))/m)[1];

  var result = [
    'var twig = require(' + loaderUtils.stringifyRequest(this, require.resolve('twig'))  + ').twig;',
    'var template = twig(' + templateAst + ');',
    'module.exports = function(context) {',
      'return template.render(context)',
    '};'
  ].join('\n');

  return result;
};

module.exports.LOADER_PATH = __filename;