var parse = require('dox').parseComments;
var extractModuleMeta = require('./utils/extract-module-meta');
var examplesParser = require('./utils/examples-parser');

/**
 * @param {string} source
 * @param {Object} context
 * @param {Object} context.loader Loader context
 * @param {Object} [context.plugin] Plugin instance
 * @returns {{body: Array}}
 */
module.exports = function(source, context) {
  var content = parse(source);
  var meta = extractModuleMeta(content);

  content
    .filter(function (record) { return typeof record.tags !== 'undefined' })
    .forEach(function (record) {
      record.tags
        .filter(function (tag) {
          return tag.type === 'example'
        })
        .forEach(function (tag) {
          var examples = examplesParser(tag.string);
          if (examples.length > 0)
            record.examples = examples;
        })
    });

  return {
    meta: meta,
    content: content
  };
};