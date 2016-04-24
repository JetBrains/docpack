var interpolate = require('loader-utils').interpolateName;

/**
 * Interpolates a filename template using multiple placeholders.
 *
 * @see https://github.com/webpack/loader-utils#interpolatename
 * @param {string} filename Name with optional pattern placeholders
 * @param {Object} options
 * @param {string} options.path Absolute resource path
 * @param {string} options.context Absolute context path
 * @param {string} [options.content] Resource content
 * @param {Object} [options.replacements] Extra replacements, e.g {'[foo]': 'bar'}
 * @returns {string}
 */
function interpolateName(filename, options) {
  var interpolated = interpolate({resourcePath: options.path}, filename, {
    context: options.context,
    content: options.content
  });

  if (options.replacements) {
    for (var key in options.replacements) {
      var value = options.replacements[key];
      interpolated = interpolated.replace(key, value);
    }
  }

  return interpolated;
}

module.exports = interpolateName;