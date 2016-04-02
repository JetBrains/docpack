/**
 * @param {Array<Object>} loaders Loaders configuration from Webpack config
 * @returns {string}
 */
function stringifyLoadersConfig(loaders) {
  var result = [];

  loaders.forEach(function(loaderConfig) {
    var stringified = '';

    if (Array.isArray(loaderConfig.loaders)) {
      stringified = loaderConfig.loaders.join('!');
    }
    else {
      stringified = loaderConfig.loader;
      if (loaderConfig.query) {
        stringified += '?' + (typeof loaderConfig.query === 'string')
          ? loaderConfig.query
          : JSON.stringify(loaderConfig.query);
      }
    }

    result.push(stringified);
  });

  return result.join('!');
}
exports = stringifyLoadersConfig;