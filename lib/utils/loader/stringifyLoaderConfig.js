/**
 * @param {Object} loaderConfig Loader configuration from Webpack config
 * @returns {string}
 */
function stringifyLoaderConfig(loaderConfig) {
  var stringified = null;

  if (loaderConfig.hasOwnProperty('loader')) {
    stringified = loaderConfig.loader;
    if (loaderConfig.query) {
      var queryStr = (typeof loaderConfig.query === 'string')
        ? loaderConfig.query
        : JSON.stringify(loaderConfig.query);

      stringified += '?' + queryStr;
    }
  }
  else if (Array.isArray(loaderConfig.loaders)) {
    stringified = loaderConfig.loaders.join('!');
  }
  else
    throw new Error('Loader config must contain at least `loader` or `loaders` properties (in order of precedence)');

  return stringified;
}
module.exports = stringifyLoaderConfig;
