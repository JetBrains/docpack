/**
 * @param {Object} data
 * @param {string} data.type html, js, css, scss, md, etc
 * @param {string} data.source
 * @param {string} [data.path]
 * @constructor
 */
function Asset(data) {
  this.type = data.type;
  this.source = data.source;
  this.path = data.path || null;
}

/** @type {string} */
Asset.prototype.type = null;

/** @type {string} */
Asset.prototype.source = null;

/** @type {string} */
Asset.prototype.path = null;

/**
 * @returns {Object}
 */
Asset.prototype.serialize = function () {
  return {
    type: this.type,
    source: this.source,
    path: this.path
  };
};

Asset.prototype.toString = function() {
  return this.source;
};

module.exports = Asset;