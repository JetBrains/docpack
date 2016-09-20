var path = require('path');
var merge = require('merge-options');
var Promise = require('bluebird');
var utils = require('webpack-toolkit');
var isObject = require('is-plain-object');

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

Docpack.prototype.sources = null;

Docpack.prototype.plugins = null;

/**
 * @param {DocpackPlugin} plugin
 * @returns {Docpack}
 */
Docpack.prototype.use = function(plugin) {
  if (!plugin || plugin instanceof DocpackPlugin == false) {
    throw new TypeError('Plugin should be instance of DocpackPlugin. Use docpack.createPlugin().');
  }
  this.plugins.push(plugin);
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
  var sources = [];
  var promises;
  var applyPlugins;
  var applyPluginsWaterfall;

  if (docpack.plugins.length > 0) {
    compiler.apply.apply(compiler, docpack.plugins);
  }

  compiler.plugin('after-plugins', function () {
    this.applyPlugins(HOOKS.INIT, docpack);
  });

  compiler.plugin('this-compilation', function (compilation) {
    applyPlugins = Promise.promisify(compilation.applyPluginsAsync, {context: compilation});
    applyPluginsWaterfall = Promise.promisify(compilation.applyPluginsAsyncWaterfall, {context: compilation});

    function handleHook(hook, sources) {
      return applyPluginsWaterfall(hook, sources)
        .then(function (sources) {
          if (typeof sources == 'undefined') {
            return Promise.reject(hook + ' should return array of results or error, undefined is not allowed');
          }
          return sources;
        });
    }

    compilation.plugin('optimize-tree', function (chunks, modules, done) {
      /** @this {Compilation} */
      var filesToProcess = utils.matcher(docpack.config, utils.getAffectedFiles(compilation));

      if (filesToProcess.length == 0) {
        done();
        return null;
      }

      sources = filesToProcess.map(function(filepath) {
        var content = compilation.modules
          .filter(function (module) { return module.resource && module._source })
          .map(function (module) { return module.resource === filepath ? module._source.source() : null })[0];

        return new Source({
          path: path.relative(compiler.options.context, filepath),
          absolutePath: filepath,
          content: content
        });
      });

      Promise.map(sources, function(source) {
          return source;
        })
        .then(function(sources) {
          return handleHook(HOOKS.BEFORE_EXTRACT, sources);
        })
        .then(function(sources) {
          return handleHook(HOOKS.BEFORE_EXTRACT, sources);
        })
        .then(function(sources) {
          return handleHook(HOOKS.AFTER_EXTRACT, sources);
        })
        .each(function(source) {
          docpack.save(source);
          return source;
        })
        .catch(done)
        .then(function (sources) {
          done();
          return sources;
        });

    });
  });
};