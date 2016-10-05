var dotty = require('dotty');
var loaderUtils = require('loader-utils');

var sharedDataPropertyName = __filename;

module.exports = function () {
  this.cacheable && this.cacheable();
  var done = this.async();
  var query = loaderUtils.parseQuery(this.query);
  var data = this[sharedDataPropertyName];
  var value;

  if (query.path) {
    value = dotty.get(data, query.path);
  }
  else {
    value = data;
  }

  if (typeof value == 'undefined') {
    var msg;
    if (query.path) {
      msg = 'Shared data value with key "'+ query.path +'" not found';
    } else {
      msg = 'Undefined is not allowed as shared data';
    }
    done(new Error(msg));
    return;
  }

  done(null, value);
};

/**
 * @param {Compiler} compiler
 * @param {*} data
 */
module.exports.plugInCompiler = function (compiler, data) {
  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('normal-module-loader', function (loaderContext) {
      loaderContext[sharedDataPropertyName] = data;
    });
  });
};

module.exports.SHARED_DATA_PROPERTY_NAME = sharedDataPropertyName;