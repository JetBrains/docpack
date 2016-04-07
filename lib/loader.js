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

function PageIsNullException() {}

function callExtractor(extractor, data, options) {
  var extractor = typeof extractor === 'string' ? require(extractor) : extractor;
  return extractor.call(this, data, options);
}

module.exports = function () {
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
  var query = loaderUtils.parseQuery(loader.query);
  var isQueryEmpty = Object.keys(query).length == 0;
  if (!isQueryEmpty) {
    config = extend({}, pluginConfig, query);
    try {
      validateConfig(config);
    } catch (error) {
      return done(error);
    }
  }

  var compiler = loader._compiler;
  var compilation = loader._compilation;
  var fs = compiler.inputFileSystem;
  var contextPath = loader.options.context;
  var resourcePath = loader.resourcePath;
  var resourceRelativePath = path.relative(contextPath, resourcePath);
  var page, examples, files, source;
  var baseUrl = 'publicPath' in compiler.options.output ? compiler.options.output.publicPath : '/';

  new Promise(function(resolve, reject) {
    fs.readFile(resourcePath, function (err, result) {
      err ? reject(err) : resolve(result.toString('utf-8'));
    })
  })

  // Extractor
  .then(function (content) {
    source = content;
    page = callExtractor.call(
      loader, config.page.extractor,
      content, config.page.extractorOptions || undefined
    );
    if (!page)
      return Promise.reject(new PageIsNullException);

    page.source.path = resourceRelativePath;
    page.source.absolutePath = resourcePath;
    page.source.content = source;
    page.path = interpolateName(config.page.name, {
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

  // Find assets to compile
  .then(function (page) {
    files = flatten(page.items, function (item) { return item instanceof ExampleFile });
    var filesToCompile = findFilesToCompile(files, config.example.files.compile);
    if (filesToCompile.length == 0)
      return;

    var webpackConfig = config.example.webpackConfig || compiler.options;
    var examplesCompiler = createExamplesCompiler(webpackConfig, filesToCompile, resourcePath);

    // Compile example assets
    return new Promise(function (resolve, reject) {
      examplesCompiler.run(function (err, stats) {
        err ? reject(err)
            : resolve(getAssetsByChunkName(stats.compilation));
      });
    })

    // Save assets info
    .then(function (assets) {
      for (var chunkName in assets) {
        var file = files.filter(function (file) { return file.id === chunkName })[0];

        assets[chunkName].forEach(function (assetInfo) {
          assetInfo.path = sprintf('%s.examples/%s', page.path, assetInfo.path);
          assetInfo.type = path.extname(assetInfo.path).substr(1);
          file.assets.push(new Asset(assetInfo));
        });
      }
    });

  })

  // Emit example assets
  .then(function () {
    findFilesToEmit(files, config.example.files.emit)
      .forEach(function (file) {
        file.emitAssets(compilation);
      });
  })

  // Render example pages
  .then(function () {
    if (!config.example.template)
      return;

    loader.addDependency(config.example.template);
    examples = flatten(page.items, function(item) { return item instanceof Example });

    return Promise
      .all(examples.map(function (example) {
        var templateContext = extend({}, config.templateEngine.context || {}, {
          example: example.serialize(),
          baseurl: baseUrl
        });

        return plugin
          .render(config.example.template, templateContext)
          .then(function (result) { example.content = result });
      }))
      .then(function() {
        return examples;
      });
  })

  // Emit example pages
  .then(function(examples) {
    if (!examples || !config.example.emit)
      return;

    examples.forEach(function (example) {
      example.path = sprintf('%s.examples/%s.html', page.path, example.id);
      loader.emitFile(example.path, example.content);
    });
  })

  // Render documentation page
  .then(function () {
    loader.addDependency(config.page.template);

    var templateContext = extend({}, config.templateEngine.context || {}, {
      page: page.serialize(),
      baseurl: baseUrl
    });

    return plugin
      .render(config.page.template, templateContext)
      .then(function (result) { loader.emitFile(page.path, result) })
  })

  // Save to plugin.pages
  .then(function() {
    var pages = plugin.pages;
    var alreadyAddedPage = pages.filter(function(p) { return p.path === page.path })[0];
    if (alreadyAddedPage)
      pages[pages.indexOf(alreadyAddedPage)] = page;
    else
      pages.push(page);
  })

  // All done
  .then(function() {
    done(null, source);
  })

  // Error handling
  .catch(function(err) {
    if (err instanceof PageIsNullException) {
      done(null, source);
    }
    else {
      compilation.errors.push(err);
      done(err);
    }
  });
};