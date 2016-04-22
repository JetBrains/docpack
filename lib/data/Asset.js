/**
 * @param {string} type html, js, css, scss, md, etc
 * @param {string} source
 * @param {string} [path]
 * @constructor
 */
function Asset(type, source, path) {
  this.type = type;
  this.source = source;
  this.path = path || null;
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