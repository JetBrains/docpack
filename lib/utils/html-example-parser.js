var parse = require('posthtml-parser');
var render = require('posthtml-render');
var extend = require('object-assign');

/**
 * @typedef {Object} HTMLExample
 * @prop {string} name
 * @prop {Array<HTMLExampleItem>} items
 */

/**
 * @typedef {Object} HTMLExampleItem
 * @prop {string} name Example filename. Usually index.[type]
 * @prop {string} type Example type: js|html|css
 * @prop {string} source Example source code
 * @prop {string} webpack true|false
 */

/**
 * Parses html-based examples and returns its javascript representation for further compilation
 * @param {string} source
 * @returns {Array<HTMLExample>}
 */
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
          item.source = render(node.content);
          example.items.push(item);
        });

      examples.push(example);
    });

  return examples;
};