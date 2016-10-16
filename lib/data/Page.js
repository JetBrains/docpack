var required = require('./utils/required');

/**
 * @param {Object} data
 * @param {String} data.url
 * @param {String} [data.content]
 * @constructor
 */
function Page(data) {
  required(['url'], data);

  this.url = data.url;
  this.content = data.content || null;
}

module.exports = Page;