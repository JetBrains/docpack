var HOOKS = require('../../hooks');
var Promise = require('bluebird');

function extractor(content, options) {
  return Promise.resolve()
}

function Plugin() {}

Plugin.prototype.apply = function(compiler) {
  compiler.plugin(HOOKS.CONFIGURE, function(plugin) {
    plugin.registerExtractor('jsdoc', extractor);
  })
};

module.exports = Plugin;
module.exports.extractor = extractor;