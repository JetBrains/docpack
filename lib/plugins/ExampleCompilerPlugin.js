var Plugin = require('./Plugin');
var path = require('path');
var HOOKS = require('../hooks');
var find = require('../utils/find');
var format = require('util').format;
var Promise = require('bluebird');
var getAdditionalAssets = require('../utils/getAdditionalAssets');

var interpolateName = require('../utils/interpolateName');
var Page = require('../data/Page');
var ExampleFileCompiler = require('../modules/ExampleFileCompiler');
var ExampleFile = require('../data/ExampleFile');
var Asset = require('../data/Asset');

// TODO: add [example-index] or [file-index] placeholders
var defaultOptions = {
  outputFilename: 'docs/[path][name].[ext]/examples/[hash].js',
  filenamePrefix: '',
  filenameSuffix: ''
};

var ExampleCompilerPlugin = Plugin.create(defaultOptions);

ExampleCompilerPlugin.prototype.apply = function (compiler) {
  var plugin = this;

  compiler.plugin('compilation', function (compilation) {

    // Skip child compilations
    if (compilation.compiler.hasOwnProperty('parentCompilation'))
      return;

    compilation.plugin(HOOKS.POSTPROCESS_EXTRACTED_RESULTS, function (context, done) {
      var results = context.results;
      var promises = [];
      var files = [];

      var compilerOptions = {
        name: 'Example files compiler'
      };

      var compiler = new ExampleFileCompiler(
        compilation,
        compilerOptions,
        plugin.options.filenamePrefix,
        plugin.options.filenameSuffix
      );

      results.filter(function (result) {
        return result instanceof Page;
      })
      .forEach(function (page, i) {
        var source = page.source;

        find(page, function (item) {
          return item instanceof ExampleFile;
        })
        .forEach(function(file, j) {
          file.path = interpolateName(plugin.options.outputFilename, {
            path: source.absolutePath,
            context: compilation.compiler.context,
            content: file.source
          });
          files.push(file);

          compiler.addFile(file, source.absolutePath, plugin.options.outputFilename);
        });
      });

      compiler.run()
        .then(function(compilation) {
          var getAssets = getAdditionalAssets;
          var assetsByName = Object.keys(compilation.assets);
          var additionalAssets = getAdditionalAssets(compilation);
          var additionalAssetsNames = Object.keys(additionalAssets);

          files.forEach(function(file) {
            var fileAssets = file.assets;

            assetsByName.filter(function(assetName) {
              return file.path === assetName;
            })
            .forEach(function(assetPath) {
              var asset = new Asset({
                type: path.extname(assetPath).substr(1),
                source: compilation.assets[assetPath].source(),
                path: assetPath
              });

              fileAssets.push(asset);

              Object.keys(additionalAssets).forEach(function(chunkName) {
                if (assetPath.indexOf(chunkName) == 0) {
                  additionalAssets[chunkName].forEach(function(assetPath) {
                    var asset = new Asset({
                      type: path.extname(assetPath).substr(1),
                      source: compilation.assets[assetPath].source(),
                      path: assetPath
                    });

                    fileAssets.push(asset);
                  });
                }
              })
            });
          });

        })
        .finally(function() {
          done();
        });

    });
  });
};

module.exports = ExampleCompilerPlugin;