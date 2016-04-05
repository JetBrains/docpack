var serialize = require('./utils/serialize');

/**
 * @param {Object} [data]
 * @param {string} data.path
 * @param {string} data.content
 * @param {Object} data.attrs
 * @param {Array<ExampleFile>} data.files
 * @constructor
 */
function Example(data) {
  var data = data || {};

  this.path = data.path || null;
  this.files = data.files || [];
  this.content = data.content || null;
  this.attrs = data.attrs || {};
}

/**
 * @type {Array<ExampleFile>}
 */
Example.prototype.files = null;

/**
 * @type {string}
 */
Example.prototype.path = null;

/**
 * Rendered example content
 *
 * @type {string}
 */
Example.prototype.content = null;

/**
 * @type {Object}
 */
Example.prototype.attrs = null;

/**
 * @returns {Object}
 */
Example.prototype.serialize = function () {
  return serialize(this, {
    files: this.files.map(function(file) { return file.serialize() })
  });
};

module.exports = Example;