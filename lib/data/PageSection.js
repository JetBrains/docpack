var serialize = require('./utils/serialize');

/**
 * @param {Object} [data]
 * @constructor
 */
function PageSection(data) {
  var data = data || {};

  this.id = data.id || null;
  this.attrs = data.attrs || {};
  this.content = data.content || null;
  this.examples = data.examples || [];
}

/** @type {string} */
PageSection.prototype.id = null;

/** @type {Object} */
PageSection.prototype.attrs = null;

/**
 * AST or string file representation.
 *
 * @type {string|Object}
 */
PageSection.prototype.content = null;

/** @type {Array<Example>} */
PageSection.prototype.examples = null;

/**
 * @returns {Object}
 */
PageSection.prototype.serialize = function () {
  return serialize(this, {
    content: this.content,
    examples: this.examples.map(function(example) { return example.serialize() })
  });
};

module.exports = PageSection;