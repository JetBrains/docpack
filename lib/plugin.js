var path = require('path');
var extend = require('object-assign');
var clone = require('clone');
var consolidate = require('consolidate');
var differ = require('deep-diff').diff;
var emitFile = require('./utils/emit-file');

var docsLoaderPath = require.resolve('./extract-docs-loader.js');

var defaultConfig = {
  templateEngine: 'nunjucks',
  docFileName: 'docs/[path][name].[ext]/index.html'
};

/**
 * @param {Object} [config]
 * @constructor
 */
function DocsPlugin(config) {
  this.config = extend({}, defaultConfig, config || {});
  this.oldFiles = {};
  this.files = {};
}

DocsPlugin.extract = function (options) {
  return docsLoaderPath + (options ? '?' + JSON.stringify(options) : '');
};

DocsPlugin.prototype.apply = function (compiler) {
  var plugin = this;
  var templateEngine = consolidate[this.config.templateEngine];

  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('normal-module-loader', function (loaderContext) {
      loaderContext[__dirname] = plugin;
    });
  });

  compiler.plugin('emit', function (compilation, done) {
    var delta = differ(plugin.oldFiles, plugin.files);
    if (!delta) done();
    var c = 0;

    plugin.oldFiles = clone(plugin.files);

    var needToEmitDiffs = delta.filter(function(diff) {
      return diff.kind === 'N' && diff.path.length === 1 ||
             diff.kind === 'E' && diff.path.length === 2;
    });

    needToEmitDiffs.forEach(function(diff) {
      var key = diff.path[0];
      var file = plugin.files[key];

      templateEngine(
        file.templatePath,
        {file: file, files: plugin.files},
        function (err, content) {
          if (err) throw err;

          emitFile(compilation, file.path, content);

          c++;
          if (c === needToEmitDiffs.length)
            done();
        }
      );
    });
  });
};

module.exports = DocsPlugin;
module.exports.defaultConfig = defaultConfig;
module.exports.docsLoaderPath = docsLoaderPath;
