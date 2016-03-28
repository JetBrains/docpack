module.exports = function(compilation, path, content) {
  compilation.assets[path] = {
    size: function () {
      return content.length;
    },
    source: function () {
      return content;
    }
  };
};