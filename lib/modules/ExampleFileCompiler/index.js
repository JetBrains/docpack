var SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
var matcher = require('webpack/lib/ModuleFilenameHelpers').matchObject;

var ChildCompiler = require('../ChildCompiler');
var sharedDataLoader = require('./loader');
var interpolateName = require('webpack-toolkit/lib/interpolateName');
var getHash = require('loader-utils').getHashDigest;

var DocsPlugin = require('../../plugin');
var Plugin = require('../../plugins/Plugin');

var stringifyLoaderConfig = require('webpack-toolkit/lib/stringifyLoaderConfig');
var format = require('util').format;

/**
 * @param {Compilation} compilation
 * @param {ChildCompilerOptions} compilerOptions
 * @param {string} [filenamePrefix]
 * @param {string} [filenameSuffix]
 * @constructor
 */
function ExampleFileCompiler(compilation, compilerOptions, filenamePrefix, filenameSuffix) {
  ChildCompiler.call(this, compilation, compilerOptions);

  var compiler = this._compiler;
  var parentCompilerPlugins = compilation.compiler.options.plugins || [];

  // Apply parent compiler plugins to this compiler
  parentCompilerPlugins
    .filter(function (plugin) {
      return !(plugin instanceof DocsPlugin) && !(plugin instanceof Plugin)
    })
    .forEach(function (plugin) {
      compiler.apply(plugin)
    });

  this.files = [];
  this.filenamePrefix = filenamePrefix;
  this.filenameSuffix = filenameSuffix;

  sharedDataLoader.plugInCompiler(compiler, this.files);
}

/**
 * @static
 * @param {ExampleFile} file
 * @param {string} resourcePath
 * @param {WebpackConfig} config
 * @param {string} [filenamePrefix]
 * @param {string} [filenameSuffix]
 * @returns {string}
 */
ExampleFileCompiler.createEntryRequest = function (file, resourcePath, config, filenamePrefix, filenameSuffix) {
  var loaders = [];
  var filename = format('%sexample.%s%s', filenamePrefix || '', file.type, filenameSuffix || '');

  if (config.module.preLoaders)
    loaders = loaders.concat(config.module.preLoaders);

  if (config.module.loaders)
    loaders = loaders.concat(config.module.loaders);

  if (config.module.postLoaders)
    loaders = loaders.concat(config.module.postLoaders);

  var matchedLoaders = loaders.filter(function (loaderConfig) {
    return matcher(loaderConfig, filename);
  });

  var sharedDataLoaderConfig = {
    loader: sharedDataLoader.CONTEXT_PROPERTY_NAME,
    query: {
      hash: getHash(file.source),
      path: '[c].source' // TODO: refactor this
    }
  };

  matchedLoaders.push(sharedDataLoaderConfig);

  var matchedLoadersString = matchedLoaders.map(stringifyLoaderConfig).join('!');

  return format('!!%s!%s', matchedLoadersString, resourcePath);
};

ExampleFileCompiler.prototype = Object.create(ChildCompiler.prototype);

/**
 * TODO: refactor
 * @param {ExampleFile} file
 * @param {string} resourcePath
 * @param {string} filename Can be a pattern with [placeholders].
 */
ExampleFileCompiler.prototype.addFile = function(file, resourcePath, filename) {
  var compiler = this._compiler;
  var id = (this.files.length).toString();
  this.files.push(file);

  // Create loaders request
  var request = ExampleFileCompiler.createEntryRequest(
    file,
    resourcePath,
    compiler.options,
    this.filenamePrefix,
    this.filenameSuffix
  );

  // TODO: remove this
  request = request.replace('[c]', id);

  // ExampleFile optionally may have `context` property for proper dependencies resolving
  var compilationContext = file.context || compiler.context;

  var entryName = interpolateName(filename, {
    path: resourcePath,
    context: compilationContext,
    content: file.source
  });

  entryName = entryName.indexOf('.') != -1
    ? entryName.substr(entryName, entryName.lastIndexOf('.'))
    : entryName;

  var entry = new SingleEntryPlugin(compilationContext, request, entryName);

  // Add entry to compiler
  compiler.apply(entry);
};

module.exports = ExampleFileCompiler;