var path = require('path');

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

/**
 * Extract assets with compiled source from compilation and groups them by chunk name.
 *
 * @param {Object} compilation Webpack Compilation object
 * @returns {Object<string, Array<{path: string, content: string}>>}
 */
exports.getAssetsByChunkName = function (compilation) {
  var compiledAssets = compilation.assets;
  var assetsByChunkName = compilation.getStats().toJson().assetsByChunkName;
  var chunkNames = Object.keys(assetsByChunkName);

  if (!chunkNames.length)
    return null;

  var chunks = {};
  chunkNames.forEach(function (chunkName) {
    var chunkAssets = assetsByChunkName[chunkName];
    var assets = [];

    if (typeof chunkAssets === 'string')
      chunkAssets = [chunkAssets];

    chunkAssets.forEach(function(assetPath) {
      assets.push({
        path: assetPath,
        content: compiledAssets[assetPath].source()
      });
    });

    chunks[chunkName] = assets;
  });

  return chunks;
};