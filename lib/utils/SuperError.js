var sprintf = require('sprintf');

function SuperError(message) {
  var args = [message];

  if (arguments.length > 1) {
    for (var i = 1, len = arguments.length; i < len; i++)
      args.push(arguments[i]);
  }

  var formatted = sprintf.apply(null, args);

  return new Error(formatted);
}

module.exports = SuperError;