var Plugin = require('./Plugin');
var path = require('path');
var HOOKS = require('../hooks');
var flatten = require('../utils/flatten');
var format = require('util').format;
var Promise = require('bluebird');

var interpolateName = require('../utils/interpolateName');
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

    compilation.plugin(HOOKS.EXTRACTOR_DONE, function (result, done) {
      var source = result.source;

      var files = flatten(result, function (item) {
        return item instanceof ExampleFile;
      });

      if (files.length == 0)
        done();

      var promises = [];

      files.forEach(function(file, fileIndex) {
        var compilerOptions = {
          name: format('Example compiler for %s #%d', source.absolutePath, fileIndex),
          output: {
            filename: interpolateName(plugin.options.outputFilename, {
              path: source.absolutePath,
              context: compilation.compiler.context,
              content: file.source
            })
          }
        };

        var compiler = new ExampleFileCompiler(
          compilation,
          compilerOptions,
          file,
          source.absolutePath,
          plugin.options.filenamePrefix,
          plugin.options.filenameSuffix
        );

        promises.push(
          compiler.run().then(function (compilation) {
            var assets = compilation.assets;

            for (var assetName in assets) {
              var asset = new Asset({
                type: path.extname(assetName).substr(1),
                source: assets[assetName].source(),
                path: assetName
              });

              file.assets.push(asset);
            }
          })
        );
      });

      Promise.all(promises)
        .then(function () {
          done(null, result);
        });
    });

  });
};

module.exports = ExampleCompilerPlugin;