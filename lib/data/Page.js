var serialize = require('./utils/serialize');

/**
 * @param {Object} [data]
 * @constructor
 */
function Page (data) {
  var data = data || {};

  this.id = data.id || null;
  this.attrs = data.attrs || {};
  this.path = data.path || null;
  this.content = data.content || null;
  this.source = data.source || {};
  this.sections = data.sections || [];
}

/** @type {string} */
Page.prototype.id = null;

/** @type {Object} */
Page.prototype.attrs = null;

/** @type {string} */
Page.prototype.path = null;

/** @type {string} */
Page.prototype.content = null;

/** @type {Source} */
Page.prototype.source = null;

/** @type {Array<PageSection>} */
Page.prototype.sections = null;


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