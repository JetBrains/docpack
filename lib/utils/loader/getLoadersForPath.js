/**
 * Returns loaders matched provided path.
 *
 * @param {string} path Path
 * @param {Array<Object>} loaders Loaders configuration from Webpack config
 * @returns {Array<Object>} Filtered loaders array
 */
function getLoadersForPath(path, loaders) {
  return loaders.filter(function(loaderConfig) {
    return loaderConfig.test.test(path);
  });
}

exports = getLoadersForPath;