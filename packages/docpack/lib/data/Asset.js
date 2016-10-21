var required = require('./utils/required');

/**
 * @param {Object} data
 * @param {String} data.type
 * @param {String} data.content
 * @param {String} [data.path]
 * @constructor
 */
function Asset(data) {
  required(['type', 'content'], data);

  this.type = data.type;
  this.content = data.content;
  this.path = data.path || null;
}

Asset.prototype.toString = function() {
  return this.content;
};

module.exports = Asset;