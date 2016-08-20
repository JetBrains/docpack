var mergeOptions = require('merge-options');

/**
 * @param {Object} createOptions
 * @param {String} createOptions.name
 * @param {Object} [createOptions.defaultOptions]
 * @param {Function} [createOptions.apply]
 * @returns {Plugin}
 */
module.exports = function createPlugin(createOptions) {
  if (!createOptions.name) {
    throw new Error('Plugin name should be defined');
  }

  var name = createOptions.name;
  var defaultOptions = createOptions.defaultOptions;
  var apply = createOptions.apply;

  function Plugin(options) {
    if (this instanceof Plugin == false) {
      return new Plugin(options);
    }

    this.options = mergeOptions(
      defaultOptions || {},
      options || {}
    );
  }

  Plugin.prototype.getName = function() {
    return name;
  };

  if (apply) {
    Plugin.prototype.apply = apply;
  }

  return Plugin;
};