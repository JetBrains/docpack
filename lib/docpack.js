var path = require('path');
var HOOKS = require('./hooks');
var configurator = require('./configurator');
var configureLoaderPath = require('./configurator/loader').LOADER_PATH;
var Promise = require('bluebird');
var mergeOptions = require('merge-options');
var format = require('util').format;

var getConfig = require('./configurator/getConfig');

var stringifyLoaderRequest = require('webpack-toolkit/lib/stringifyLoaderRequest');
var getAffectedFiles = require('webpack-toolkit/lib/getAffectedFiles');
var findFilesToProcess = require('./processing/findFilesToProcess');
var Source = require('./data/Source');
var extract = require('./processing/extractDocs');

var readFile = require('webpack-toolkit/lib/readFile');

/**
 * @param {DocpackConfig} [config]
 * @constructor
 */
function Docpack(config) {
  if (this instanceof Docpack == false) {
    return new Docpack(config);
  }

  this.config = {
    initial: configurator(config),
    loaders: []
  };

  this.extractors = {};
  this.sources = [];
}

/**
 * @static
 */
Docpack.API_VERSION = '1.0';

/**
 * @static
 * @type {DocpackHooks}
 */
Docpack.HOOKS = HOOKS;

/**
 * @static
 */
Docpack.createPlugin = require('./utils/createPlugin');

/**
 * @param {DocpackConfig} [config]
 * @param {string} [entryPath]
 * @returns {string}
 * @static
 */
Docpack.extract = function(config, entryPath) {
  return stringifyLoaderRequest(configureLoaderPath, config, entryPath);
};

/**
 * @type {Compiler} Webpack compiler instance
 * @private
 */
Docpack.prototype.compiler = null;

/**
 * @type {Object}
 * @property {DocpackConfig} initial
 * @property {Array<DocpackConfig>} loaders
 */
Docpack.prototype.config = null;

/**
 * @type {Object<string, DocpackExtractor>}
 */
Docpack.prototype.extractors = null;

/**
 * @type {Array<Source>}
 */
Docpack.prototype.sources = null;

/**
 * @param {string} [filepath]
 * @returns {DocpackConfig}
 */
Docpack.prototype.getConfig = function(filepath) {
  if (!filepath)
    return this.config.initial;

  var config = getConfig(this.config, filepath);
  return config ? config : this.config.initial;
};

/**
 * @param {ExtractorPlugin} extractor
 * TODO: simplify extractor registration
 */
Docpack.prototype.registerExtractor = function (extractor) {
  if ( typeof extractor.getName != 'function' || typeof extractor.extract != 'function' || typeof extractor.apply != 'function' ) {
    throw new Error('Extractor should have at least `getName`, `extract` and `apply` methods');
  }

  var extractors = this.extractors;
  var name = extractor.getName();

  if (name in extractors) {
    throw new Error(format('Extractor with name "%s" already exist', name));
  }

  extractors[name] = extractor;
};

/**
 * @param {Source} source
 */
Docpack.prototype.save = function(source) {
  var sources = this.sources;
  var alreadyExist = sources.filter(function(item) { return item.path == source.path })[0];

  alreadyExist
    ? sources[sources.indexOf(alreadyExist)] = source
    : sources.push(source);
};

/**
 * @param {Compiler} compiler
 */
Docpack.prototype.apply = function (compiler) {
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
        return readFile(compiler.inputFileSystem, filepath)

          /* Create source */
          .then(function(content) {
            return new Source({
              path: path.relative(plugin.compiler.options.context, filepath),
              absolutePath: filepath,
              content: content.toString()
            });
          });
      })

      /* Extract each file */
      .map(function(source) {
        var extractorName = plugin.getConfig(source.absolutePath).extractor;
        var extractor = plugin.extractors[extractorName];

        // Skip if extractor not defined
        if (!extractorName) {
          return Promise.resolve(null);
        }
        else if (!extractor) {
          return Promise.reject( new Error(format('Extractor "%s" not found', extractorName)) );
        }

        var optionsFromLoader = plugin.getConfig(source.absolutePath).extractorOptions;
        var options = mergeOptions(extractor.options, optionsFromLoader || {});

        return extract(source, extractor.extract, options, compilation);
      })

      /* Skip null results from extractor */
      .filter(function(result) {
        return result !== null;
      })

      /* Save result */
      .each(function(source) {
        plugin.save(source);
        return source;
      })

      /**
       * Apply plugins to process extracted results
       * @see HOOKS.PROCESS
       */
      .then(function(sources) {
        return applyPlugins(HOOKS.PROCESS, {
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
     * @see HOOKS.EMIT
     */
    promises.then(function(results) {
      return applyPlugins(HOOKS.EMIT, {
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

module.exports = Docpack;
