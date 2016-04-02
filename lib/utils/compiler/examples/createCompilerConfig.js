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
  var module = config.module;

  delete config.entry;

  if (config.plugins) {
    config.plugins = baseConfig.plugins.filter(function (plugin) {
      return !(plugin instanceof DocsPlugin);
    });
  }

  if (module) {
    if (module.preLoaders)
      module.preLoaders = removePluginLoaderFromLoadersConfig(module.preLoaders);

    if (module.loaders)
      module.loaders = removePluginLoaderFromLoadersConfig(module.loaders);

    if (module.postLoaders)
      module.postLoaders = removePluginLoaderFromLoadersConfig(module.postLoaders);
  }

  return config;
}

module.exports = createExamplesCompilerConfig;