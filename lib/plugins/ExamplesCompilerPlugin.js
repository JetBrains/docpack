var path = require('path');
var HOOKS = require('../hooks');
var flatten = require('../utils/flatten');

var DocsPlugin = require('../plugin');
var ExamplesCompiler = require('../modules/ExamplesCompiler');
var Example = require('../data/Example');

function ExamplesCompilerPlugin() {

}

ExamplesCompilerPlugin.prototype.apply = function (compiler) {
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
      var compilerOptions = {
        name: 'Examples compiler for ' + source.absolutePath,
        output: {filename: '[name]'}
      };

      var compiler = new ExamplesCompiler(compilation, compilerOptions, examples, source.absolutePath);

      // Apply parent compiler plugins to examples compiler
      parentCompilerPlugins
        .filter(function (plugin) { return !(plugin instanceof DocsPlugin) && !(plugin instanceof ExamplesCompilerPlugin) })
        .forEach((function (plugin) { compiler._compiler.apply(plugin) }));

      compiler.run().then(function (compilation) {
        done();
      });

    });

  });
};

module.exports = ExamplesCompilerPlugin;