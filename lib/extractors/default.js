var parse = require('dox').parseComments;
var flatten = require('../utils/flatten');
var extend = require('../utils/extend');

var Page = require('../data/Page');
var PageItem = require('../data/PageItem');

var parseExample = require('./utils/xmlExampleParser');
var Example = require('../data/Example');
var ExampleFile = require('../data/ExampleFile');

/**
 * @param {string} source
 */
module.exports = function(source) {
  var isEmtpty = source.trim() === '';
  if (isEmtpty)
    return null;

  var syntaxTree = parse(source.trim());
  if (syntaxTree.length === 1 && syntaxTree[0].line === 1)
    return null;

  var page = new Page();

  // Content
  syntaxTree.forEach(function(record) {
    page.items.push(new PageItem({content: record}));

    record.tags && record.tags.forEach(function(tag) {
      var type = tag.type;
      switch (type) {
        case 'name':
          page.setMeta(type, tag.string);
          break;
      }
    });
  });

  // Examples
  page.items
    .filter(function (item) { return typeof item.content.tags !== 'undefined' })
    .forEach(function (item, itemIndex) {
      item.content.tags
        .filter(function (tag) { return tag.type === 'example' })
        .forEach(function (tag) {
          var examples = parseExample(tag.string);
          if (examples === null)
            return;

          examples.forEach(function(exampleInfo, exampleIndex) {
            var example = new Example({name: exampleInfo.name});

            exampleInfo.files.forEach(function (file, index) {
              var it = new ExampleFile();
              extend(it, file);
              example.files.push(it);
            });

            item.examples.push(example);
          });
        })
    });

  flatten(page.items, function (item) {
    var path = this.path;
    if (item instanceof Example)
      item.id = path.splice(1, 1) && path.join('.');
    else if (item instanceof ExampleFile) {
      item.id = path.splice(1, 1) && path.splice(2, 1) && path.join('.');
    }
  });

  return page;
};