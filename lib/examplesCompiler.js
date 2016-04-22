var memoryCompiler = require('./memoryCompiler');
var createConfig = require('./utils/compiler/examples/createCompilerConfig');
var createEntryPoints = require('./utils/compiler/examples/createEntriesList');
var sharedDataLoader = require('sharedDataLoader');

/**
 * @param {WebpackConfig} config
 * @param {Array<ExampleFile>} items
 * @param {string} resourcePath
 * @returns {Compiler}
 */
function createExampleCompiler(config, items, resourcePath) {
  var cfg = createConfig(config);
  cfg.entry = createEntryPoints(cfg, items, resourcePath);

  var compiler = memoryCompiler(cfg, false, true);
  sharedDataLoader.injectInCompiler(compiler, items);

  return compiler;
}

module.exports = createExampleCompiler;