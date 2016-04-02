function ContentItem(data) {
  this.content = data.content || null;
  this.examples = data.examples || [];
}

/** @type {string|Object} */
ContentItem.prototype.content = null;

/** @type {Array<Example>} */
ContentItem.prototype.examples = null;

ContentItem.prototype.toJSON = function() {
  return {
    content: this.content,
    examples: this.examples.map(function (example) {
      return example.toJSON()
    })
  }
};

module.exports = ContentItem;