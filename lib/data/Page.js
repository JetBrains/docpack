var serialize = require('./utils/serialize');

/**
 * @param {Object} [data]
 * @param {Object} data.source
 * @param {Object} data.attrs
 * @param {string} data.content
 * @param {Array<PageItem>} data.items
 * @constructor
 */
function Page (data) {
  var data = data || {};

  this.source = data.source || {};
  this.attrs = data.attrs || {};
  this.items = data.items || [];
  this.content = data.content || null;
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

/**
 * @returns {Object}
 */
Page.prototype.serialize = function () {
  return serialize(this, {
    source: this.source,
    items: this.items.map(function (item) { return item.serialize() })
  });
};


module.exports = Page;