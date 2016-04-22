var serialize = require('./utils/serialize');

/**
 * @param {Object} [data]
 * @constructor
 */
function Example(data) {
  var data = data || {};

  this.id = data.id || null;
  this.attrs = data.attrs || {};
  this.files = data.files || [];
  this.source = data.source || null;
  this.path = data.path || null;
}

/** @type {string} */
Example.prototype.id = null;

/** @type {Object} */
Example.prototype.attrs = null;

/** @type {Array<ExampleFile>} */
Example.prototype.files = null;

/** @type {string} */
Example.prototype.source = null;

/** @type {string} */
Example.prototype.path = null;

/**
 * @returns {Object}
 */
Example.prototype.serialize = function () {
  return serialize(this, {
    files: this.files.map(function(file) { return file.serialize() })
  });
};

module.exports = Example;