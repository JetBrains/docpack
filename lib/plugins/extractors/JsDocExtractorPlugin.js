var Extractor = require('./ExtractorPlugin');
var Promise = require('bluebird');
var parse = require('dox').parseComments;
var flatten = require('../../utils/flatten');
var xmlExampleParser = require('./parsers/xmlExampleParser');
var DocPage = require('../../data/DocPage');
var PageSection = require('../../data/PageSection');

/**
 * @param {string} content
 * @param {Object} options
 * @this {DocsPluginExtractorContext}
 */
function extractor(content, options) {
  var isEmpty = content.trim() == '';
  if (isEmpty)
    return Promise.resolve(null);

  var tree = parse(content);

  var examplesTags = flatten(tree, function (node) {
    return node.type && node.type == 'example'
  });

  if (!examplesTags.length)
    return Promise.resolve(null);

  var page = new DocPage();

  // Page content
  tree.forEach(function (record, i) {

    // First comment tags goes to page attributes
    if (i == 0 && record.tags && record.tags.length > 0)
      page.attrs = record.tags;

    // Section
    var section = new PageSection({content: record});
    page.sections.push(section);

    // Examples
    var sectionExamples =
      flatten(record.tags, function(record) { return record.type == 'example' })
      .forEach(function(record) {
        var examples = xmlExampleParser(record.string);
        if (examples.length)
          section.examples = section.examples.concat(examples);
      });
  });

  return Promise.resolve(page);
}

/**
 * @constructor
 */
function JsDocExtractorPlugin(options) {
  Extractor.call(this, options);
}

JsDocExtractorPlugin.extractor = extractor;

JsDocExtractorPlugin.prototype = Object.create(Extractor.prototype);

JsDocExtractorPlugin.prototype.name = 'jsdoc';

JsDocExtractorPlugin.prototype.defaultOptions = {
  extractExamples: true,
  exampleFormat: 'xml'
};

JsDocExtractorPlugin.prototype.extract = extractor;

module.exports = JsDocExtractorPlugin;