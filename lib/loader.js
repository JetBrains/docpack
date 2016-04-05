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
var getFileExtension = require('./utils/getFileExtension');

var loaderPath = require('./plugin').loaderPath;

function callExtractor(extractor, data) {
  var extractor = typeof extractor === 'string' ? require(extractor) : extractor;
  return extractor.call(this, data);
}

module.exports = function() {};

module.exports.pitch = function () {
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

  var pluginConfig = plugin.config;
  var config = pluginConfig;
  var query = loaderUtils.parseQuery(this.query);
  var isQueryEmpty = Object.keys(query).length == 0;
  if (!isQueryEmpty) {
    config = extend(pluginConfig, query);
    try {
      validateConfig(config);
    } catch (error) {
      return done(error);
    }
  }

  var compiler = this._compiler;
  var compilation = this._compilation;
  var fs = this._compiler.inputFileSystem;
  var contextPath = this.options.context;
  var resourcePath = this.resourcePath;
  var resourceRelativePath = path.relative(contextPath, resourcePath);
  var page, examples, files;

  new Promise(function(resolve, reject) {
    fs.readFile(resourcePath, function(err, result) {
      err ? reject(err) : resolve(result.toString('utf-8'));
    })
  })

  // extractor
  .then(function (source) {
    page = callExtractor.call(loader, config.page.extractor, source);
    if (!page)
      return Promise.reject();

    page.source.path = resourceRelativePath;
    page.source.absolutePath = resourcePath;
    page.source.content = source;
    page.path = interpolateName(config.page.namePattern, {
      path: resourcePath,
      context: contextPath
    });
    return Promise.resolve(page);
  })

  // lastModified
  .then(function (page) {
    return new Promise(function (resolve, reject) {
      fs.stat(resourcePath, function (err, result) {
        if (err)
          reject(err);
        else {
          page.source.lastModified = new Date(result.mtime);
          resolve(page);
        }
      });
    });
  })

  // find files to compile
  .then(function (page) {
    files = flatten(page.items, function (item) { return item instanceof ExampleFile });
    var filesToCompile = findFilesToCompile(files, config.example.files.compile);
    if (filesToCompile.length == 0)
      return;

    var webpackConfig = config.example.webpackConfig || compiler.options;
    var examplesCompiler = createExamplesCompiler(webpackConfig, filesToCompile, resourcePath);

    // compile files assets
    return new Promise(function (resolve, reject) {
      examplesCompiler.run(function (err, stats) {
        err ? reject(err)
            : resolve(getAssetsByChunkName(stats.compilation));
      });
    })
    // save assets info
    .then(function (assets) {
      var pageDir = path.dirname(page.path);
      for (var chunkName in assets) {
        var file = files.filter(function (file) { return file.id === chunkName })[0];

        assets[chunkName].forEach(function (assetInfo) {
          assetInfo.path = sprintf('%s/examples/%s', pageDir, assetInfo.path);
          assetInfo.type = getFileExtension(assetInfo.path);
          var asset = new Asset(assetInfo);
          file.assets.push(asset);
        });
      }
    });

  })
  // emit files assets
  .then(function () {
    findFilesToEmit(files, config.example.files.emit).forEach(function (file) {
        file.emitAssets(compilation);
      });
  })
  // render examples pages
  .then(function () {
    if (!config.example.template)
      return;

    var pageDir = path.dirname(page.path);
    examples = flatten(page.items, function(item) { return item instanceof Example });

    return new Promise.all(examples.map(function (example) {
      return plugin.render(config.example.template, {example: example})
        .then(function (result) {
          example.content = result;

          if (config.example.emit) {
            example.path = sprintf('%s/examples/%s.html', pageDir, example.id);
            loader.emitFile(example.path, result);
          }
        });
    }));
  })
  // render documentation page
  .then(function () {
    return plugin
      .render(config.page.template, {page: page})
      .then(function (result) { loader.emitFile(page.path, result) })
  })
  // save to pages
  .then(function() {
    var alreadyAddedPage = plugin.pages.filter(function(p) { return p.path === page.path })[0];
    if (alreadyAddedPage)
      alreadyAddedPage = page;
    else
      plugin.pages.push(page);
  })
  .then(function() {
    done(null, '');
    return null;
  })
  .catch(function(err) {
    compilation.errors.push(err);
    done(err, '');
  });
};