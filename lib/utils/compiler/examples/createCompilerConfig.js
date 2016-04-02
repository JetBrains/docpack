var DocsPlugin = require('../../../plugin');
var clone = require('clone');

function removePluginLoaderFromLoadersConfig(loaders) {
  return loaders.filter(function (loader) {
    return loader.loader.indexOf(DocsPlugin.loaderPath) === -1;
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
    config.plugins = baseConfig.plugins.filter(function (plugin) {
      return !(plugin instanceof DocsPlugin);
    });
  }

  if (config.module) {
    if (config.module.preLoaders)
      config.module.preLoaders = removePluginLoaderFromLoadersConfig(config.module.preLoaders);

    if (config.module.loaders)
      config.module.loaders = removePluginLoaderFromLoadersConfig(config.module.loaders);

    if (config.module.postLoaders)
      config.module.postLoaders = removePluginLoaderFromLoadersConfig(config.module.postLoaders);
  }

  return config;
}

module.exports = createExamplesCompilerConfig;