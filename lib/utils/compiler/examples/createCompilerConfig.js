var clone = require('clone');

function removePluginLoaderFromLoadersConfig(loaders) {
  return loaders.filter(function (loader) {
    if (loader.hasOwnProperty('loaders')) {
      var filtered = loader.loaders.filter(function (loader) {
        return loader.indexOf(DocsPlugin.loaderPath) === -1;
      });
      return filtered.length !== 0;
    } else {
      return loader.loader.indexOf(DocsPlugin.loaderPath) === -1;
    }
  });
}

/**
 * Creates webpack config for ExampleCompiler.
 * Removes DocsPlugin instance from `plugins` and DocsPlugin loader from `loaders`
 * to prevent recursive compilation.
 *
 * @param {Object} baseConfig Base Webpack config
 * @returns {Object}
 */
function createExamplesCompilerConfig(baseConfig) {
  var config = clone(baseConfig);

  delete config.entry;

  if (config.plugins) {
    config.plugins = config.plugins.filter(function (plugin) {
      // TODO: refactor plugin instances checking (this made because of circular ref)
      return !(plugin.hasOwnProperty('pages'));
    });
  }

  return config;
}

module.exports = createExamplesCompilerConfig;

module.exports.removePluginLoaderFromLoadersConfig = removePluginLoaderFromLoadersConfig;