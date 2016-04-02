/**
 * @param {Object} loaderConfig Loader configuration from Webpack config
 * @returns {string}
 */
function stringifyLoaderConfig(loaderConfig) {
  var stringified = null;

  if (Array.isArray(loaderConfig.loaders)) {
    stringified = loaderConfig.loaders.join('!');
  }
  else {
    stringified = loaderConfig.loader;
    if (loaderConfig.query) {
      var queryStr = (typeof loaderConfig.query === 'string')
        ? loaderConfig.query
        : JSON.stringify(loaderConfig.query);

      stringified += '?' + queryStr;
    }
  }

  return stringified;
}
module.exports = stringifyLoaderConfig;