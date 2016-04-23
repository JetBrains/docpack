var merge = require('merge-options');
var HOOKS = require('../../hooks');

/**
 * @abstract
 * @param options
 * @constructor
 */
function ExtractorPlugin(options) {
  this.options = merge(this.defaultOptions || {}, options || {});
}

ExtractorPlugin.prototype.name = null;

ExtractorPlugin.prototype.defaultOptions = null;

ExtractorPlugin.prototype.extract = null;

ExtractorPlugin.prototype.apply = function(compiler) {
  var extractor = this;

  compiler.plugin(HOOKS.CONFIGURE, function(plugin) {
    plugin.registerExtractor(extractor);
  });
};

module.exports = ExtractorPlugin;