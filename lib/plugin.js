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
var getAffectedFiles = require('./processing/getAffectedFiles');
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
  this.docs = [];
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
DocsPlugin.prototype.registerExtractor = function (extractor) {
  if ( !('getName' in extractor) || !('extract' in extractor) )
    throw new PluginError('Extractor must have at least `getName` and `extract` methods');

  var extractors = this.extractors;
  var name = extractor.getName();

  if (name in extractors)
    throw new PluginError('Extractor with name "%s" already exist', name);

  extractors[name] = extractor;
};

/**
 * @param {ExtractorResult} result
 */
DocsPlugin.prototype.save = function(result) {
  var docs = this.docs;
  var alreadyExist = docs.filter(function(item) { return item.id == result.id })[0];

  if (alreadyExist)
    docs[docs.indexOf(alreadyExist)] = result;
  else
    docs.push(result);
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
  var processPromises;

  // Configure loaders config
  var config = plugin.config;
  config.loaders = configure.createConfigFromLoaders(
    compiler.options.module.loaders || [],
    plugin.config.initial
  );

  config.initial.plugins.forEach(function(plugin) {
    compiler.apply(plugin);
  });

  compiler.plugin('after-plugins', function () {
    this.applyPlugins(HOOKS.CONFIGURE, plugin);
  });

  compiler.plugin('this-compilation', function (compilation) {
    var applyPlugins = Promise.promisify(compilation.applyPluginsAsyncWaterfall, {context: compilation});

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

      processPromises = Promise.map(filesToProcess, function (filepath) {
        return plugin.readFile(filepath, 'utf-8')

          /* Create source */
          .then(function(content) {
            return new Source({
              path: path.relative(contextPath, filepath),
              absolutePath: filepath,
              content: content.toString()
            });
          })

          /**
           * Apply plugins to modify/extend source object
           * @see HOOKS.SOURCE_CREATED
           */
          .then(function(source) {
            return applyPlugins(HOOKS.SOURCE_CREATED, source)
              .then(function () {
                return source;
              });
          });
      })

      /**
       * Apply plugins to filter sources
       * @see HOOKS.FILTER_SOURCES
       */
      .then(function(sources) {
        return applyPlugins(HOOKS.FILTER_SOURCES, sources);
      })

      /* Extract each file */
      .map(function(source) {
        var extractorName = plugin.getConfig(source.absolutePath).extractor;
        if (!(extractorName in plugin.extractors))
          return Promise.reject(new PluginError('Extractor "%s" not found', extractorName));

        var extractor = plugin.extractors[extractorName];
        var optionsFromLoader = plugin.getConfig(source.absolutePath).extractorOptions;
        var options = mergeOptions(extractor.options, optionsFromLoader || {});

        return extractDocs(source, extractor.extract, options, compilation);
      })

      /* Skip null results from extractor */
      .filter(function(result) {
        return result !== null;
      })

      /**
       * Apply plugins to filter extracted results
       * @see HOOKS.FILTER_EXTRACTED_RESULTS
       */
      .then(function(results) {
        return applyPlugins(HOOKS.FILTER_EXTRACTED_RESULTS, results);
      })

      /* Save result */
      .each(function(result) {
        plugin.save(result);
        return result;
      })

      /**
       * Apply plugins to postprocess extracted results
       * @see HOOKS.POSTPROCESS_EXTRACTED_RESULTS
       */
      .then(function(results) {
        return applyPlugins(HOOKS.POSTPROCESS_EXTRACTED_RESULTS, {
          results: results,
          plugin: plugin
        })
        .then(function() {
          return results;
        });
      })

      .then(function (results) {
        done();
        return results;
      });
    });
  });

  compiler.plugin('emit', function (compilation, done) {
    var applyPlugins = Promise.promisify(compilation.applyPluginsAsyncWaterfall, {context: compilation});

    /**
     * Apply plugins on emit phase
     * @see HOOKS.EMIT_RESULTS
     */
    processPromises.then(function(results) {
      return applyPlugins(HOOKS.EMIT_RESULTS, {
        results: results,
        plugin: plugin
      })
    })
    .then(function () {
      done();
      return null;
    });

  });
};

module.exports = DocsPlugin;
