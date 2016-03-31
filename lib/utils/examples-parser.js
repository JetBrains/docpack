var parse = require('posthtml-parser');
var render = require('posthtml-render');
var extend = require('object-assign');

module.exports = function(source) {
  var examples = [];

  if (source.indexOf('<example') === -1)
    return examples;

  var tree = parse(source);

  tree
    .filter(function(item) { return typeof item !== 'string' && item.tag === 'example' })
    .forEach(function(item) {
      var example = extend({}, item.attrs);
      example.files = [];

      item.content
        .filter(function(item) { return typeof item !== 'string' && item.tag === 'file' })
        .forEach(function(item) {
          var file = extend({}, item.attrs);
          file.type = file.name.substr(file.name.lastIndexOf('.') + 1);
          file.source = render(item.content);
          example.files.push(file);
        });

      examples.push(example);
    });

  return examples;
};