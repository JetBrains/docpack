var interpolateName = require('loader-utils').interpolateName;

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

exports.compiler = require('./compiler');
exports.compilation = require('./compilation');
exports.loader = require('./loader');