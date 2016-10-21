var required = require('./utils/required');

/**
 * @param {Object} data
 * @param {String} data.content
 * @param {Object<String, String>} [data.attrs={}]
 * @param {Array<Example>} [data.examples=[]]
 * @constructor
 */
function CodeBlock(data) {
  required(['content'], data);

  this.content = data.content;
  this.description = data.description || null;
  this.attrs = data.attrs || {};
  this.examples = data.examples || [];
}

module.exports = CodeBlock;