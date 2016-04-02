function Page (data) {
  if (!data.source)
    throw new TypeError('`source` must be provided');

  this.source = data.source;
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
Page.prototype.url = null;

/**
 * @type {Array<ContentItem>}
 * */
Page.prototype.items = null;

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
    source: this.source,
    meta: this.meta,
    url: this.url,
    items: this.items.map(function(entity) { return entity.toJSON() })
  };
};

module.exports = Page;