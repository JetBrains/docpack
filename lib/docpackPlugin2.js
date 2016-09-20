var mergeOptions = require('merge-options');
var isObject = require('is-plain-object');

/**
 * @abstract
 * @constructor
 */
function DocpackPlugin() {}

/**
 * @static
 * @param {String} name
 * @param {Object|Function} [config]
 * @param {Function} [body]
 * @returns {DocpackPlugin}
 */
DocpackPlugin.create = function (name, config, body) {
  if (typeof name != 'string') {
    throw new Error('Plugin name should be defined');
  }

  var apply = null;
  var defaultConfig = null;

  if (typeof config == 'function') {
    apply = config;
    defaultConfig = {};
  } else if (isObject(config)) {
    defaultConfig = config;
    apply = typeof body == 'function' ? body : null;
  }

  function PluginImplementation(config) {
    if (this instanceof PluginImplementation == false) {
      return new PluginImplementation(config);
    }

    this.config = mergeOptions(
      defaultConfig || {},
      config || {}
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