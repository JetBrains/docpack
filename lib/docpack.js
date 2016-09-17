var merge = require('merge-options');
var Promise = require('bluebird');
var utils = require('webpack-toolkit');

var HOOKS = require('./hooks');
var DocpackPlugin = require('./utils/DocpackPlugin');

var defaultConfig = {
  test: /\.js$/,
  exclude: /node_modules/
};

function Docpack(config) {
  if (this instanceof Docpack == false) {
    return new Docpack(config);
  }

  this.config = merge(defaultConfig, config);
  this.sources = [];
  this.plugins = [];
}

module.exports = Docpack;

Docpack.API_VERSION = '1.0';

Docpack.HOOKS = HOOKS;

Docpack.defaultConfig = defaultConfig;

Docpack.createPlugin = require('./utils/DocpackPlugin').create;

Docpack.prototype.sources = null;

Docpack.prototype.plugins = null;

Docpack.prototype.use = function(plugin) {
  if (!plugin || plugin instanceof DocpackPlugin == false) {
    throw new TypeError('Plugin should be instance of DocpackPlugin. Use docpack.createPlugin().');
  }
  this.plugins.push(plugin);
  return this;
};

Docpack.prototype.apply = function(compiler) {
  var docpack = this;
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

    compilation.plugin('optimize-tree', function (chunks, modules, done) {
      /** @this {Compilation} */

      var affectedFiles = utils.getAffectedFiles(compilation);
      var filesToProcess = utils.matcher(docpack.config, affectedFiles);

      if (filesToProcess.length == 0) {
        done();
        return null;
      }
    });
  });
};