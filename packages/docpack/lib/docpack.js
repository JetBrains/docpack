var path = require('path');
var merge = require('merge-options');
var Promise = require('bluebird');
var utils = require('webpack-toolkit');
var isPlainObject = require('is-plain-object');
var format = require('util').format;

var HOOKS = require('./hooks');
var DocpackPlugin = require('./utils/DocpackPlugin');
var Source = require('./data/Source');

var defaultConfig = {
  test: /\.js$/,
  exclude: /node_modules/
};

function Docpack(config) {
  if (this instanceof Docpack == false) {
    return new Docpack(config);
  }

  var cfg = {};
  if (config instanceof RegExp) {
    cfg = {test: config};
  } else if (isPlainObject(config)) {
    cfg = config;
  }

  this.config = merge(defaultConfig, cfg);
  this.sources = [];
  this.plugins = [];
}

module.exports = Docpack;

Docpack.API_VERSION = '1.2';

Docpack.HOOKS = HOOKS;

Docpack.defaultConfig = defaultConfig;

Docpack.DocpackPlugin = DocpackPlugin;

Docpack.createPlugin = DocpackPlugin.create;

Docpack.prototype.plugins = null;

/**
 * @param {DocpackPlugin|String} arg
 * @param {Function} [handler]
 * @returns {Docpack}
 */
Docpack.prototype.use = function(arg, handler) {
  var instance;

  if (typeof arg == 'string' && typeof handler == 'function') {
    instance = Docpack.createPlugin({
      apply: function (compiler) {
        compiler.plugin('compilation', function (compilation) {
          compilation.plugin(arg, handler);
        });
      }
    })();

  } else if (arg instanceof DocpackPlugin) {
    instance = arg;

  } else {
    throw new TypeError('DocpackPlugin instance or (hook:String, handler:Function) should be provided');
  }

  this.plugins.push(instance);
  return this;
};

/**
 * @param {Source} source
 */
Docpack.prototype.save = function(source) {
  var sources = this.sources;
  var alreadyExist = sources.filter(function(item) { return item.path === source.path })[0];

  alreadyExist
    ? sources[sources.indexOf(alreadyExist)] = source
    : sources.push(source);
};

/**
 * @param {Compiler} compiler
 */
Docpack.prototype.apply = function(compiler) {
  if (compiler.parentCompilation) {
    return false;
  }

  var docpack = this;
  var promises;
  var applyPluginsWaterfall;

  if (docpack.plugins.length > 0) {
    compiler.apply.apply(compiler, docpack.plugins);
  }

  compiler.plugin('after-plugins', function () {
    this.applyPlugins(HOOKS.INIT, compiler);
  });

  compiler.plugin('this-compilation', function (compilation) {
    applyPluginsWaterfall = Promise.promisify(compilation.applyPluginsAsyncWaterfall, {context: compilation});

    compilation.plugin('optimize-tree', function (chunks, modules, done) {
      var filesToProcess = utils.getAffectedFiles(compilation).filter(function(filepath) {
        return utils.matcher(docpack.config, filepath);
      });

      promises = Promise.map(filesToProcess, function (filepath) {
        return utils.readFile(compiler.inputFileSystem, filepath)
          .then(function (content) {
            return new Source({
              absolutePath: filepath,
              path: path.relative(compiler.options.context, filepath),
              content: content.toString()
            });
          })
        })

        .then(function(sources) {
          return applyHook(applyPluginsWaterfall, HOOKS.BEFORE_EXTRACT, sources);
        })

        .then(function(sources) {
          return applyHook(applyPluginsWaterfall, HOOKS.EXTRACT, sources);
        })

        .then(function(sources) {
          return applyHook(applyPluginsWaterfall, HOOKS.AFTER_EXTRACT, sources);
        })

        .each(function(source) {
          docpack.save(source);
          return source;
        })

        .then(function(sources) {
          done();
          return sources;
        })

        .catch(done);
    });
  });

  compiler.plugin('emit', function (compilation, done) {
    promises
      .then(function (sources) {
        return applyHook(applyPluginsWaterfall, HOOKS.BEFORE_GENERATE, sources);
      })

      .then(function (sources) {
        return applyHook(applyPluginsWaterfall, HOOKS.GENERATE, sources);
      })

      .then(function (sources) {
        return applyHook(applyPluginsWaterfall, HOOKS.AFTER_GENERATE, sources);
      })

      .then(function (sources) {
        return applyHook(applyPluginsWaterfall, HOOKS.EMIT, sources);
      })

      .catch(done)

      .finally(function () {
        done();
        return null;
      });
  });

  return true;
};

/**
 * @param {Function} applyPluginsFunc Promisified Tapable apply method
 * @param {String} hook {@see HOOKS}
 * @param {Array<Source>} sources
 * @returns {Promise<Array<Source>>}
 */
function applyHook(applyPluginsFunc, hook, sources) {
  return applyPluginsFunc(hook, sources)
    .then(function (sources) {
      if (!Array.isArray(sources)) {
        return Promise.reject(
          new TypeError(format('Plugin should return an array (occured in \'%s\')', hook))
        );
      }
      return sources;
    });
}
