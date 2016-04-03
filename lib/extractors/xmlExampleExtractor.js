var Example = require('../data/Example');
var ExampleFile = require('../data/ExampleFile');
var parseExample = require('./xmlExampleParser');
var extend = require('../utils/extend');

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

          examples.forEach(function(example, exampleIndex) {
            var ex = new Example({name: example.name});

            example.files.forEach(function (file, index) {
              var it = new ExampleFile();
              extend(it, file);
              it.id = itemIndex + '.' + exampleIndex + '.' + index;
              ex.files.push(it);
            });

            item.examples.push(ex);
          });
        })
    });

  return page;
};