var tools = require('webpack-toolkit');
var ChildCompiler = require('webpack-toolkit/lib/ChildCompiler');
var merge = require('merge-options');
var loader = require('./loader');
var getHash = require('loader-utils').getHashDigest;
var format = require('util').format;

var Docpack = require('docpack');
var DocpackPlugin = require('docpack/lib/utils/DocpackPlugin');

/**
 * @typedef {ChildCompilerConfig} ExamplesCompilerConfig
 */

/**
 * @const
 * @type {String}
 */
var SHARED_DATA_LOADER_PATH = require.resolve('./loader');

var defaultConfig = {
  /**
   * Used for loaders matching, can be overridden via ExampleFile attrs.filename
   */
  filename: 'example.[type]',

  /**
   * Used for naming emitted files.
   * Extension will be appended automatically (technically - the name of entry point).
   */
  outputFilename: 'examples/[hash]',

  /**
   * Don't touch this, only for testing purposes!
   */
  applyParentCompilerPlugins: true,

  /**
   * Compiler name
   */
  name: 'ExamplesCompiler'
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

  this.files = [];
  this.config = merge(defaultConfig, config || {});

  ChildCompiler.call(this, compilation, this.config);
  var compiler = this._compiler;

  /**
   * We need to create named entries, so child compiler output
   * filename should be set to [name] (name of entry)
   */
  compiler.options.output.filename = '[name].js';

  /**
   * We will extract example files content for compilation via special loader,
   * so we share array with example files between compiler and loader
   */
  loader.plugInCompiler(compiler, this.files);

  if (this.config.applyParentCompilerPlugins) {
    this.applyParentCompilerPlugins();
  }
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
  var filenameToMatch = (file.attrs && typeof file.attrs.filename == 'string')
    ? file.attrs.filename
    : filename.replace('[type]', file.type);

  return tools.getMatchedLoaders(loadersConfig, filenameToMatch);
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

ExamplesCompiler.prototype.applyParentCompilerPlugins = function() {
  var compiler = this._compiler;
  var parentCompilerPlugins = compiler.parentCompilation.compiler.options.plugins || [];

  parentCompilerPlugins
    .filter(function(plugin) {
      return !(plugin instanceof Docpack) && !(plugin instanceof DocpackPlugin)
    })
    .forEach(function(plugin) {
      compiler.apply(plugin);
    });
};

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
  this.files.push(file);
  var fileIndex = this.files.indexOf(file);

  // Get loaders to process example file
  var matchedLoaders = this.getLoadersToProcessExampleFile(file);

  // Shared loader config
  var sharedDataLoaderConfig = {
    loader: SHARED_DATA_LOADER_PATH,
    query: {
      path: fileIndex.toString() + '.content',
      hash: getHash(file.content)
    }
  };

  var loadersRequest = matchedLoaders
    .concat([sharedDataLoaderConfig])
    .map(tools.stringifyLoaderConfig)
    .join('!');

  var fullRequest = format('!!%s!%s', loadersRequest, resourcePath);

  // Get file output name
  var entryName = this.getOutputFilename(file, resourcePath);

  // Add entry to compiler
  this.addEntry(fullRequest, entryName, compilationContext);

  return {
    file: file,
    entryName: entryName,
    loaders: matchedLoaders,
    loadersRequest: loadersRequest,
    fullRequest: fullRequest
  }
};

/**
 * @param {ExampleFile} file
 * @param {String} resourcePath
 * @returns {String}
 */
ExamplesCompiler.prototype.getOutputFilename = function(file, resourcePath) {
  var outputFilename = this.config.outputFilename;

  /**
   * Fixes case when file.content string is defined, but empty
   * @see https://github.com/webpack/loader-utils/blob/master/index.js#L274
   */
  var content = file.content === '' ? ' ' : file.content;
  var entryName = tools.interpolateName(outputFilename, {
    path: resourcePath,
    content: content,
    context: file.context || this._compiler.context
  });

  return entryName;
};