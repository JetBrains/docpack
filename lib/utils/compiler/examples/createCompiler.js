var createInMemoryCompiler = require('../createInMemoryCompiler');
var createConfig = require('./createCompilerConfig');
var createEntryPoints = require('./createEntriesList');
var sharedDataLoader = require('../../../sharedDataLoader');

/**
 * @param {WebpackConfig} config
 * @param {Array<ExampleFile>} items
 * @param {string} resourcePath
 * @returns {Compiler}
 */
function createExampleCompiler(config, items, resourcePath) {
  var cfg = createConfig(config);
  cfg.entry = createEntryPoints(cfg, items, resourcePath);

  var compiler = createInMemoryCompiler(cfg, false, true);
  sharedDataLoader.injectInCompiler(compiler, items);

  return compiler;
}

module.exports = createExampleCompiler;