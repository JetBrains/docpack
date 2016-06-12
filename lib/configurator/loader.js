var LOADER_PATH = __filename;

module.exports = function (source) {
  this.cacheable && this.cacheable();

  /**
   * Taken from html-webpack-plugin
   * @see https://github.com/ampedandwired/html-webpack-plugin
   */
  var allLoadersButThisOne = this.loaders.filter(function (loader) {
    // Loader API changed from `loader.module` to `loader.normal` in Webpack 2.
    return (loader.module || loader.normal) !== module.exports;
  }).length > 0;

  // Skip .js files
  if (/\.js$/.test(this.request) || allLoadersButThisOne) {
    return source;
  } else {
    return '';
  }
};

module.exports.LOADER_PATH = LOADER_PATH;