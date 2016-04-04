var Example = require('../data/Example');
var ExampleFile = require('../data/ExampleFile');
var parseExample = require('./../utils/extractor/xmlExampleParser');
var extend = require('../utils/extend');
var flatten = require('../utils/flatten');

/**
 * @param {Page} page
 */
module.exports = function(page) {
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