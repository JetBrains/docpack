var required = require('./utils/required');

/**
 * @param {Object} data
 * @param {String} data.type
 * @param {String} data.content
 * @param {Object<String, String>} [data.attrs={}]
 * @param {Array<Asset>} [data.assets=[]]
 * @constructor
 */
function ExampleFile(data) {
  required(['type', 'content'], data);

  this.type = data.type;
  this.content = data.content;
  this.attrs = data.attrs || {};
  this.assets = data.assets || [];
}

module.exports = ExampleFile;