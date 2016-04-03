var parse = require('posthtml-parser');
var render = require('posthtml-render');
var extend = require('../extend');

/**
 * Parses xml-based examples and returns its javascript representation
 * @param {string} source
 * @returns {Array<Object>}
 */
module.exports = function(source) {
  if (source.indexOf('<example') === -1)
    return null;

  var examples = [];
  var tree = parse(source);

  tree
    .filter(function(node) { return typeof node !== 'string' && node.tag === 'example' })
    .forEach(function(node, exampleIndex) {
      var example = extend(node.attrs);
      example.files = [];

      node.content
        .filter(function(node) { return typeof node !== 'string' && node.tag === 'file' })
        .forEach(function(node, itemIndex) {
          var item = extend({}, node.attrs);

          item.type = item.name.substr(item.name.lastIndexOf('.') + 1);
          item.content = render(node.content);

          // TODO: remove wepback property checking
          if (item.hasOwnProperty('webpack'))
            item.compile = item.webpack;

          // Convert props from string to boolean
          ['compile', 'emit', 'render', 'webpack'].forEach(function(prop) {
            if (item.hasOwnProperty(prop))
              item[prop] = item[prop] === 'true';
          });

          example.files.push(item);
        });

      examples.push(example);
    });

  return examples;
};