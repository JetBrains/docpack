var path = require('path');
var clone = require('clone');
var webpack = require('webpack');
var MemoryFS = require('memory-fs');

var DocsPlugin = require('../plugin');

/**
 * Creates examples compiler
 *
 * @param {Object} baseConfig Webpack base config
 * @param {Object} options
 * @param {string} options.sourcePath Path to source file (relative, like in `entry` Webpack config option, e.g.: ./index)
 * @param {Object} options.data Docs data passed to extract-examples-loader and which
 * @returns {*}
 * @constructor
 */
function ExamplesCompiler(baseConfig, options) {
  var sourcePath = options.sourcePath;
  var docs = options.data;

  var config = ExamplesCompiler.createConfig(baseConfig);
  config.entry = ExamplesCompiler.createEntriesList(docs, sourcePath, config);

  var compiler = webpack(config);
  compiler.outputFileSystem = new MemoryFS();
  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('normal-module-loader', function (loaderContext, module) {
      loaderContext.extractExamplesLoader = docs;
    });
  });

  return compiler;
}

/**
 * Creates webpack config for ExampleCompiler.
 * Removes DocsPlugin instance from `plugins` and DocsPlugin loader from `loaders`
 * to prevent recursive compilation.
 *
 * @param {Object} baseConfig Base Webpack config
 * @returns {Object}
 */
ExamplesCompiler.createConfig = function (baseConfig) {
  var config = clone(baseConfig);

  if (config.plugins) {
    config.plugins = baseConfig.plugins.filter(function (plugin) {
      return !(plugin instanceof DocsPlugin);
    });
  }

  if (config.module && config.module.loaders) {
    config.module.loaders = config.module.loaders.filter(function (loader) {
      return loader.loader.indexOf(DocsPlugin.docsLoaderPath) === -1;
    });
  }

  return config;
};

/**
 * Returns loaders that matched provided path.
 *
 * @param {string} p Path
 * @param {Array<Object>} loaders Loaders configuration from Webpack config
 * @returns {Array<Object>} Filtered loaders array
 */
ExamplesCompiler.getLoadersForPath = function(p, loaders) {
  return loaders.filter(function(loaderConfig) {
    return loaderConfig.test.test(p);
  });
};

/**
 * Creates entries list prefixed with special loader to extract examples from source & compile them.
 * TODO: process preLoaders and postLoaders
 *
 * @param {Array<Object>} docs Docs object with `examples` property
 * @param {string} sourcePath Path to source file (relative, like in `entry` Webpack config option, e.g.: ./index)
 * @param {Object} config Webpack config
 * @returns {Object<string, string>|null} null returns if no examples found
 */
ExamplesCompiler.createEntriesList = function(docs, sourcePath, config) {
  var entries = null;

  docs.content
    .filter(function (record) { return record.examples !== null })
    .forEach(function (record, recordIndex) {
      record.examples.forEach(function (example, exampleIndex) {
        example.items
          .forEach(function (item, itemIndex) {
            // dirty hack to pass proper item index to loader
            // TODO: implement normal item id
            if (item.type !== 'js')
              return;

            var loaders = ExamplesCompiler.getLoadersForPath(item.name, config.module.loaders);
            var loadersStr = loaders.map(function (loader) {
              return loader.loader
            }).join('!');
            loadersStr += loaders.length > 0 ? '!' : '';

            var request = [
              '!!',
              loadersStr,
              DocsPlugin.examplesLoaderPath, '?record=' + recordIndex, '&example=', exampleIndex, '&item=', itemIndex,
              '!', sourcePath
            ].join('');

            var entryName = recordIndex + '.' + exampleIndex + '.' + itemIndex;

            if (entries === null) entries = {};
            entries[entryName] = request;
          })
      })
    });

  return entries;
};

/**
 * Fill docs data object with compiled assets from Stats compilation object.
 *
 * @param {Object} stats Webpack Stats object
 * @param {Object} data Docs data object
 */
ExamplesCompiler.getAssetsFromStats = function (stats, data) {
  var assetsByChunkName = stats.toJson().assetsByChunkName;
  var assets = stats.compilation.assets;

  Object.keys(assetsByChunkName).forEach(function(chunkName) {
    var parts = chunkName.split('.');
    var recordIndex = parseInt(parts[0]);
    var exampleIndex = parseInt(parts[1]);
    var itemIndex = parseInt(parts[2]);
    var item = data.content[recordIndex].examples[exampleIndex].items[itemIndex];
    item.assets = [];

    var chunkAssets = assetsByChunkName[chunkName];
    if (typeof chunkAssets === 'string') chunkAssets = [chunkAssets];

    chunkAssets.forEach(function(assetPath, i) {
      item.assets.push({
        name: path.basename(assetPath),
        compiled: assets[assetPath].source()
      });
    });
  })
};

module.exports = ExamplesCompiler;