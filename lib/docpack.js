var path = require('path');
var merge = require('merge-options');
var Promise = require('bluebird');
var utils = require('webpack-toolkit');
var isObject = require('is-plain-object');
var format = require('util').format;

var HOOKS = require('./hooks');
var DocpackPlugin = require('./docpackPlugin');
var Source = require('./data/Source');

var defaultConfig = {
  test: /\.js$/,
  exclude: /node_modules/
};

function Docpack(config) {
  if (this instanceof Docpack == false) {
    return new Docpack(config);
  }

  var cfg;
  if (config instanceof RegExp) {
    cfg = {test: config};
  } else if (isObject(config)) {
    cfg = config;
  } else {
    cfg = {};
  }

  this.config = merge(defaultConfig, cfg);
  this.sources = [];
  this.plugins = [];
}

module.exports = Docpack;

Docpack.API_VERSION = '1.0';

Docpack.HOOKS = HOOKS;

Docpack.defaultConfig = defaultConfig;

Docpack.createPlugin = require('./docpackPlugin').create;

/**
 * @param {Function} applyPluginsFunc Promisified Tapable apply method
 * @param {String} hook {@see HOOKS}
 * @param {Source[]} sources
 * @returns {Promise<Source[]>}
 */
Docpack.applyHook = function applyHook(applyPluginsFunc, hook, sources) {
  return applyPluginsFunc(hook, sources)
    .then(function (sources) {
      if (!Array.isArray(sources) && sources !== null) {
        return Promise.reject(
          new TypeError(format('Plugins should return array of results or null (occured in \'%s\')', hook))
        );
      }
      return sources;
    });
};

Docpack.prototype.sources = null;

Docpack.prototype.plugins = null;

/**
 * @param {DocpackPlugin|String} arg
 * @param {Function} [handler]
 * @returns {Docpack}
 */
Docpack.prototype.use = function(arg, handler) {
  var instance;

  if (typeof arg == 'string' && typeof handler == 'function') {
    var pluginBody = function (compiler) {
      compiler.plugin('compilation', function (compilation) {
        compilation.plugin(arg, handler);
      });
    };
    instance = Docpack.createPlugin('UNNAMED', pluginBody)();
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

Docpack.prototype.apply = function(compiler) {
  var docpack = this;
  var promises;

  if (docpack.plugins.length > 0) {
    compiler.apply.apply(compiler, docpack.plugins);
  }

  compiler.plugin('after-plugins', function () {
    this.applyPlugins(HOOKS.INIT, docpack);
  });

  compiler.plugin('this-compilation', function (compilation) {
    compilation.plugin('optimize-tree', function (chunks, modules, done) {
      /** @this {Compilation} */
      var filesToProcess = utils.matcher(docpack.config, utils.getAffectedFiles(compilation));

      if (filesToProcess.length == 0) {
        promises = Promise.resolve(null);
        done();
        return null;
      }

      var applyPluginsWaterfall = Promise.promisify(compilation.applyPluginsAsyncWaterfall, {context: compilation});

      promises = Promise.map(filesToProcess, function (filepath) {
          return new Source({
            absolutePath: filepath,
            path: path.relative(compiler.options.context, filepath),
            content: utils.getModuleOriginalSource(compilation, filepath)
          });
        })

        .then(function(sources) {
          return Docpack.applyHook(applyPluginsWaterfall, HOOKS.BEFORE_EXTRACT, sources);
        })

        .then(function(sources) {
          return Docpack.applyHook(applyPluginsWaterfall, HOOKS.EXTRACT, sources);
        })

        .then(function(sources) {
          return Docpack.applyHook(applyPluginsWaterfall, HOOKS.AFTER_EXTRACT, sources);
        })

        .filter(function (result) {
          return result !== null;
        })

        .each(function(source) {
          docpack.save(source);
          return source;
        })

        .then(function(sources) {
          done();
          return sources;
        })

        .catch(done)
    });
  });

  compiler.plugin('emit', function (compilation, done) {
    var applyPluginsWaterfall = Promise.promisify(compilation.applyPluginsAsyncWaterfall, {context: compilation});

    promises
      .then(function (sources) {
        return Docpack.applyHook(applyPluginsWaterfall, HOOKS.BEFORE_GENERATE, sources);
      })

      .then(function (sources) {
        return Docpack.applyHook(applyPluginsWaterfall, HOOKS.GENERATE, sources);
      })

      .then(function (sources) {
        return Docpack.applyHook(applyPluginsWaterfall, HOOKS.AFTER_GENERATE, sources);
      })

      .catch(done)

      .finally(function () {
        done();
        return null;
      });
  });
};