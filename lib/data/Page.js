/**
 * @param {Object} [data]
 * @param {Object} data.source
 * @param {Object} data.attrs
 * @param {Array<PageItem>} data.items
 * @constructor
 */
function Page (data) {
  var data = data || {};

  this.source = data.source || {};
  this.attrs = data.attrs || {};
  this.items = data.items || [];
}

/**
 * @type {Object}
 * @prop {string} path
 * @prop {string} absolutePath
 * @prop {string} content
 * @prop {Date} lastModified
 */
Page.prototype.source = null;

/**
 * @type {Object}
 */
Page.prototype.attrs = null;

/**
 * @type {Array<PageItem>}
 * */
Page.prototype.items = null;

/**
 * @type {string}
 */
Page.prototype.content = null;

/**
 * @type {string}
 * */
Page.prototype.path = null;

module.exports = Page;