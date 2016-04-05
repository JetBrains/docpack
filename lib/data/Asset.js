var emit = require('../utils/compilation/emitFile');

/**
 * @param {Object} [data]
 * @param {string} data.path
 * @param {string} data.content
 * @constructor
 */
function Asset(data) {
  this.path = data.path || null;
  this.content = data.content || null;
}

/** @type {string} */
Asset.prototype.path = null;

/** @type {string} */
Asset.prototype.content = null;

module.exports = Asset;