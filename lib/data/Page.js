/**
 * @param {Object} [data]
 * @param {Object} [data.source]
 * @param {Object} [data.meta]
 * @param {Array<PageItem>} [data.items]
 * @constructor
 */
function Page (data) {
  var data = data || {};
  this.source = data.source || {};
  this.meta = data.meta || {};
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
 * @prop {string} [title]
 * @prop {string} [description]
 * @prop {string} [category]
 * @prop {Array<string>} [tags]
 */
Page.prototype.meta = null;

/**
 * @type {string}
 * */
Page.prototype.path = null;

/**
 * @type {Array<PageItem>}
 * */
Page.prototype.items = null;

/**
 * @type {string}
 */
Page.prototype.content = null;

/**
 * @param {string} key
 * @param {*} value
 */
Page.prototype.setMeta = function (key, value) {
  this.meta[key] = value;
};

/**
 * @returns {Object}
 */
Page.prototype.toJSON = function() {
  return {
    content: this.content,
    meta: this.meta,
    path: this.path,
    items: this.items.map(function(item) { return item.toJSON() })
  };
};

module.exports = Page;