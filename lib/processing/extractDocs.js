var path = require('path');
var _readFile = require('../utils/readFile');
var Promise = require('bluebird');
var DocsNotFoundException = require('./DocsNotFoundException');

function resolve(filepath) {
  return path.resolve(this.source.absolutePath, filepath);
}

function addDependency(filepath) {
  this.compilation.fileDependencies.push(filepath);
}

function readFile(filepath) {
  return _readFile(filepath, this.fs);
}

/**
 * @param {Source} source
 * @param {Function} extractor
 * @param {Object} options
 * @param {Compilation} compilation
 * @returns {Promise}
 * @throws DocsNotFoundException
 */
function extractDocs(source, extractor, options, compilation) {
  var context = {
    source: source,
    compilation: compilation,
    compiler: compilation.compiler,
    fs: compilation.compiler.inputFileSystem,

    resolve: resolve,
    addDependency: addDependency,
    readFile: readFile
  };

  var result = extractor.call(context, source.content, options);

  return result.then(function(res) {
    return res === null
      ? Promise.reject(new DocsNotFoundException())
      : Promise.resolve(res);
  })
}

module.exports = extractDocs;