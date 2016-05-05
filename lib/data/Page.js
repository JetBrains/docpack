var ExtractorResult = require('./ExtractorResult');
var serialize = require('./utils/serialize');

/**
 * @param {Object} data
 * @param {Source} data.source
 * @param {Array<PageSection>} [data.sections]
 * @extends ExtractorResult
 * @constructor
 */
function Page(data) {
  ExtractorResult.call(this, data);

  this.sections = data.sections || [];
  this.path = data.path || null;
}

Page.prototype = Object.create(ExtractorResult.prototype);

/** @type {Array<PageSection>} */
Page.prototype.sections = null;

/** @type {string} */
Page.prototype.path = null;

/**
 * @returns {Object}
 */
Page.prototype.serialize = function () {
  return serialize(this, {
    source: this.source,
    sections: this.sections.map(function (item) {
      return item.serialize()
    })
  });
};

module.exports = Page;