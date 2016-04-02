/**
 * @param {Compilation} compilation
 * @param {string} filepath
 * @param {string} content
 */
function emitFile(compilation, filepath, content) {
  compilation.assets[filepath] = {
    size: function () {
      return content.length;
    },
    source: function () {
      return content;
    }
  };
}

exports = emitFile;