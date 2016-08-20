var required = require('./utils/required');

/**
 * @param {Object} data
 * @param {String} data.path
 * @param {String} data.absolutePath
 * @param {String} data.content
 * @param {Object<String, String>} [data.attrs={}]
 * @param {Array<CodeBlock>} [data.blocks=[]]
 * @constructor
 */
function Source(data) {
  required(['path', 'absolutePath', 'content'], data);

  this.path = data.path;
  this.absolutePath = data.absolutePath;
  this.content = data.content;
  this.attrs = data.attrs || {};
  this.blocks = data.blocks || [];
}

module.exports = Source;