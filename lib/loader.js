var path = require('path');
var loaderUtils = require('loader-utils');
var extend = require('./utils/extend');
var Promise = require('bluebird');
var sprintf = require('sprintf');
var flatten = require('./utils/flatten');
var interpolateName = require('./utils/interpolateName');

var validateConfig = require('./utils/plugin/validateConfig');
var Example = require('./data/Example');
var ExampleFile = require('./data/ExampleFile');
var Asset = require('./data/Asset');
var createExamplesCompiler = require('./utils/compiler/examples/createCompiler');
var getAssetsByChunkName = require('./utils/compilation/getAssetsByChunkName');
var findFilesToCompile = require('./utils/compiler/examples/findFilesToCompile');
var findFilesToEmit = require('./utils/compiler/examples/findFilesToEmit');

var loaderPath = require('./plugin').loaderPath;

function callExtractor(extractor, data) {
  var extractor = typeof extractor === 'string' ? require(extractor) : extractor;
  return extractor.call(this, data);
}

module.exports = function (source) {
  this.cacheable && this.cacheable();
  var done = this.async().bind(null, null, '');
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
  var pluginConfig = plugin.config;
  var config = pluginConfig;
  if (!isQueryEmpty) {
    config = extend(pluginConfig, query);
    validateConfig(config);
  }

  var page = null;
  var promises = [];

  // Page extractor
  if (config.page.extractor) {
    page = callExtractor.call(loader, config.page.extractor, source);
    if (page === null)
      return done();
  }

  plugin.pages[resourceRelativePath] = page;

  page.source.path = resourceRelativePath;
  page.source.absolutePath = resourcePath;
  page.source.content = source;
  page.path = interpolateName(config.page.namePattern, {
    path: resourcePath,
    context: contextPath
  });

  // page.lastModified
  promises.push(new Promise(function(resolve, reject) {
    fs.stat(resourcePath, function(err, result) {
      page.lastModified = new Date(result.mtime);
      resolve();
    });
  }));

  if (!config.example.extractor)
    return done();

  // Examples extractor
  callExtractor.call(loader, config.example.extractor, page);
  var examples = flatten(page.items, function(item) { return item instanceof Example });
  var files = flatten(page.items, function(item) { return item instanceof ExampleFile });
  var filesToCompile = findFilesToCompile(files, config.example.files.compile);

  if (filesToCompile.length) {
    var webpackConfig = pluginConfig.example.webpackConfig || compiler.options;
    var examplesCompiler = createExamplesCompiler(webpackConfig, filesToCompile, resourcePath);
    var pageDirName = path.dirname(page.path);

    // Compile assets
    var examplesPromise = new Promise(function (resolve, reject) {
      examplesCompiler.run(function (err, stats) {
        resolve(getAssetsByChunkName(stats.compilation));
      });
    })

    // Save assets info
    .then(function(assets) {
      for (var chunkName in assets) {
        var file = files.filter(function (file) { return file.id === chunkName })[0];

        assets[chunkName].forEach(function (assetInfo) {
          assetInfo.path = sprintf('%s/examples/%s', pageDirName, assetInfo.path);
          var asset = new Asset(assetInfo);
          file.assets.push(asset);
        });
      }

    })

    // Emit assets
    .then(function() {
      findFilesToEmit(files, config.example.files.compile)
        .forEach(function (file) {
          file.emitAssets(compilation);
        });

    })

    // Render example page & emit
    .then(function() {
      if (!config.example.template)
        return;

      return new Promise.all(examples.map(function (example, i) {
        return plugin.render(config.example.template, {example: example})
          .then(function (result) {
            var filepath = sprintf('%s/examples/%s.html', pageDirName, i);
            loader.emitFile(filepath, result);
            example.path = filepath;
          });
      }));

    });

    promises.push(examplesPromise);
  }

  // Render & emit documentation page
  var pageRenderPromise = plugin
    .render(config.page.template, {page: page})
    .then(function (result) {
      loader.emitFile(page.path, result);
    });

  promises.push(pageRenderPromise);

  Promise.all(promises).then(done);
};