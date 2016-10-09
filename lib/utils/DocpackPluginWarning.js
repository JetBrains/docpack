var DocpackPluginError = require('./DocpackPluginError');

function DocpackPluginWarning(message, plugin) {
  DocpackPluginError.call(this, message, plugin);
}

module.exports = DocpackPluginWarning;

DocpackPluginWarning.prototype = Object.create(DocpackPluginError.prototype);