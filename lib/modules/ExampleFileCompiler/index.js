var ChildCompiler = require('../ChildCompiler');
var SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
var sharedDataLoader = require('./loader');

var DocsPlugin = require('../../plugin');
var Plugin = require('../../plugins/Plugin');

var stringifyLoaderConfig = require('../../utils/loader/stringifyLoaderConfig');
var format = require('util').format;

/**
 * @param {Compilation} compilation
 * @param {ChildCompilerOptions} compilerOptions
 * @param {ExampleFile} file
 * @param {string} resourcePath
 * @constructor
 */
function ExampleFileCompiler(compilation, compilerOptions, file, resourcePath) {
  if (typeof file.source != 'string')
    throw new Error('File.source not defined');

  ChildCompiler.call(this, compilation, compilerOptions);

  var compiler = this._compiler;
  var parentCompilerPlugins = compilation.compiler.options.plugins;

  // Apply parent compiler plugins to this compiler
  parentCompilerPlugins
    .filter(function (plugin) {
      return !(plugin instanceof DocsPlugin) && !(plugin instanceof Plugin)
    })
    .forEach(function (plugin) {
      compiler.apply(plugin)
    });

  // Create loaders request
  var request = ExampleFileCompiler.createEntryRequest(file, compiler.options, resourcePath);

  // ExampleFile optionally may have `context` property for proper dependencies resolving
  var entry = new SingleEntryPlugin(file.context || compiler.context, request);

  // Add entry to compiler
  compiler.apply(entry);

  // Return file.source by shared data loader
  sharedDataLoader.plugInCompiler(compiler, file.source);
}

ExampleFileCompiler.prototype = Object.create(ChildCompiler.prototype);


/**
 * @param {ExampleFile} file
 * @param {WebpackConfig} config
 * @param {string} resourcePath
 * @returns {string}
 * @static
 */
ExampleFileCompiler.createEntryRequest = function (file, config, resourcePath) {
  var loaders = [];
  var exampleFilePath = '.' + file.type;

  if (config.module.preLoaders)
    loaders = loaders.concat(config.module.preLoaders);

  if (config.module.loaders)
    loaders = loaders.concat(config.module.loaders);

  if (config.module.postLoaders)
    loaders = loaders.concat(config.module.postLoaders);

  var matchedLoaders = loaders.filter(function (loaderConfig) {
    return loaderConfig.test.test(exampleFilePath);
  });

  matchedLoaders.push({
    loader: sharedDataLoader.CONTEXT_PROPERTY_NAME
  });

  var matchedLoadersString = matchedLoaders.map(stringifyLoaderConfig).join('!');

  return format('!!%s!%s', matchedLoadersString, resourcePath);
};

module.exports = ExampleFileCompiler;