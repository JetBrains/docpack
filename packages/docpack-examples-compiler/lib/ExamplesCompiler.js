var tools = require('webpack-toolkit');
var ChildCompiler = require('webpack-toolkit/lib/ChildCompiler');
var merge = require('merge-options');
var loader = require('./loader');
var getHash = require('loader-utils').getHashDigest;
var format = require('util').format;

/**
 * @typedef {ChildCompilerConfig} ExamplesCompilerConfig
 */

/**
 * @const
 * @type {String}
 */
var SHARED_DATA_LOADER_PATH = require.resolve('./loader');

var defaultConfig = {
  // used for loaders matching, can be overridden via ExampleFile attrs.filename
  filename: 'example.[type]',
  name: 'ExamplesCompiler',
  output: {
    filename: '[hash].[type]'
  }
};

/**
 * @param {Compilation} compilation
 * @param {ExamplesCompilerConfig} [config]
 * @extends ChildCompiler
 * @constructor
 * @class
 */
function ExamplesCompiler(compilation, config) {
  if (this instanceof ExamplesCompiler == false) {
    return new ExamplesCompiler(compilation, config);
  }

  var cfg = merge(defaultConfig, config || {});
  this.config = cfg;
  this.files = [];

  ChildCompiler.call(this, compilation, cfg);

  loader.plugInCompiler(this._compiler, this.files);

  //parentCompilerPlugins
  //.filter(function (plugin) {
  //  return !(plugin instanceof DocsPlugin) && !(plugin instanceof Plugin)
  //})
  //.forEach(function (plugin) {
  //  compiler.apply(plugin)
  //});
}

module.exports = ExamplesCompiler;

ExamplesCompiler.defaultConfig = defaultConfig;

/**
 * @param {ExampleFile} file
 * @param {String} filename ExampleFile virtual filename to match through loaders and find loaders for process it
 * @param {Object} loadersConfig Module loaders Webpack config to search in
 * @returns {Array<Object>}
 */
ExamplesCompiler.getLoadersToProcessExampleFile = function (file, filename, loadersConfig) {
  var filenameToMatch = filename.replace('[type]', file.type);
  var loaders = tools.getMatchedLoaders(loadersConfig, filenameToMatch);
  return loaders;
};

ExamplesCompiler.prototype = Object.create(ChildCompiler.prototype);

/**
 * @type {ExamplesCompilerConfig}
 */
ExamplesCompiler.prototype.config = null;

/**
 * @type {Array<ExampleFile>}
 */
ExamplesCompiler.prototype.files = null;

/**
 * @param {ExampleFile} file
 * @returns {Array<Object>}
 */
ExamplesCompiler.prototype.getLoadersToProcessExampleFile = function(file) {
  var filename = this.config.filename;
  var compilerModuleConfig = this._compiler.options.module;
  return ExamplesCompiler.getLoadersToProcessExampleFile(file, filename, compilerModuleConfig);
};

/**
 * @param {ExampleFile} file
 * @param {String} resourcePath Path to the origin resource of example file
 * @returns {{entryName: String, loaders: Array<Object>, loadersRequest: String, fullRequest: String}}
 */
ExamplesCompiler.prototype.addFile = function(file, resourcePath) {
  // TODO
  // ExampleFile optionally may have `context` property for proper dependencies resolving
  var compilationContext = file.context || this._compiler.context;

  // Add file
  var fileIndex = this.files.push(file);

  // Get loaders to process example file
  var loaders = this.getLoadersToProcessExampleFile(file);

  // Shared loader config
  var sharedDataLoaderConfig = {
    loader: SHARED_DATA_LOADER_PATH,
    query: {
      hash: getHash(file.content),
      path: fileIndex.toString()
    }
  };

  loaders.push(sharedDataLoaderConfig);

  var loadersRequest = loaders.map(tools.stringifyLoaderConfig).join('!');
  var fullRequest = format('!!%s!%s', loadersRequest, resourcePath);

  // Get file output name
  var entryName = this.getOutputFilename(file, resourcePath);

  // Add entry to compiler
  tools.addEntry(this._compiler, fullRequest, entryName, compilationContext);

  return {
    entryName: entryName,
    loaders: loaders,
    loadersRequest: loadersRequest,
    fullRequest: fullRequest
  }
};

/**
 *
 * @param {ExampleFile} file
 * @param {String} resourcePath
 * @returns {String}
 */
ExamplesCompiler.prototype.getOutputFilename = function(file, resourcePath) {
  var outputFilename = this.config.output.filename;

  return tools.interpolateName(outputFilename, {
    path: resourcePath,
    content: file.content,
    context: file.context || this._compiler.context,
    replacements: {
      '[type]': file.type || 'js'
    }
  });
};