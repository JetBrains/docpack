/**
 * Returns loaders matched provided path.
 *
 * @param {string} path Path
 * @param {Array<Object>} loaders Loaders configuration from Webpack config
 * @returns {Array<Object>} Filtered loaders array
 */
exports.getLoadersForPath = function (path, loaders) {
  return loaders.filter(function(loaderConfig) {
    return loaderConfig.test.test(path);
  });
};

/**
 * @param {string} loaderPath Loader absolute path
 * @param {Object} [query]
 * @param {string} [resourcePath] Relative or absolute resource path
 * @returns {string}
 */
exports.generateLoaderString = function(loaderPath, query, resourcePath) {
  return [
    loaderPath,
    (query)
      ? '?' + JSON.stringify(query)
      : '',
    (resourcePath)
      ? '!' + resourcePath
      : ''
  ].join('');
};

/**
 * @param {Array<Object>} loaders Loaders configuration from Webpack config
 * @returns {string}
 */
exports.stringifyLoadersFromConfig = function (loaders) {
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
};