/**
 * Extract tags from the first comment. Can be used only with dox AST format.
 *
 * @param {Array<Object>} content
 * @returns {Object}
 */
module.exports = function(content) {
  var meta = {};
  var record = content[0];

  if (record.description.full)
    meta.description = record.description.full;

  if (record.tags.length > 0) {
    record.tags.forEach(function(tag) {
      meta[tag.type] = tag.string;
    });
  }

  return meta;
};