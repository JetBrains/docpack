var path = require('path');
var Promise = require('bluebird');

var Plugin = require('./Plugin');
var HOOKS = require('../hooks');
var DocPage = require('../data/Page');

var yaml = require('js-yaml');
var Remarkable = require('remarkable');

/**
 * @param {string} src Markdown source.
 * @param {string} [delimiter='---'] Front matter delimiter. --- by default.
 * @returns {{meta: Object, body: string}}
 */
function parseYAMLFrontMatter(src, delimiter) {
  var delimiter = delimiter || '---';
  var meta = null;
  var body = src;

  if (src.indexOf(delimiter) === 0) {
    // Identify end of YAML front matter
    var end = src.indexOf(delimiter, delimiter.length);

    if (end !== -1) {
      meta = src.substring(delimiter.length, end).trim();
      body = src.substring(end + delimiter.length).trim();
    }
  }

  return {
    meta: meta,
    body: body
  }
}

var defaultOptions = {
  extractExamples: true,
  exampleFormat: 'xml'
};

/**
 * @constructor
 */
var MarkdownExtractorPlugin = Plugin.create(defaultOptions);

MarkdownExtractorPlugin.prototype.getName = function() { return 'markdown' };

MarkdownExtractorPlugin.prototype.extract = extractor;

MarkdownExtractorPlugin.prototype.apply = function(compiler) {
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
  var page = new DocPage({source: source});

  var data = parseYAMLFrontMatter(content);
  if (data.meta) {
    var meta = yaml.load(data.meta);
    page.attrs = meta;
  }

  var md = new Remarkable();
  var rendered = md.render(data.body);
  page.content = rendered;

  return Promise.resolve(page);
}

module.exports = MarkdownExtractorPlugin;