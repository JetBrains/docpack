var _readFile = require('webpack-toolkit/lib/readFile');

/**
 * @typedef {Object} DocpackExtractorContext
 * @property {CachedInputFileSystem|MemoryFileSystem} fs
 * @property {Function<Promise>} readFile
 * @property {Function} addDependency
 */

/**
 * @param {CachedInputFileSystem|MemoryFileSystem} fs
 * @param {DependenciesBlock} module
 * @returns {DocpackExtractorContext}
 */
module.exports = function createExtractorContext(fs, module) {
  return {
    fs: fs,

    module: module,

    readFile: function (filepath) {
      return _readFile(this.fs, filepath);
    },

    addDependency: function (filepath) {
      this.module.fileDependencies.push(filepath);
    }
  }
};