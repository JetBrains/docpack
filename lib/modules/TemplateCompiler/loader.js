/**
 * Compiled from html-webpack-plugin and webpack-twig-loader.
 * @see https://github.com/ampedandwired/html-webpack-plugin
 * @see https://www.npmjs.com/package/webpack-twig-loader
 */
var loaderUtils = require('loader-utils');
var Twig = require('twig/twig');
var twig = Twig.twig;

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

  Twig.cache(false);
  var template = twig({id: templatePath, data: source});

  var data = {
    id: templatePath,
    data: template.tokens,
    precompiled: true
  };

  // Runtime
  var result = [
    'var twig = require(' + loaderUtils.stringifyRequest(this, require.resolve('twig'))  + ').twig;',
    'var template = twig(' + JSON.stringify(data) + ');',
    'module.exports = function(context) {',
      'return template.render(context)',
    '};'
  ].join('\n');

  done(null, result);
};

module.exports.LOADER_PATH = __filename;