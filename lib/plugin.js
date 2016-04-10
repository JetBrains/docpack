var path = require('path');
var consolidate = require('consolidate');
var extend = require('./utils/extend');
var validateConfig = require('./utils/plugin/validateConfig');
var Promise = require('bluebird');

var sprintf = require('sprintf');
var flatten = require('./utils/flatten');
var interpolateName = require('./utils/interpolateName');
var findAffectedFiles = require('./utils/compilation/findAffectedFiles');
var isFileShouldBeProcessed = require('./utils/plugin/isFileShouldBeProcessed');
var createExamplesCompiler = require('./utils/compiler/examples/createCompiler');
var emitFile = require('./utils/compilation/emitFile');

var Example = require('./data/Example');
var ExampleFile = require('./data/ExampleFile');
var Asset = require('./data/Asset');
var getAssetsByChunkName = require('./utils/compilation/getAssetsByChunkName');
var findFilesToCompile = require('./utils/compiler/examples/findFilesToCompile');
var findFilesToEmit = require('./utils/compiler/examples/findFilesToEmit');

var defaultConfig = require('./config');

/**
 * @param {DocsPluginConfig} [config]
 * @constructor
 */
function DocsPlugin (config) {
  this.configure(config);
  this.pages = [];
}

DocsPlugin.sharedLoaderPath = require.resolve('./loader');

/**
 * @param {DocsPluginConfig} config
 */
DocsPlugin.prototype.configure = function (config) {
  var cfg = extend({}, defaultConfig, config || {});
  validateConfig(cfg);
  this.config = cfg;
};

/**
 * @type {DocsPluginConfig}
 */
DocsPlugin.prototype.config = null;

/**
 * @param {string} template Template path
 * @param {Object} context Template context object
 * @returns {Promise}
 */
DocsPlugin.prototype.render = function (template, context) {
  var templateEngine = this.config.templateEngine.name;
  return consolidate[templateEngine](template, context || {});
};

function PageIsNullException() {}

/**
 * @param {Compiler} compiler
 */
DocsPlugin.prototype.apply = function (compiler) {
  var plugin = this;
  var shouldFireOnPageBuild = typeof this.config.onPageBuild === 'function';

  compiler.plugin('compilation', function(compilation) {
    if (compilation.name !== undefined) return;

    compilation.plugin('optimize-tree', function(chunks, modules, done) {
      var fs = compiler.inputFileSystem;
      var contextPath = compiler.options.context;
      var config = plugin.config;

      var affected = findAffectedFiles(compilation);
      var filesToProcess = affected.filter(function (filepath) {
        return isFileShouldBeProcessed(filepath, config);
      });

      Promise.resolve(filesToProcess)

      // Files
      .then(function(files) {
        var promises = files.map(function (filepath) {
          var page, examples, files;
          var baseUrl = 'publicPath' in compiler.options.output ? compiler.options.output.publicPath : '/';

          // Read file
          return new Promise(function (resolve, reject) {
            fs.readFile(filepath, function (err, result) {
              err ? reject(err) : resolve(result.toString('utf-8'));
            })
          })

          // Extract docs
          .then(function (source) {
            page = plugin.config.extractor(source, config.page.extractorOptions || undefined);
            if (!page)
              return Promise.reject(new PageIsNullException);

            page.source.path = path.relative(contextPath, filepath);
            page.source.absolutePath = filepath;
            page.source.content = source;
            page.path = interpolateName(config.page.name, {
              path: filepath,
              context: contextPath
            });
            return Promise.resolve(page);
          })

          // Find assets to compile
          .then(function(page) {
            files = flatten(page.items, function (item) { return item instanceof ExampleFile });
            var filesToCompile = findFilesToCompile(files, config.example.files.compile);
            if (!filesToCompile.length)
              return;

            var webpackConfig = config.example.webpackConfig || compiler.options;
            var examplesCompiler = createExamplesCompiler(webpackConfig, filesToCompile, filepath);

            // Compile example assets
            return new Promise(function (resolve, reject) {
              examplesCompiler.run(function (err, stats) {
                var compilation = stats.compilation;
                var error = err || (compilation.errors.length > 0 && compilation.errors[0]);
                error ? reject(error)
                      : resolve(getAssetsByChunkName(compilation));
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
            }); // examples compiler
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

            //addDependency(config.example.template);
            examples = flatten(page.items, function(item) { return item instanceof Example });

            return Promise
              .all(examples.map(function (example) {
                var templateContext = extend({}, config.templateEngine.context || {}, {
                  example: example.serialize(),
                  baseurl: baseUrl
                });

                return plugin
                  .render(config.example.template, templateContext)
                  .catch(function(err) { throw err })
                  .then(function (result) {
                    example.content = result
                  })
              }))

              .then(function() {
                return examples;
              });
          })

          // Emit example pages
          .then(function (examples) {
            if (!examples || !config.example.emit)
              return;

            examples.forEach(function (example) {
              example.path = sprintf('%s.examples/%s.html', page.path, example.id);
              emitFile(compilation, example.path, example.content);
            });
          })

          // Render documentation page
          .then(function () {
            //addDependency(config.page.template);

            var templateContext = extend({}, config.templateEngine.context || {}, {
              page: page.serialize(),
              baseurl: baseUrl
            });

            return plugin
              .render(config.page.template, templateContext)
              .catch(function(err) { throw err })
              .then(function (result) {
                emitFile(compilation, page.path, result)
              })
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

          // If page is null don't throw an error
          .catch(function(err) {
            if (err instanceof PageIsNullException == false)
              throw err;
          })

        });

        return Promise.all(promises);
      })

      .then(function() {
        done();
      })

      .catch(function(err) {
        done(err);
      });

    }); // compilation
  }); // compiler

  compiler.plugin('emit', function (compilation, done) {
    if (shouldFireOnPageBuild)
      plugin.config.onPageBuild.call(compilation, plugin.pages);

    done();
  });
};

module.exports = DocsPlugin;
