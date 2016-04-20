var mergeOptions = require('merge-options');
var HOOKS = require('../../hooks');

/**
 * @abstract
 * @param options
 * @constructor
 */
function Extractor(options) {
  this.options = mergeOptions(this.defaultOptions || {}, options || {});
}

Extractor.prototype.name = null;

Extractor.prototype.defaultOptions = null;

Extractor.prototype.extract = null;

Extractor.prototype.apply = function(compiler) {
  var extractor = this;

  compiler.plugin(HOOKS.CONFIGURE, function(plugin) {
    plugin.registerExtractor(extractor);
  });
};

module.exports = Extractor;