var path = require('path');
var _readFile = require('webpack-toolkit/lib/readFile');

function resolve(filepath) {
  return path.resolve(this.source.absolutePath, filepath);
}

function addDependency(filepath) {
  this.module.fileDependencies.push(filepath);
}

function readFile(filepath) {
  return _readFile(this.fs, filepath);
}

/**
 * @param {Source} source
 * @param {Function} extractor
 * @param {Object} options
 * @param {Compilation} compilation
 * @returns {Promise}
 */
function extractDocs(source, extractor, options, compilation) {
  var context = {
    source: source,
    compilation: compilation,
    compiler: compilation.compiler,
    fs: compilation.compiler.inputFileSystem,
    module: compilation.modules.filter(function (module) {
      return module.resource == source.absolutePath
    })[0],

    resolve: resolve,
    addDependency: addDependency,
    readFile: readFile
  };

  return extractor.call(context, source.content, options);
}

module.exports = extractDocs;