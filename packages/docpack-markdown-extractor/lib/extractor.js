var Promise = require('bluebird');
var parseFrontMatter = require('front-matter');
var merge = require('object-assign');
var Remarkable = require('remarkable');

/**
 * @param {Source} source
 * @param {Object} [options] Remarkable options
 * @returns {Promise<Source>}
 */
module.exports = function extract(source, options) {
  var content = source.content;
  var isEmpty = content.trim() == '';

  if (isEmpty) {
    return Promise.resolve(source);
  }

  var parsed = parseFrontMatter(content);
  if (parsed.frontmatter) {
    merge(source.attrs, parsed.attributes);
  }

  var md = new Remarkable(options);
  source.rendered = md.render(parsed.body);

  return Promise.resolve(source);
};