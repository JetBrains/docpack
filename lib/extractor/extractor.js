var parse = require('dox').parseComments;
var extractModuleMeta = require('./extract-meta');
var parseExample = require('./html-example-parser');

/**
 * @param {string} source
 * @param {Object} context
 * @param {Object} context.loader Loader context
 * @param {Object} [context.plugin] Plugin instance
 * @returns {{content: Array<Object>, meta: Object}}
 */
module.exports = function(source, context) {
  var content = parse(source);
  var meta = extractModuleMeta(content);

  content
    .filter(function (record) { return typeof record.tags !== 'undefined' })
    .forEach(function (record, recordIndex) {
      record.tags
        .filter(function (tag) { return tag.type === 'example' })
        .forEach(function (tag) {
          var examples = parseExample(tag.string);
          if (examples === null)
            return;

          examples.forEach(function(example, exampleIndex) {
            example.items.forEach(function (item, itemIndex) {
              item.id = recordIndex + '.' + exampleIndex + '.' + itemIndex;
            });
          });

          record.examples = examples;
        })
    });

  return {
    meta: meta,
    content: content
  };
};