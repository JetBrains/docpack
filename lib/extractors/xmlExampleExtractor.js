var Example = require('../data/Example');
var ExampleFile = require('../data/ExampleFile');
var parseExample = require('./../utils/extractor/xmlExampleParser');
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

          examples.forEach(function(exampleInfo, exampleIndex) {
            var example = new Example();

            // hacky way to prevent override Example properties from file
            ['files', 'path'].forEach(function (prop) {
              if (exampleIndex.hasOwnProperty(prop))
                delete exampleInfo[prop];
            });
            extend(example, exampleInfo);

            exampleInfo.files.forEach(function (file, index) {
              var it = new ExampleFile();
              extend(it, file);
              it.id = itemIndex + '.' + exampleIndex + '.' + index;
              example.files.push(it);
            });

            item.examples.push(example);
          });
        })
    });

  return page;
};