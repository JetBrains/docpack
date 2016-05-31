function getAdditionalAssets(compilation) {
  var stats = compilation.getStats().toJson();
  var modules = stats.modules;
  var chunks = {};

  modules.forEach(function (module) {
    var moduleChunks = module.chunks;
    var isNormalModule = module.chunks.length > 0 && module.assets.length == 0;
    if (isNormalModule)
      return;

    if (module.assets.length > 0 && module.chunks.length > 0) {
      var cName = stats.chunks.filter(function (chunk) { return chunk.id == moduleChunks[0] })[0].names[0];
      if (!(cName in chunks)) chunks[cName] = [];

      chunks[cName] = chunks[cName].concat(module.assets);
    }

    var parentModule, parentChunk;
    module.reasons
      .filter(function (reason) { return reason.type == 'loader' })
      .forEach(function (reason) {
        parentModule = modules.filter(function (m) { return reason.moduleIdentifier == m.identifier })[0];
        parentChunk = stats.chunks.filter(function (chunk) { return parentModule.chunks[0] == chunk.id })[0];
      });

    if (parentChunk) {
      var parentChunkName = parentChunk.names[0];
      if (!(parentChunkName in chunks))
        chunks[parentChunkName] = [];

      chunks[parentChunkName] = chunks[parentChunkName].concat(module.assets);
    }

  });

  return chunks
}

module.exports = getAdditionalAssets;