var format = require('util').format;

function PluginError(message) {
  var args = [message];

  if (arguments.length > 1) {
    for (var i = 1, len = arguments.length; i < len; i++)
      args.push(arguments[i]);
  }

  var formatted = format.apply(null, args);

  return new Error(formatted);
}

module.exports = PluginError;