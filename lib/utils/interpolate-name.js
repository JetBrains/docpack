var interpolateName = require('loader-utils').interpolateName;

/**
 * @param {string} name
 * @param {Object} options
 * @param {string} options.path Full resource path
 * @param {string} options.context Full context path
 * @param {string} [options.content] Resource content
 */
module.exports = function (name, options) {
  return interpolateName({resourcePath: options.path}, name, {
    context: options.context,
    content: options.content
  });
};