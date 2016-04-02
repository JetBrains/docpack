var consolidate = require('consolidate');
var extend = require('./utils/extend');
var generateLoaderString = require('./utils/loader/generateLoaderRequestString');
var validateConfig = require('./utils/plugin/validateConfig');

var defaultConfig = require('./config');

/**
 * @param {DocsPluginConfig} [config]
 * @constructor
 */
function DocsPlugin (config) {
  this.configure(config);
  this.pages = {};
}

DocsPlugin.loaderPath = require.resolve('./loader');

DocsPlugin.sharedLoaderPath = require.resolve('./loader');

/**
 * @static
 * @param {DocsPluginConfig} options
 * @param {string} [resourcePath]
 * @returns {string}
 */
DocsPlugin.extract = function (options, resourcePath) {
  return generateLoaderString(DocsPlugin.loaderPath, options, resourcePath);
};

/**
 * @param {DocsPluginConfig} config
 */
DocsPlugin.prototype.configure = function (config) {
  var cfg = extend(defaultConfig, config || {});
  validateConfig(cfg);
  this.config = cfg;
};

/**
 * @type {DocsPluginConfig}
 */
DocsPlugin.prototype.config = null;

/**
 * @param {string} template Template path
 * @param {Object} context Template context object
 * @param {Function} callback
 */
DocsPlugin.prototype.render = function (template, context, callback) {
  var templateEngine = this.config.templateEngine.name;
  consolidate[templateEngine](template, context, callback);
};

/**
 * @param {Compiler} compiler
 */
DocsPlugin.prototype.apply = function (compiler) {
  var plugin = this;
  var shouldFireOnPageBuild = typeof this.config.onPageBuild === 'function';
  var loaderPath = DocsPlugin.loaderPath;

  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('normal-module-loader', function (loaderContext) {
      loaderContext[loaderPath] = plugin;
    });
  });

  compiler.plugin('emit', function (compilation, done) {
    if (shouldFireOnPageBuild)
      plugin.config.onPageBuild.call(this, plugin.pages);

    done();
  });
};

module.exports = DocsPlugin;
