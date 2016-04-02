var consolidate = require('consolidate');
var extend = require('./utils/extend');
var generateLoaderString = require('./utils/loader/generateLoaderRequestString');
var validateConfig = require('./utils/plugin/validateConfig');

var defaultConfig = require('./config');
var loaderPath = require.resolve('./extract-docs-loader.js');

/**
 * @param {PluginConfig} [config]
 * @constructor
 */
function DocsPlugin (config) {
  this.configure(config);
  this.pages = {};
}

/**
 * @static
 */
DocsPlugin.defaultConfig = defaultConfig;

/**
 * @static
 */
DocsPlugin.loaderPath = loaderPath;

/**
 * @static
 */
DocsPlugin.extract = function (options, resourcePath) {
  return generateLoaderString(loaderPath, options, resourcePath);
};

/**
 * @static
 * @param config
 */
DocsPlugin.prototype.configure = function (config) {
  var cfg = extend(defaultConfig, config || {});
  validateConfig(cfg);
  this.config = cfg;
};

/**
 * @type {PluginConfig}
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

DocsPlugin.prototype.apply = function (compiler) {
  var plugin = this;

  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('normal-module-loader', function (loaderContext) {
      loaderContext[__dirname] = plugin;
    });
  });

  compiler.plugin('emit', function (compilation, done) {
    var delta = differ(plugin.oldFiles, plugin.files);
    if (!delta) done();
    var c = 0;

    plugin.oldFiles = clone(plugin.files);

    var needToEmitDiffs = delta.filter(function(diff) {
      return diff.kind === 'N' && diff.path.length === 1 ||
             diff.kind === 'E' && diff.path.length === 2;
    });

    if (!needToEmitDiffs)
      done();

    needToEmitDiffs.forEach(function(diff) {
      var key = diff.path[0];
      var file = plugin.files[key];

      templateEngine(
        file.templatePath,
        {file: file, files: plugin.files},
        function (err, content) {
          if (err) throw err;

          emitFile(compilation, file.path, content);
          c++;
          if (c === needToEmitDiffs.length)
            done();
        }
      );
    });
  });
};

module.exports = DocsPlugin;
