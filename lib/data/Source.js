/**
 * @param {Object} data
 * @param {string} data.path
 * @param {string} data.absolutePath
 * @param {string} data.content
 * @constructor
 */
function Source(data) {
  this.path = data.path;
  this.absolutePath = data.absolutePath;
  this.content = data.content;
}

/** @type {string} */
Source.prototype.path = null;

/** @type {string} */
Source.prototype.absolutePath = null;

/** @type {string} */
Source.prototype.content = null;

module.exports = Source;