var webpack = require('webpack');
var MemoryFileSystem = require('memory-fs');
var SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');

/**
 * @param {Object} compiler Webpack compiler instance
 * @param {string} entryName Entry name
 * @param {string} entryPath Relative path to entry
 * @param {string} [contextPath]
 */
exports.addSingleEntry = function (compiler, entryName, entryPath, contextPath) {
  var entry = new SingleEntryPlugin(contextPath || null, entryPath, entryName);
  compiler.apply(entry);
};

/**
 * @param {Object} config Webpack config
 * @param {boolean} [inputFS=false] Input filesystem
 * @param {boolean} [outputFS=true] Output filesystem
 * @returns {Object} Webpack compiler instance
 */
exports.createInMemoryCompiler = function (config, inputFS, outputFS) {
  var input = typeof inputFS === 'boolean' ? inputFS : false;
  var output = typeof outputFS === 'boolean' ? outputFS : true;
  if (!input && !output)
    throw new Error('In-memory input or output (or both) filesystems should be true');

  var compiler = webpack(config);
  var fs = new MemoryFileSystem();

  if (input) {
    compiler.inputFileSystem = fs;
    compiler.resolvers.normal.fileSystem = fs;
    compiler.resolvers.context.fileSystem = fs;
  }

  if (output) {
    compiler.outputFileSystem = fs;
  }

  compiler.fs = fs;

  return compiler;
};

