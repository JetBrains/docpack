var path = require('path');
var HOOKS = require('../hooks');
var flatten = require('../utils/flatten');
var merge = require('merge-options');
var format = require('util').format;
var Promise = require('bluebird');

var interpolateName = require('../utils/interpolateName');
var DocsPlugin = require('../plugin');
var ExampleCompiler = require('../modules/ExampleCompiler');
var Example = require('../data/Example');

function ExampleCompilerPlugin(options) {
  this.options = merge(ExampleCompilerPlugin.defaultOptions, options || {});
}

ExampleCompilerPlugin.defaultOptions = {
  filename: '[path][name].[ext].examples/[example-index].js'
};

ExampleCompilerPlugin.prototype.apply = function (compiler) {
  var plugin = this;

  compiler.plugin('compilation', function (compilation) {

    // Skip child compilations
    if (compilation.compiler.hasOwnProperty('parentCompilation'))
      return;

    compilation.plugin(HOOKS.EXTRACTOR_DONE, function (context, done) {
      var result = context.result;
      var source = result.source;

      var examples = flatten(result, function (item) {
        return item instanceof Example;
      });

      if (examples.length == 0)
        done();

      var parentCompilerPlugins = compilation.compiler.options.plugins;

      var examplesPromises = [];

      examples.forEach(function(example, exampleId) {
        var compilerOptions = {
          name: format('Example compiler for %s #%d', source.absolutePath, exampleId),
          output: {
            filename: interpolateName(plugin.options.filename, {
              path: source.absolutePath,
              context: compilation.compiler.context
            })
          }
        };

        compilerOptions.output.filename = compilerOptions.output.filename.replace('[example-index]', exampleId);

        var compiler = new ExampleCompiler(compilation, compilerOptions, example, source.absolutePath);

        // Apply parent compiler plugins to examples compiler
        parentCompilerPlugins
          .filter(function (plugin) { return !(plugin instanceof DocsPlugin) && !(plugin instanceof ExampleCompilerPlugin) })
          .forEach((function (plugin) { compiler._compiler.apply(plugin) }));

        examplesPromises.push(
          compiler.run().then(function (compilation) {
            debugger;
            done();
          })
        );
      });

      Promise.all(examplesPromises).then(function() {
        done();
      })

      return;

      // docs/src/button.js/examples/0
      var compilerOptions = {
        name: 'Examples compiler for ' + source.absolutePath,
        output: {
          filename: 'docs/' + source.path + '/example/'
        }
      };

      var compiler = new ExampleCompiler(compilation, compilerOptions, examples, source.absolutePath);

      // Apply parent compiler plugins to examples compiler
      parentCompilerPlugins
        .filter(function (plugin) { return !(plugin instanceof DocsPlugin) && !(plugin instanceof ExampleCompilerPlugin) })
        .forEach((function (plugin) { compiler._compiler.apply(plugin) }));

      compiler.run().then(function (compilation) {
        debugger;
        done();
      });

    });

  });
};

module.exports = ExampleCompilerPlugin;