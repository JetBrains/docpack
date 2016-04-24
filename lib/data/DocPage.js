var ExtractorResult = require('./ExtractorResult');
var serialize = require('./utils/serialize');

/**
 * @param {Object} data
 * @param {Source} data.source
 * @param {Array<PageSection>} [data.sections]
 * @extends ExtractorResult
 * @constructor
 */
function DocPage(data) {
  ExtractorResult.call(this, data);

  this.sections = data.sections || [];
}

DocPage.prototype = Object.create(ExtractorResult.prototype);

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
    sections: this.sections.map(function (item) {
      return item.serialize()
    })
  });
};

module.exports = DocPage;