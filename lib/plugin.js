var path = require('path');
var HOOKS = require('./hooks');
var configurator = require('./configurator');
var configureLoaderPath = require('./configurator/loader').LOADER_PATH;
var Promise = require('bluebird');
var mergeOptions = require('merge-options');

var PluginError = require('./utils/PluginError');
var getConfig = require('./configurator/getConfig');

var generateLoadersString = require('./utils/loader/generateLoaderRequestString');
var getAffectedFiles = require('./processing/getAffectedFiles');
var findFilesToProcess = require('./processing/findFilesToProcess');
var Source = require('./data/Source');
var extract = require('./processing/extractDocs');

var readFile = require('./utils/readFile');
var addEntry = require('./utils/addEntry');


/**
 * @param {DocsPluginConfig} [config]
 * @constructor
 */
function DocsPlugin(config) {
  this.config = {
    initial: configurator(config),
    loaders: []
  };

  this.extractors = {};
  this.sources = [];
}

/**
 * @static
 * @type {DocsPluginHooks}
 */
DocsPlugin.HOOKS = HOOKS;

/**
 * @static
 */
DocsPlugin.createPlugin = require('./utils/createPlugin');

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
 * @type {Compiler} Webpack compiler instance
 * @private
 */
DocsPlugin.prototype.compiler = null;

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
 * @type {Array<Source>}
 */
DocsPlugin.prototype.sources = null;

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
 * TODO: simplify extractor registration
 */
DocsPlugin.prototype.registerExtractor = function (extractor) {
  if ( typeof extractor.getName != 'function' || typeof extractor.extract != 'function' || typeof extractor.apply != 'function' ) {
    throw new PluginError('Extractor should have at least `getName`, `extract` and `apply` methods');
  }

  var extractors = this.extractors;
  var name = extractor.getName();

  if (name in extractors) {
    throw new PluginError('Extractor with name "%s" already exist', name);
  }

  extractors[name] = extractor;
};

/**
 * @param {Source} source
 */
DocsPlugin.prototype.save = function(source) {
  var sources = this.sources;
  var alreadyExist = sources.filter(function(item) { return item.path == source.path })[0];

  alreadyExist
    ? sources[sources.indexOf(alreadyExist)] = source
    : sources.push(source);
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
  var promises;
  var applyPlugins;
  var applyPluginsWaterfall;

  // Configure loaders config
  var config = plugin.config;
  config.loaders = configurator.createConfigFromLoaders(
    compiler.options.module.loaders || [],
    plugin.config.initial
  );

  compiler.plugin('after-plugins', function () {
    this.applyPlugins(HOOKS.CONFIGURE, plugin);
  });

  compiler.plugin('this-compilation', function (compilation) {
    applyPlugins = Promise.promisify(compilation.applyPluginsAsync, {context: compilation});
    applyPluginsWaterfall = Promise.promisify(compilation.applyPluginsAsyncWaterfall, {context: compilation});

    /** @this {Compilation} */
    compilation.plugin('optimize-tree', function (chunks, modules, done) {
      var affectedFiles = getAffectedFiles(compilation);
      var filesToProcess = findFilesToProcess(affectedFiles, plugin.config);

      if (filesToProcess.length == 0) {
        done();
        return null;
      }

      promises = Promise.map(filesToProcess, function (filepath) {
        return plugin.readFile(filepath)

          /* Create source */
          .then(function(content) {
            return new Source({
              path: path.relative(plugin.compiler.options.context, filepath),
              absolutePath: filepath,
              content: content.toString()
            });
          });
      })

      /**
       * Apply plugins to filter sources
       * @see HOOKS.FILTER_SOURCES
       */
      .then(function(sources) {
        return applyPluginsWaterfall(HOOKS.FILTER_SOURCES, sources);
      })

      /* Extract each file */
      .map(function(source) {
        var extractorName = plugin.getConfig(source.absolutePath).extractor;

        // Skip if extractor not defined
        if (!extractorName) {
          return Promise.resolve(null);
        }

        if (!(extractorName in plugin.extractors)) {
          return Promise.reject(new PluginError('Extractor "%s" not found', extractorName));
        }

        var extractor = plugin.extractors[extractorName];
        var optionsFromLoader = plugin.getConfig(source.absolutePath).extractorOptions;
        var options = mergeOptions(extractor.options, optionsFromLoader || {});

        return extract(source, extractor.extract, options, compilation);
      })

      /* Skip null results from extractor */
      .filter(function(result) {
        return result !== null;
      })

      /**
       * Apply plugins to filter extracted results
       * @see HOOKS.FILTER_EXTRACTED_RESULTS
       */
      .then(function(sources) {
        return applyPluginsWaterfall(HOOKS.FILTER_EXTRACTED_RESULTS, sources);
      })

      /* Save result */
      .each(function(source) {
        plugin.save(source);
        return source;
      })

      /**
       * Apply plugins to process extracted results
       * @see HOOKS.PROCESS_EXTRACTED_RESULTS
       */
      .then(function(sources) {
        return applyPlugins(HOOKS.PROCESS_EXTRACTED_RESULTS, {
          sources: sources,
          plugin: plugin
        })
        .then(function() {
          return sources;
        });
      })

      .catch(done)

      .then(function (results) {
        done();
        return results;
      })

    });
  });

  compiler.plugin('emit', function (compilation, done) {
    if (!promises) {
      done();
      return null;
    }

    /**
     * Apply plugins on emit phase
     * @see HOOKS.EMIT_RESULTS
     */
    promises.then(function(results) {
      return applyPlugins(HOOKS.EMIT_RESULTS, {
        results: results,
        plugin: plugin
      })
    })

    .catch(done)

    .then(function () {
      done();
      return null;
    });

  });
};

module.exports = DocsPlugin;
