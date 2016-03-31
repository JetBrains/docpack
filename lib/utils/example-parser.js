var parse = require('posthtml-parser');
var render = require('posthtml-render');
var extend = require('object-assign');

module.exports = function(source) {
  if (source.indexOf('<example') === -1)
    return null;

  var examples = [];
  var tree = parse(source);

  tree
    .filter(function(node) { return typeof node !== 'string' && node.tag === 'example' })
    .forEach(function(node, exampleIndex) {
      var example = extend({}, node.attrs);
      example.items = [];

      node.content
        .filter(function(node) { return typeof node !== 'string' && node.tag === 'file' })
        .forEach(function(node, itemIndex) {
          var item = extend({}, node.attrs);
          item.type = item.name.substr(item.name.lastIndexOf('.') + 1);
          item.assets = [];
          example.items.push(item);
        });

      examples.push(example);
    });

  return examples;
};