var path = require('path');
var parse = require('posthtml-parser');
var render = require('posthtml-render');
var extend = require('extend');
var flatten = require('../utils/flatten');
var data = require('../data');

/**
 * @param {string} source
 * @returns {Array<Example>}
 */
module.exports = function(source) {
  if (source.indexOf('<example') == -1)
    return null;

  var examples = [];
  var tree = parse(source);

  tree
  .filter(function (node) { return node.tag && node.tag == 'example' })
  .forEach(function (node) {
    if (!Array.isArray(node.content))
      return;

    var example = new data.Example({
      attrs: node.attrs,
      files: []
    });

    node.content
    .filter(function (node) { return node.tag && node.tag == 'file' })
    .forEach(function (node, itemIndex) {
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