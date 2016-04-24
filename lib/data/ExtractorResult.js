var serialize = require('./utils/serialize');

/**
 * @param {Object} data
 * @param {Source} data.source
 * @param {string} [data.id] If no specified source.absolutePath will be used
 * @param {Object} [data.attrs]
 * @constructor
 */
function ExtractorResult (data) {
  if (!data.source) throw new Error('Source must be provided');

  this.source = data.source;
  this.id = data.source.absolutePath;
  this.attrs = data.attrs || {};
}

/** @type {string} */
ExtractorResult.prototype.id = null;

/** @type {Object} */
ExtractorResult.prototype.attrs = null;

/**
 * @returns {Object}
 */
ExtractorResult.prototype.serialize = function () {
  return serialize(this);
};

module.exports = ExtractorResult;