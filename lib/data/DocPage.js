var Page = require('./Page');
var serialize = require('./utils/serialize');

/**
 * @param {Object} [data]
 * @extends Page
 * @constructor
 */
function DocPage(data) {
  var data = data || {};

  Page.call(this, data);

  this.source = data.source || {};
  this.sections = data.sections || [];
}

DocPage.prototype = Object.create(Page.prototype);

/** @type {Source} */
DocPage.prototype.source = null;

/** @type {Array<PageSection>} */
DocPage.prototype.sections = null;

/**
 * @returns {Object}
 */
DocPage.prototype.serialize = function () {
  return serialize(this, {
    source: this.source,
    sections: this.sections.map(function (item) { return item.serialize() })
  });
};

module.exports = DocPage;