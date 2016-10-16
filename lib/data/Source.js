var path = require('path');
var required = require('./utils/required');

/**
 * @param {Object} data
 * @param {String} data.path
 * @param {String} data.absolutePath
 * @param {String} data.content
 * @param {String} [data.type]
 * @param {Object<String, String>} [data.attrs={}]
 * @param {Array<CodeBlock>} [data.blocks=[]]
 * @constructor
 */
function Source(data) {
  required(['path', 'absolutePath', 'content'], data);

  this.path = data.path;
  this.absolutePath = data.absolutePath;
  this.content = data.content;
  this.type = data.type || path.extname(data.absolutePath).substr(1);
  this.attrs = data.attrs || {};
  this.blocks = data.blocks || [];
}

/**
 * @returns {Array<Example>}
 */
Source.prototype.getExamples = function() {
  return this.blocks.reduce(function(examples, block) {
    if (block.examples.length > 0) {
      examples = examples.concat(block.examples);
    }

    return examples;
  }, []);
};

module.exports = Source;