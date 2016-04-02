var Example = require('../../data/Example');
var ExampleItem = require('../../data/ExampleItem');
var parseExample = require('./xmlExampleParser');

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

            example.items.forEach(function (exampleItem, exampleItemIndex) {
              var it = new ExampleItem(exampleItem.type, exampleItem.content);
              it.id = itemIndex + '.' + exampleIndex + '.' + exampleItemIndex;
              ex.items.push(it);
            });

            item.examples.push(ex);
          });
        })
    });

  return page;
};