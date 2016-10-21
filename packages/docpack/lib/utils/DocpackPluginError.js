function DocpackPluginError(message, plugin) {
  Error.call(this);

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, arguments.callee);
  }

  this.message = plugin.getName() + ': ' + message;
  this.plugin = plugin;
}

module.exports = DocpackPluginError;

DocpackPluginError.prototype = Object.create(Error.prototype);