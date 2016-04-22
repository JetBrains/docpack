var dotty = require('dotty');
var loaderUtils = require('loader-utils');

var loaderContextPropertyName = __filename;

module.exports = function () {
  this.cacheable && this.cacheable();
  var query = loaderUtils.parseQuery(this.query);
  var data = this[loaderContextPropertyName];

  if (!query.path)
    throw new Error('`path` query parameter must be used');

  if (!data)
    throw new Error('shared data is undefined. Use pluginInCompiler method to add data to loader context');

  var value = dotty.get(data, query.path);

  if (typeof value === 'undefined')
    throw new Error('shared data loader: value with key "'+ query.path +'" not found');

  return value;
};

/**
 * @param {Compiler} compiler
 * @param {*} data
 */
module.exports.pluginInCompiler = function (compiler, data) {
  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('normal-module-loader', function (loaderContext) {
      loaderContext[loaderContextPropertyName] = data;
    });
  });
};

module.exports.CONTEXT_PROPERTY_NAME = loaderContextPropertyName;