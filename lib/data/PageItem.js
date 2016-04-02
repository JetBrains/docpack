/**
 * @param {Object} data
 * @param {string|Object} data.content
 * @param {Array<Example>} data.examples
 * @constructor
 */
function PageItem(data) {
  this.content = data.content || null;
  this.examples = data.examples || [];
}

/** @type {string|Object} */
PageItem.prototype.content = null;

/** @type {Array<Example>} */
PageItem.prototype.examples = null;

PageItem.prototype.toJSON = function() {
  return {
    content: this.content,
    examples: this.examples.map(function (example) {
      return example.toJSON()
    })
  }
};

module.exports = PageItem;