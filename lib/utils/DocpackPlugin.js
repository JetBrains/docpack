var mergeOptions = require('merge-options');
var isPlainObject = require('is-plain-object');

var UNNAMED_PLUGIN_NAME = 'docpack-unnamed-plugin';

/**
 * @abstract
 * @constructor
 */
function DocpackPlugin() {}

/**
 * @param {Object|Function} [opts]
 * @property {String} opts.name
 * @property {Object} opts.defaultConfig
 * @property {Function} opts.init
 * @property {Function} opts.apply
 */
function createPlugin(opts) {
  var options = {};
  if (typeof opts == 'function') {
    options.apply = opts;
  } else if (isPlainObject(opts)) {
    options = opts;
  } else if (typeof opts !== 'undefined') {
    throw new TypeError('createPlugin argument can be a function or object only');
  }

  /**
   * @constructor
   */
  function PluginImplementation(config) {
    if (this instanceof PluginImplementation == false) {
      return new PluginImplementation(config);
    }

    this.config = mergeOptions(
      options.defaultConfig || {},
      isPlainObject(config) ? config : {}
    );

    if (options.init) {
      options.init.call(this, config);
    }
  }

  PluginImplementation.prototype = Object.create(DocpackPlugin.prototype);

  PluginImplementation.prototype.config = null;

  PluginImplementation.prototype._name = options.name || UNNAMED_PLUGIN_NAME;

  PluginImplementation.prototype.getName = function() {
    return this._name;
  };

  if (options.apply) {
    PluginImplementation.prototype.apply = options.apply;
  }

  return PluginImplementation;
}

module.exports = DocpackPlugin;
module.exports.create = createPlugin;
module.exports.UNNAMED_PLUGIN_NAME = UNNAMED_PLUGIN_NAME;