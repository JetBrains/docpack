var required = require('./utils/required');

/**
 * @param {Object} data
 * @param {String} data.content
 * @param {Object<String, String>} [data.attrs={}]
 * @param {Array<ExampleFile>} [data.files=[]]
 * @constructor
 */
function Example(data) {
  required(['content'], data);

  this.content = data.content;
  this.attrs = data.attrs || {};
  this.files = data.files || [];
}

module.exports = Example;