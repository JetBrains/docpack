var merge = require('merge-options');

/**
 * @abstract
 * @param {Object} [options]
 * @constructor
 */
function Plugin(options) {
  this.options = options;
}

Plugin.create = function (defaultOptions) {
  function PluginImplementation() {
    var options = merge(
      defaultOptions || {},
      arguments[0] || {}
    );

    Plugin.call(this, options);
  }

  PluginImplementation.prototype = Object.create(Plugin.prototype);
  return PluginImplementation;
};

module.exports = Plugin;