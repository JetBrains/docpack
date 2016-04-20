var path = require('path');
var parse = require('posthtml-parser');
var render = require('posthtml-render');
var flatten = require('../utils/flatten');
var data = require('../data');

/**
 * @param {string} content
 * @returns {Array<Example>|null}
 */
module.exports = function (content) {
  if (content.trim() == '' || content.indexOf('<example') == -1)
    return [];

  var examples = [];
  var tree = parse(content);

  tree
  .filter(function (node) { return node.tag && node.tag == 'example' })
  .forEach(function (node) {
    // skip empty tags
    if (!Array.isArray(node.content) || node.content.join('').trim() == '')
      return;

    var example = new data.Example({
      attrs: node.attrs,
      files: []
    });

    node.content
    .filter(function (node) { return node.tag && node.tag == 'file' })
    .forEach(function (node, itemIndex) {
      // skip empty tags
      if (!Array.isArray(node.content) || node.content.join('').trim() == '')
        return;

      var file = new data.ExampleFile({
        attrs: node.attrs,
        content: render(node.content)
      });

      file.type = file.attrs.name ? path.extname(file.attrs.name).substr(1) : null;
      file.type = file.attrs.type ? file.attrs.type : file.type;

      example.files.push(file);
    });

    examples.push(example);
  });

  return examples;
};