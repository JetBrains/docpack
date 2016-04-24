/**
 * Compiled from html-webpack-plugin and webpack-twig-loader.
 * @see https://github.com/ampedandwired/html-webpack-plugin
 * @see https://www.npmjs.com/package/webpack-twig-loader
 */
var loaderUtils = require('loader-utils');
var twig = require('twig/twig').twig;

module.exports = function (source) {
  this.cacheable && this.cacheable();
  var done = this.async();
  var templatePath = this.resource;

  var allLoadersButThisOne = this.loaders.filter(function (loader) {
    // Loader API changed from `loader.module` to `loader.normal` in Webpack 2.
    return (loader.module || loader.normal) !== module.exports;
  });

  // This loader shouldn't kick in if there is any other loader
  // Skip .js files
  if (allLoadersButThisOne.length > 0 || /\.js$/.test(templatePath)) {
    done(null, source);
  }

  // Get compiled template from cache store
  var template = twig({ref: templatePath});

  // If null - compile it
  if (template === null) {
    template = twig({id: templatePath, data: source});
  }

  // Runtime
  var result = [
    'var twig = require(' + loaderUtils.stringifyRequest(this, require.resolve('twig'))  + ').twig;',
    'var template = twig(' + JSON.stringify(template.tokens) + ');',
    'module.exports = function(context) {',
      'return template.render(context)',
    '};'
  ].join('\n');

  done(null, result);
};

module.exports.LOADER_PATH = __filename;