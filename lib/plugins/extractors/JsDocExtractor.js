var Extractor = require('./Extractor');
var Promise = require('bluebird');
var parse = require('dox').parseComments;
var flatten = require('../../utils/flatten');
var data = require('../../data');

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
  tree.forEach(function (record) {
    var section = new data.PageSection({content: record});
    page.sections.push(section);

    record.tags && record.tags.forEach(function (tag) {
      var type = tag.type;
      switch (type) {
        case 'name':
        case 'category':
        case 'collection':
          page.attrs[type] = tag.string;
          break;
      }
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