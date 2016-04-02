/**
 * @param {Object} compilation Webpack Compilation object
 * @param {string} filepath
 * @param {string} content
 */
exports.emitFile = function (compilation, filepath, content) {
  compilation.assets[filepath] = {
    size: function () {
      return content.length;
    },
    source: function () {
      return content;
    }
  };
};