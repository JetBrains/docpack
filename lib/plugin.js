var path = require('path');
var HOOKS = require('./hooks');
var defaultConfig = require('./config');
var configure = require('./configuration');
var configureLoaderPath = require('./configuration/loader').LOADER_PATH;
var Promise = require('bluebird');
var arrayFrom = require('./utils/arrayFrom');
var getConfig = require('./configuration/getConfig');

var generateLoadersString = require('./utils/loader/generateLoaderRequestString');
var getAffectedFiles = require('./compilation/getAffectedFiles');
var findFilesToProcess = require('./utils/findFilesToProcess');
var Source = require('./data/Source');

var readFile = require('./utils/readFile');
var addEntry = require('./utils/compiler/addSingleEntry');


/**
 * @param {DocsPluginConfig} [config]
 * @constructor
 */
function DocsPlugin(config) {
  this.config = {
    initial: configure(config),
    loaders: []
  };
}

/**
 * @type {Compiler}
 * @private
 */
DocsPlugin.prototype._compiler = null;

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
 * @param {DocsPluginConfig} config
 * @param {string} [entryPath]
 * @returns {string}
 * @static
 */
DocsPlugin.extract = function(config, entryPath) {
  return generateLoadersString(configureLoaderPath, config, entryPath);
};

/**
 * @type {Object}
 * @property {DocsPluginConfig} initial
 * @property {Array<DocsPluginConfig>} loaders
 */
DocsPlugin.prototype.config = null;

/**
 * @param {string} [filepath]
 * @returns {DocsPluginConfig}
 */
DocsPlugin.prototype.getConfig = function(filepath) {
  var config = getConfig(this.config, filepath);
};

/**
 * @param {string} filepath
 * @returns {Promise}
 */
DocsPlugin.prototype.readFile = function(filepath) {
  return readFile(filepath, this._compiler.inputFileSystem);
};

/**
 * @param {string} name
 * @param {string} path Request path to entry. May contain loaders string.
 * @param {string} [contextPath]
 */
DocsPlugin.prototype.addEntry = function(name, path, contextPath) {
  addEntry(this._compiler, name, path, contextPath);
};

/**
 * @param {Compiler} compiler
 */
DocsPlugin.prototype.apply = function (compiler) {
  this._compiler = compiler;
  var plugin = this;

  // Configure loaders config
  var config = plugin.config;
  config.loaders = configure.createConfigFromLoaders(
    compiler.options.module.loaders,
    plugin.config.initial
  );

  config.initial.plugins.forEach(function(plugin) {
    compiler.apply(plugin);
  });

  compiler.plugin('after-plugins', function () {
    this.applyPlugins(HOOKS.CONFIGURE, plugin);
  });

  compiler.plugin('this-compilation', function (compilation) {
    var applyPluginsAsync = Promise.promisify(compilation.applyPluginsAsyncWaterfall, {context: compilation});

    compilation.plugin('optimize-tree', function (chunks, modules, done) {
      var contextPath = this.compiler.options.context;
      var affectedFiles = getAffectedFiles(compilation);
      var filesToProcess = findFilesToProcess(affectedFiles, plugin.config);
      var sourcePromises = [];

      filesToProcess.forEach(function(file) {
        var sourcePromise =
          plugin.readFile(file.path)
          .then(function (content) {

            var source = new Source({
              path: path.relative(contextPath, file.path),
              content: content.toString('utf-8'),
              absolutePath: file.path
            });

            return applyPluginsAsync(HOOKS.SOURCE_CREATED, {source: source, plugin: plugin})
              .then(function () {
                return source
              });
          });

        sourcePromises.push(sourcePromise);
      });

      Promise.all(sourcePromises).spread(function() {
        arrayFrom(arguments).forEach(function(source) {
          console.log(source.path, source.lastModified);
        });
        done();
      })
    });
  });
};

module.exports = DocsPlugin;
