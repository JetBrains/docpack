var serialize = require('./utils/serialize');

/**
 * @param {Object} [data]
 * @param {string} data.path
 * @param {string} data.content
 * @param {string} data.type html, js, css, scss, md, etc
 * @constructor
 */
function Asset(data) {
  this.path = data.path || null;
  this.content = data.content || null;
  this.type = data.type || null;
}

/** @type {string} */
Asset.prototype.path = null;

/** @type {string} */
Asset.prototype.content = null;

/** @type {string} */
Asset.prototype.type = null;

/**
 * @returns {Object}
 */
Asset.prototype.serialize = function () {
  return serialize(this);
};

module.exports = Asset;