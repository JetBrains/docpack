var sprintf = require('sprintf');

var dataLoaderPath = require('../../../sharedDataLoader').path;
var getLoadersForPath = require('../../loader/getLoadersForPath');
var stringifyLoaderConfig = require('../../loader/stringifyLoaderConfig');

/**
 * @param {WebpackConfig} config
 * @param {Array<ExampleItem>} items
 * @param {string} resourcePath
 * @returns {Object}
 */
function createExamplesEntriesList(config, items, resourcePath) {
  var entries = null;
  var loaders = [];

  if (config.module.preLoaders)
    loaders = loaders.concat(config.module.preLoaders);

  if (config.module.loaders)
    loaders = loaders.concat(config.module.loaders);

  if (config.module.postLoaders)
    loaders = loaders.concat(config.module.postLoaders);

  items.forEach(function(item, itemId) {
    var matchedLoaders = getLoadersForPath('.'+item.type, loaders);

    matchedLoaders.push({
      loader: dataLoaderPath,
      query: {path: sprintf('%s.content', itemId)}
    });

    var matchedLoadersString = matchedLoaders.map(stringifyLoaderConfig).join('!');

    var request = sprintf('!!%s!%s', matchedLoadersString, resourcePath);
    var entryName = item.id;

    if (entries === null) entries = {};
    entries[entryName] = request;
  });

  return entries;
}

module.exports = createExamplesEntriesList;