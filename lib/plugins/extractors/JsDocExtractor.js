var Extractor = require('./Extractor');
var Promise = require('bluebird');
var parse = require('dox').parseComments;
var flatten = require('../../utils/flatten');
var data = require('../../data');
var xmlExampleParser = require('../../parsers/xmlExampleParser');

var HOOKS = require('../../hooks');
var resolve = Promise.resolve;

/**
 * @param {string} content
 * @param {Object} options
 * @this {DocsPluginExtractorContext}
 */
function extractor(content, options) {
  var isEmpty = content.trim() == '';
  if (isEmpty)
    return resolve(null);

  var tree = parse(content);

  var examplesTags = flatten(tree, function (node) {
    return node.type && node.type == 'example'
  });

  if (!examplesTags.length)
    return resolve(null);

  var page = new data.DocPage();

  // Page content
  tree.forEach(function (record, i) {

    // First comment tags goes to page attributes
    if (i == 0 && record.tags && record.tags.length > 0)
      page.attrs = record.tags;

    // Section
    var section = new data.PageSection({content: record});
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

  return resolve(page);
}

/**
 * @constructor
 */
function JsDocExtractor(options) {
  Extractor.call(this, options);
}

JsDocExtractor.prototype = Object.create(Extractor.prototype);

JsDocExtractor.prototype.name = 'jsdoc';

JsDocExtractor.prototype.defaultOptions = {
  extractExamples: true,
  exampleFormat: 'xml'
};

JsDocExtractor.prototype.extract = extractor;

module.exports = JsDocExtractor;