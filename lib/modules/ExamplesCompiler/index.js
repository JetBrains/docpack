var ChildCompiler = require('../ChildCompiler');
var SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
var sharedDataLoader = require('./loader');

var stringifyLoaderConfig = require('../../utils/loader/stringifyLoaderConfig');
var format = require('util').format;

/**
 * @param {Compilation} compilation
 * @param {ChildCompilerOptions} options
 * @param {Array<Example>} examples
 * @param {string} resourcePath
 * @constructor
 */
function ExamplesCompiler(compilation, options, examples, resourcePath) {
  ChildCompiler.call(this, compilation, options);
  var compiler = this.compiler;

  this.resourcePath = resourcePath;
  this.examples = examples;

  sharedDataLoader.plugInCompiler(compiler, examples);

  var entries = this.createEntries(examples, compiler.context);
  entries.forEach(function(entry) {
    compiler.apply(entry);
  });
}

ExamplesCompiler.prototype = Object.create(ChildCompiler.prototype);


/**
 * @param {ExampleFile} file
 * @param {string} key For shared data loader to search in loader context
 * @param {WebpackConfig} config
 * @param {string} resourcePath
 * @returns {string}
 * @static
 */
ExamplesCompiler.createEntryRequest = function (file, key, config, resourcePath) {
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
    loader: sharedDataLoader.CONTEXT_PROPERTY_NAME,
    query: {path: key}
  });

  var matchedLoadersString = matchedLoaders.map(stringifyLoaderConfig).join('!');

  return format('!!%s!%s', matchedLoadersString, resourcePath);
};


/**
 * @param {Array<Example>} examples
 * @param {string} context
 * @returns {Array<SingleEntryPlugin>}
 */
ExamplesCompiler.prototype.createEntries = function (examples, context) {
  var compilerConfig = this.compiler.options;
  var resourcePath = this.resourcePath;
  var entries = [];

  examples.forEach(function (example, exampleIndex) {
    example.files.forEach(function (file, fileIndex) {
      var key = format('%s.files.%s.source', exampleIndex.toString(), fileIndex.toString());
      var request = ExamplesCompiler.createEntryRequest(file, key, compilerConfig, resourcePath);

      entries.push(
        new SingleEntryPlugin(file.context || context, request, key)
      );

    });
  });

  return entries;
};

module.exports = ExamplesCompiler;