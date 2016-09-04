var path = require('path');
var parseComments = require('dox').parseComments;
var Promise = require('bluebird');

var Plugin = require('./Plugin');
var HOOKS = require('../hooks');
var xmlExampleParser = require('./parsers/xmlExampleParser');
var DocPage = require('../data/Page');
var PageSection = require('../data/PageSection');

var flatten = require('../utils/find');
var format = require('util').format;

var defaultOptions = {
  extractExamples: true,
  exampleFormat: 'xml'
};

/**
 * @constructor
 */
var JsDocExtractorPlugin = Plugin.create(defaultOptions);

JsDocExtractorPlugin.prototype.getName = function() { return 'jsdoc' };

JsDocExtractorPlugin.prototype.extract = extractor;

JsDocExtractorPlugin.prototype.apply = function(compiler) {
  var extractorPlugin = this;

  compiler.plugin(HOOKS.CONFIGURE, function(plugin) {
    plugin.registerExtractor(extractorPlugin);
  })
};

/**
 * @param {string} content
 * @param {Object} options
 * @this {DocpackExtractorContext}
 */
function extractor(content, options) {
  var isEmpty = content.trim() == '';
  if (isEmpty)
    return Promise.resolve(null);

  var extractor = this;
  var source = this.source;

  try {
    var tree = parseComments(content);
  } catch (e) {
    var error = new Error(format('Invalid JSDoc in %s\n%s', source.path, e.toString()));
    return Promise.reject(error);
  }

  var page = new DocPage({source: source});
  var promises = [];

  tree.forEach(function (record, i) {

    // Tags from first comment goes to page attributes
    if (i == 0 && record.tags && record.tags.length > 0) {
      record.tags.forEach(function(tag) {
        page.attrs[tag.type] = tag.string;
      });
    }

    // Section
    var section = new PageSection({data: record});
    page.sections.push(section);

    // Section description
    var description = record.tags.filter(function(tag) {
      return tag.type == 'description'
    })[0];

    if (description) {
      section.attrs.description = description.html;
    }

    // Examples
    flatten(record.tags, function(record) {
      return record.hasOwnProperty('type') && /^(example|example-file)$/.test(record.type)
    })
    .forEach(function(tag) {
      var exampleContent;
      var extractPromise;

      switch (tag.type) {
        default:
        case 'example':
          exampleContent = tag.string;
          extractPromise = Promise.resolve(xmlExampleParser(exampleContent));
          break;

        case 'example-file':
          var exampleFilePath = path.resolve( path.dirname(source.absolutePath), tag.string );
          extractor.addDependency(exampleFilePath);

          extractPromise = extractor.readFile(exampleFilePath).then(function(content) {
            return xmlExampleParser(content.toString('utf-8'));
          });
          break;
      }

      extractPromise.then(function(examples) {
        if (examples.length)
          section.examples = section.examples.concat(examples);
      });

      promises.push(extractPromise);

    });
  });

  return Promise.all(promises).then(function () {
    return page;
  });
}

module.exports = JsDocExtractorPlugin;