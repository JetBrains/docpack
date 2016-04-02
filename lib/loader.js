var path = require('path');
var loaderUtils = require('loader-utils');
var extend = require('./utils/extend');
var interpolateName = require('./utils/interpolateName');
var validateConfig = require('./utils/plugin/validateConfig');
var createExamplesCompiler = require('./utils/compiler/examples/createCompiler');
var getAssetsByChunkName = require('./utils/compilation/getAssetsByChunkName');
var emitFile = require('./utils/compilation/emitFile');

var loaderPath = require('./plugin').loaderPath;

function invokeExtractor(extractor, data) {
  var extractor = typeof extractor === 'string' ? require(extractor) : extractor;
  return extractor.call(this, data);
}

module.exports = function (source) {
  this.cacheable && this.cacheable();
  var done = this.async();
  var loader = this;
  var plugin = this[loaderPath];
  if (plugin === undefined) {
    throw new Error(
      'webpack-docs-plugin loader is used without the corresponding plugin, ' +
      'refer to https://github.com/kisenka/webpack-docs-plugin for the usage example'
    );
  }

  var compiler = this._compiler;
  var compilation = this._compilation;
  var fs = this._compiler.inputFileSystem;
  var contextPath = this.options.context;
  var resourcePath = this.resourcePath;
  var resourceRelativePath = path.relative(contextPath, resourcePath);
  var query = loaderUtils.parseQuery(this.query);
  var isQueryEmpty = Object.keys(query).length == 0;
  var config = plugin.config;

  if (isQueryEmpty) {
    config = extend(plugin.config, query);
    validateConfig(config);
  }

  var page = null;

  // Page extractor
  if (config.page.extractor) {
    page = invokeExtractor.call(loader, config.page.extractor, source);

    if (page === null)
      return null;
  }

  // Examples extractor
  if (config.examples.extractor && page) {
    invokeExtractor.call(loader, config.examples.extractor, page);

    // Find items to compile
    var itemsToCompile = [];
    page.items
      .filter(function(item) { return item.examples.length > 0 })
      .forEach(function(item) {
        item.examples.forEach(function(example) {
          itemsToCompile = itemsToCompile.concat(example.items.filter(function(item) {
            // TODO: filter from config
            return item.type === 'js';
          }));
        })
      });

    if (itemsToCompile.length) {
      var webpackConfig = plugin.config.examples.webpackConfig || compiler.options;
      var childCompiler = createExamplesCompiler(webpackConfig, itemsToCompile, resourcePath);

      childCompiler.run(function (err, stats) {
        var assets = getAssetsByChunkName(stats.compilation);
        if (assets) {
          Object.keys(assets).forEach(function(chunkName) {
            assets[chunkName].forEach(function(asset) {
              loader.emitFile(asset.path, asset.content);
            });
          });
          done(null, '');
        }
      });
    }
  }

  var url = interpolateName(config.page.namePattern, {
    path: resourcePath,
    context: contextPath
  });
  //var lastModified = new Date(fs.statSync(resourcePath).mtime);

  page.url = url;
  page.source.path = resourceRelativePath;
  page.source.absolutePath = resourcePath;
  page.source.content = source;
  //page.source.lastModified = lastModified;
  //plugin.pages[resourceRelativePath] = page;

  return source;
};