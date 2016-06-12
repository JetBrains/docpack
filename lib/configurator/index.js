var LOADER_PATH = require('./loader').LOADER_PATH;
var defaultConfig = require('../config');
var extend = require('extend');
var mergeOptions = require('merge-options');
var parseQuery = require('loader-utils').parseQuery;

/**
 * @param {DocsPluginConfig} config
 * @param {DocsPluginConfig} [baseConfig]
 * @returns {DocsPluginConfig}
 */
function configure(config, baseConfig) {
  var cfg = mergeOptions(baseConfig || defaultConfig, config || {});
  return cfg;
}

/**
 * @param {Array<WebpackLoaderConfig>} loadersConfig
 * @param {WebpackLoaderConfig} [baseConfig]
 * @returns {Array<DocsPluginConfig>}
 */
function createConfigFromLoaders(loadersConfig, baseConfig) {
  var config = [];

  if (!Array.isArray(loadersConfig))
    throw new TypeError('loadersConfig should be an array of objects');

  loadersConfig.forEach(function (loaderConfig) {
    if (!('loader' in loaderConfig) || loaderConfig.loader.indexOf(LOADER_PATH) == -1)
      return;

    var match = {};

    Object.keys(loaderConfig).forEach(function (prop) {
      if (prop === 'test' || prop === 'include' || prop === 'exclude')
        match[prop] = loaderConfig[prop];
    });

    var query = loaderConfig.loader.lastIndexOf('?') != -1
      ? loaderConfig.loader.substr(loaderConfig.loader.lastIndexOf('?'))
      : '';
    var parsedQuery = parseQuery(query);
    extend(true, parsedQuery, match);

    var cfg = configure(parsedQuery, baseConfig);
    config.push(cfg);
  });

  return config;
}

module.exports = configure;
module.exports.createConfigFromLoaders = createConfigFromLoaders;