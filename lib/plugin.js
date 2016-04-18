var path = require('path');
var HOOKS = require('./hooks');
var defaultConfig = require('./config');
var configure = require('./configure');
var configureLoaderPath = require('./configure/loader').LOADER_PATH;
var generateLoadersString = require('./utils/loader/generateLoaderRequestString');

var matchObject = require('webpack/lib/ModuleFilenameHelpers').matchObject;
var addEntry = require('./utils/compiler/addSingleEntry');


/**
 * @param {DocsPluginConfig} [config]
 * @constructor
 */
function DocsPlugin (config) {
  this.config = [configure(config)];
}

/**
 * @param {DocsPluginConfig} config
 * @param {string} [entryPath]
 * @returns {string}
 * @static
 */
DocsPlugin.extract = function(config, entryPath) {
  return generateLoadersString(configureLoaderPath, config, entryPath);
};

/**
 * @type {DocsPluginHooks}
 * @static
 */
DocsPlugin.HOOKS = HOOKS;

/**
 * @type {DocsPluginConfig}
 * @static
 */
DocsPlugin.defaultConfig = defaultConfig;

/**
 * @type {Array.<DocsPluginConfig>}
 */
DocsPlugin.prototype.config = null;

/**
 * @type {Compiler}
 * @private
 */
DocsPlugin.prototype._compiler = null;

/**
 * @param {string} filepath
 * @returns {DocsPluginConfig}
 */
DocsPlugin.prototype.getConfig = function (filepath) {
  var cfg = this.config.filter(function (config) {
    return matchObject(config.matcher, filepath)
  });

  return cfg.length > 0 ? cfg[0] : null;
};

DocsPlugin.prototype.addEntry = function(name, path, contextPath) {
  addEntry(this._compiler, name, path, contextPath);
};

/**
 * @param {Compiler} compiler
 */
DocsPlugin.prototype.apply = function (compiler) {
  this._compiler = compiler;
  var plugin = this;
  var cfg = configure.createConfigFromLoaders(compiler.options.module.loaders);
  if (cfg.length)
    this.config = cfg;

  compiler.plugin('after-plugins', function () {
    this.applyPlugins(HOOKS.CONFIGURE, plugin);
  });
};

module.exports = DocsPlugin;
