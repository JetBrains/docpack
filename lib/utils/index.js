var interpolateName = require('loader-utils').interpolateName;
var extend = require('extend');

/**
 * Interpolates a filename template using multiple placeholders.
 *
 * @see https://github.com/webpack/loader-utils#interpolatename
 * @param {string} filename Name with optional pattern placeholders
 * @param {Object} options
 * @param {string} options.path Absolute resource path
 * @param {string} options.context Absolute context path
 * @param {string} [options.content] Resource content
 */
exports.interpolateName = function (filename, options) {
  return interpolateName({resourcePath: options.path}, filename, {
    context: options.context,
    content: options.content
  });
};

exports.extend = function() {
  var args = [true, {}];

  for (var i = 0, len = arguments.length; i < len; i++)
    args.push(arguments[i]);

  return extend.apply(null, args);
};

exports.isObject = require('is-plain-object');

exports.compiler = require('./compiler');

exports.compilation = require('./compilation');

exports.loader = require('./loader');