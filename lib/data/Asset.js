var emit = require('../utils/compilation/emitFile');

function Asset(path, content) {
  this.path = path;
  this.content = content;
}

/** @type {string} */
Asset.prototype.path = null;

/** @type {string} */
Asset.prototype.content = null;

/**
 * @param {Compilation} compilation
 */
Asset.prototype.emit = function(compilation) {
  emit(compilation, this.path, this.content);
};

module.exports = Asset;