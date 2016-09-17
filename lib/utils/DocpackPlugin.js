var mergeOptions = require('merge-options');
var isObject = require('is-plain-object');

/**
 * @abstract
 * @constructor
 */
function DocpackPlugin() {}

/**
 * @param {String} name
 * @param {Object} [config]
 * @param {Object} [config.defaultOptions]
 * @param {Function} [config.apply]
 * @returns {DocpackPlugin}
 */
DocpackPlugin.create = function (name, config, body) {
  if (typeof name != 'string') {
    throw new Error('Plugin name should be defined');
  }

  var apply;
  var defaultOptions;
  if (typeof config == 'function') {
    apply = config;
    defaultOptions = {};
  } else if (isObject(config)) {
    defaultOptions = config;
  }

  function PluginImplementation(options) {
    if (this instanceof PluginImplementation == false) {
      return new PluginImplementation(options);
    }

    this.options = mergeOptions(
      defaultOptions || {},
      options || {}
    );
  }

  PluginImplementation.prototype = Object.create(DocpackPlugin.prototype);

  PluginImplementation.prototype.getName = function () {
    return name;
  };

  if (apply) {
    PluginImplementation.prototype.apply = apply;
  }

  return PluginImplementation;
};

module.exports = DocpackPlugin;