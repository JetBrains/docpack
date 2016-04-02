var extend = require('extend');

/**
 * @param {Object...} obj
 * @returns {Object}
 */
exports = function(obj) {
  var args = [true, {}];

  for (var i = 0, len = arguments.length; i < len; i++)
    args.push(arguments[i]);

  return extend.apply(null, args);
};