var parse = require('dox').parseComments;
var extractModuleMeta = require('./utils/extract-module-meta');

/**
 * @param {string} content
 * @param {Object} context
 * @param {Object} context.loader Loader context
 * @param {Object} [context.plugin] Plugin instance
 * @returns {{body: Array}}
 */
module.exports = function(content, context) {
  var parsed = parse(content);
  var meta = extractModuleMeta(parsed);

  return {
    meta: meta,
    content: parsed
  };
};