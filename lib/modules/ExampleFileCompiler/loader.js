var dotty = require('dotty');
var loaderUtils = require('loader-utils');

var loaderContextPropertyName = __filename;

module.exports = function () {
  this.cacheable && this.cacheable();
  var query = loaderUtils.parseQuery(this.query);
  var data = this[loaderContextPropertyName];
  var value;

  if (query.path)
    value = dotty.get(data, query.path);
  else
    value = data;

  if (typeof value == 'undefined')
    throw new Error('Shared data value with key "'+ query.path +'" not found');
  else if (value === null)
    throw new Error('Shared data value cannot be null');

  return value;
};

/**
 * @param {Compiler} compiler
 * @param {*} data
 */
module.exports.plugInCompiler = function (compiler, data) {
  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('normal-module-loader', function (loaderContext) {
      loaderContext[loaderContextPropertyName] = data;
    });
  });
};

module.exports.CONTEXT_PROPERTY_NAME = loaderContextPropertyName;