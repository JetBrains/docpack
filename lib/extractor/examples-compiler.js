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

module.exports = ExamplesCompiler;