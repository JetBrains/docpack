var mergeOptions = require('merge-options');

/**
 * @abstract
 * @constructor
 */
function Plugin() {}

/**
 * @param {String} name
 * @param {Object} [createOptions]
 * @param {Object} [createOptions.defaultOptions]
 * @param {Function} [createOptions.apply]
 * @returns {Plugin}
 */
function createPlugin(name, createOptions) {
  if (typeof name != 'string') {
    throw new Error('Plugin name should be defined');
  }

  createOptions = createOptions || {};

  var defaultOptions = createOptions.defaultOptions;
  var apply = createOptions.apply;

  function PluginImplementation(options) {
    if (this instanceof PluginImplementation == false) {
      return new PluginImplementation(options);
    }

    this.options = mergeOptions(
      defaultOptions || {},
      options || {}
    );
  }

  PluginImplementation.prototype = Object.create(Plugin.prototype);

  PluginImplementation.prototype.getName = function() {
    return name;
  };

  if (apply) {
    PluginImplementation.prototype.apply = apply;
  }

  return PluginImplementation;
}

module.exports = createPlugin;
module.exports.Plugin = Plugin;