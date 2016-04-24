var parseComments = require('dox').parseComments;
var Promise = require('bluebird');

var Plugin = require('./Plugin');
var HOOKS = require('../hooks');
var xmlExampleParser = require('./parsers/xmlExampleParser');
var DocPage = require('../data/DocPage');
var PageSection = require('../data/PageSection');

var flatten = require('../utils/flatten');

var defaultOptions = {
  extractExamples: true,
  exampleFormat: 'xml'
};

/**
 * @constructor
 */
var JsDocExtractorPlugin = Plugin.create(defaultOptions);

JsDocExtractorPlugin.prototype.name = 'jsdoc';

JsDocExtractorPlugin.prototype.extract = extractor;

JsDocExtractorPlugin.prototype.apply = function(compiler) {
  var extractorPlugin = this;

  compiler.plugin(HOOKS.CONFIGURE, function(plugin) {
    plugin.registerExtractor(extractorPlugin);
  })
};

/**
 * @param {string} source
 * @param {Object} options
 * @this {DocsPluginExtractorContext}
 */
function extractor(source, options) {
  var isEmpty = source.trim() == '';
  if (isEmpty)
    return Promise.resolve(null);

  var tree = parseComments(source);

  var exampleTags = flatten(tree, function (node) {
    return node.type && node.type == 'example'
  });

  if (!exampleTags.length)
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

module.exports = JsDocExtractorPlugin;