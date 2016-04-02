var sprintf = require('sprintf');

var createInMemoryCompiler = require('../createInMemoryCompiler');
var createConfig = require('./createCompilerConfig');
var getLoadersForPath = require('../../loader/getLoadersForPath');
var generateLoaderRequestString = require('../../loader/generateLoaderRequestString');
var sharedDataLoader = require('../../../shared-data-loader');

/**
 * @param {WebpackConfig} config
 * @param {Array<Example>} examples
 */
function createExampleCompiler(config, examples) {
  var cfg = createConfig(config);
}