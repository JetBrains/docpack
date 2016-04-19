var path = require('path');
var HOOKS = require('./hooks');
var defaultConfig = require('./config');
var configure = require('./configuration');
var configureLoaderPath = require('./configuration/loader').LOADER_PATH;
var Promise = require('bluebird');
var SuperError = require('./utils/SuperError');
var arrayFrom = require('./utils/arrayFrom');
var getConfig = require('./configuration/getConfig');

var generateLoadersString = require('./utils/loader/generateLoaderRequestString');
var getAffectedFiles = require('./compilation/getAffectedFiles');
var findFilesToProcess = require('./processing/findFilesToProcess');
var Source = require('./data/Source');
var extractDocs = require('./processing/extractDocs');
var DocsNotFoundException = require('./processing/DocsNotFoundException');

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

  this.extractors = {};
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
 * @param {DocsPluginConfig} [config]
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
 * @type {Object<string, DocsPluginExtractor>}
 */
DocsPlugin.prototype.extractors = null;

/**
 * @param {string} [filepath]
 * @returns {DocsPluginConfig}
 */
DocsPlugin.prototype.getConfig = function(filepath) {
  if (!filepath)
    return this.config.initial;

  var config = getConfig(this.config, filepath);
  return config ? config : this.config.initial;
};

/**
 * @param {string} name
 * @param {DocsPluginExtractor} extractor
 */
DocsPlugin.prototype.registerExtractor = function(name, extractor) {
  this.extractors[name] = extractor;
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
      var extractorsNames = Object.keys(plugin.extractors);
      if (extractorsNames.length == 0) {
        return done('At least one extractor should be provided');
      }
      else if (extractorsNames.length == 1) {
        config.initial.extractor = config.initial.extractor || extractorsNames[0];
        config.loaders.forEach(function(cfg) {
          cfg.extractor = cfg.extractor || extractorsNames[0];
        })
      }

      var contextPath = this.compiler.options.context;
      var affectedFiles = getAffectedFiles(compilation);
      var filesToProcess = findFilesToProcess(affectedFiles, plugin.config);
      var sourcePromises = [];

      filesToProcess.forEach(function(file) {
        var sourcePromise = plugin.readFile(file.path)

          // Source
          .then(function (content) {

            var source = new Source({
              path: path.relative(contextPath, file.path),
              content: content.toString('utf-8'),
              absolutePath: file.path
            });

            return applyPluginsAsync(HOOKS.SOURCE_CREATED, {source: source, plugin: plugin})
              .then(function () { return source });
          })

          // Extractor
          .then(function(source) {
            var extractorName = plugin.getConfig(source.absolutePath).extractor;
            if (!(extractorName in plugin.extractors))
              return Promise.reject(new SuperError('Extractor "%s" not found', extractorName));

            var extractor = plugin.extractors[extractorName];
            var options = plugin.getConfig(source.absolutePath).extractorOptions;
            return extractDocs(source, extractor, options, compilation);
          })

          .then(function(result) {
            console.log(result);
          });

        sourcePromises.push(sourcePromise);
      });

      Promise.all(sourcePromises).spread(function() {
        arrayFrom(arguments).forEach(function(source) {
          //console.log(source.path, source.lastModified);
        });
        done();
      })
    });
  });
};

module.exports = DocsPlugin;
