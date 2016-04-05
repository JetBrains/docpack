var serialize = require('./utils/serialize');

/**
 * @param {Object} [data]
 * @param {string|Object} data.content
 * @param {Array<Example>} data.examples
 * @param {Object} data.attrs
 * @constructor
 */
function PageItem(data) {
  var data = data || {};

  this.content = data.content || null;
  this.examples = data.examples || [];
  this.attrs = data.attrs || {};
}

/**
 * AST or string file representation.
 *
 * @type {string|Object}
 */
PageItem.prototype.content = null;

/**
 * @type {Array<Example>}
 */
PageItem.prototype.examples = null;

/**
 * @type {Object}
 */
PageItem.prototype.attrs = null;

/**
 * @returns {Object}
 */
PageItem.prototype.serialize = function () {
  return serialize(this, {
    content: this.content,
    examples: this.examples.map(function(example) { return example.serialize() })
  });
};

module.exports = PageItem;