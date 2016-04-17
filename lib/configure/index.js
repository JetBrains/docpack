var LOADER_PATH = require('./loader').LOADER_PATH;
var defaultConfig = require('../config');
var extend = require('extend');
var parseQuery = require('loader-utils').parseQuery;
var validateConfig = require('./validateConfig');

/**
 * @param {DocsPluginConfig} config
 * @returns {DocsPluginConfig}
 */
function configure(config) {
  var cfg = extend(true, {}, defaultConfig, config || {});
  validateConfig(cfg);
  return cfg;
}

/**
 * @param {Array<LoaderConfig>} loadersConfig
 * @returns {Array<DocsPluginConfig>}
 */
function generateConfigFromLoaders(loadersConfig) {
  var config = [];

  loadersConfig.forEach(function (loaderConfig) {
    if (loaderConfig.loader.indexOf(LOADER_PATH) != -1) {
      var matcher = {};

      Object.keys(loaderConfig).forEach(function(prop) {
        if (prop === 'test' || prop === 'include' || prop === 'exclude')
          matcher[prop] = loaderConfig[prop];
      });

      var query = loaderConfig.loader.lastIndexOf('?') != -1
        ? loaderConfig.loader.substr(loaderConfig.loader.lastIndexOf('?'))
        : '';
      var parsedQuery = parseQuery(query);
      parsedQuery.matcher = matcher;

      var cfg = configure(parsedQuery);
      config.push(cfg);
    }
  });

  return config;
}

module.exports = configure;
module.exports.generateFromLoadersConfig = generateConfigFromLoaders;