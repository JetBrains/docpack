var dotty = require('dotty');
var loaderUtils = require('loader-utils');

var sharedDataPropertyName = __filename;

module.exports = function () {
  this.cacheable && this.cacheable();
  var query = loaderUtils.parseQuery(this.query);
  var data = this[sharedDataPropertyName];

  if (!query.path)
    throw new Error('`path` query parameter must be used');

  if (!data)
    throw new Error('shared data is undefined. Use injectInCompiler method to add data to loader context');

  var value = dotty.get(data, query.path);

  if (typeof value === 'undefined')
    throw new Error('shared data loader: value with key "'+ query.path +'" not found');

  return value;
};

/**
 * @param {Compiler} compiler Webpack Compiler instance
 * @param {*} data
 */
module.exports.injectInCompiler = function (compiler, data) {
  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('normal-module-loader', function (loaderContext) {
      loaderContext[sharedDataPropertyName] = data;
    });
  });
};

module.exports.path = require.resolve(__filename);

module.exports.sharedDataPropertyName = sharedDataPropertyName;