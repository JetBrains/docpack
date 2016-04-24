var path = require('path');
var HOOKS = require('./hooks');
var defaultConfig = require('./config');
var configure = require('./configuration');
var configureLoaderPath = require('./configuration/loader').LOADER_PATH;
var Promise = require('bluebird');
var mergeOptions = require('merge-options');

var PluginError = require('./utils/PluginError');
var getConfig = require('./configuration/getConfig');

var generateLoadersString = require('./utils/loader/generateLoaderRequestString');
var getAffectedFiles = require('./compilation/getAffectedFiles');
var findFilesToProcess = require('./processing/findFilesToProcess');
var Source = require('./data/Source');
var extractDocs = require('./processing/extractDocs');

var readFile = require('./utils/readFile');
var addEntry = require('./utils/addEntry');


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
DocsPlugin.prototype.compiler = null;

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
 * @param {ExtractorPlugin} extractor
 */
DocsPlugin.prototype.registerExtractor = function(extractor) {
  var extractors = this.extractors;

  if (extractor.name in extractors)
    throw new PluginError('Extractor with name "%s" already exist', extractor.name);

  extractors[extractor.name] = extractor;
};

/**
 * @param {string} filepath
 * @returns {Promise}
 */
DocsPlugin.prototype.readFile = function(filepath) {
  return readFile(filepath, this.compiler.inputFileSystem);
};

/**
 * @param {string} name
 * @param {string} path Request path to entry. May contain loaders string.
 * @param {string} [contextPath]
 */
DocsPlugin.prototype.addEntry = function(name, path, contextPath) {
  addEntry(this.compiler, name, path, contextPath);
};

/**
 * @param {Compiler} compiler
 */
DocsPlugin.prototype.apply = function (compiler) {
  this.compiler = compiler;
  var plugin = this;
  var docs = [];

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

    var extractorsNames = Object.keys(plugin.extractors);
    if (extractorsNames.length == 0) {
      throw new PluginError('At least one extractor should be provided');
    }
    else if (extractorsNames.length == 1) {
      config.initial.extractor = config.initial.extractor || extractorsNames[0];
      config.loaders.forEach(function (cfg) {
        cfg.extractor = cfg.extractor || extractorsNames[0];
      })
    }

    /** @this {Compilation} */
    compilation.plugin('optimize-tree', function (chunks, modules, done) {
      var contextPath = this.compiler.options.context;
      var affectedFiles = getAffectedFiles(compilation);
      var filesToProcess = findFilesToProcess(affectedFiles, plugin.config);
      var processPromises = [];

      filesToProcess.forEach(function(filepath) {
        var sourcePromise = plugin.readFile(filepath)

          // Source
          .then(function (content) {

            var source = new Source({
              path: path.relative(contextPath, filepath),
              content: content.toString('utf-8'),
              absolutePath: filepath
            });

            return applyPluginsAsync(HOOKS.SOURCE_CREATED, {source: source, plugin: plugin})
              .then(function () { return source });
          })

          // Extractor
          .then(function(source) {
            var extractorName = plugin.getConfig(source.absolutePath).extractor;
            if (!(extractorName in plugin.extractors))
              return Promise.reject(new PluginError('Extractor "%s" not found', extractorName));

            var extractor = plugin.extractors[extractorName];
            var optionsFromLoader = plugin.getConfig(source.absolutePath).extractorOptions;
            var options = mergeOptions(extractor.options, optionsFromLoader || {});

            return extractDocs(source, extractor.extract, options, compilation);
          });

        processPromises.push(sourcePromise);
      });

      Promise
        .all(processPromises)
        .filter(function (result) {
          return result !== null
        })
        .filter(function (result) {
          return applyPluginsAsync(HOOKS.EXTRACTOR_FILTER_RESULT, result)
            .then(function(result) {
              return result;
            });
        })
        .each(function (result) {
          return applyPluginsAsync(HOOKS.EXTRACTOR_DONE, {result: result, plugin: plugin})
        })
        .each(function(result) {
          docs.push(result);
        })
        .then(function() {
          done();
        });

    });
  });

  compiler.plugin('emit', function (compilation, done) {
    done();
  });
};

module.exports = DocsPlugin;
