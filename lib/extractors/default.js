var parse = require('dox').parseComments;
var flatten = require('../utils/flatten');
var extend = require('../utils/extend');
var parseExample = require('./utils/xmlExampleParser');
var getFileExtension = require('../utils/getFileExtension');

var Page = require('../data/Page');
var PageItem = require('../data/PageItem');
var Example = require('../data/Example');
var ExampleFile = require('../data/ExampleFile');

/**
 * @param {string} source
 * @param {Object} [options]
 * @this LoaderContext
 */
module.exports = function (source, options) {
  var isEmtpty = source.trim() === '';
  if (isEmtpty)
    return null;

  var tree = parse(source.trim());
  var page = new Page();

  // Content
  tree.forEach(function(record) {
    page.items.push(new PageItem({content: record}));

    record.tags && record.tags.forEach(function(tag) {
      var type = tag.type;
      switch (type) {
        case 'name':
          page.attrs[type] = tag.string;
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
            var example = new Example(exampleInfo);
            example.files = [];

            exampleInfo.files.forEach(function (file, index) {
              var it = new ExampleFile(file);
              var attrs = it.attrs;

              it.type = attrs.name ? getFileExtension(attrs.name) : null;
              it.type = attrs.type ? attrs.type : it.type;

              // TODO: remove wepback property checking
              if (attrs.hasOwnProperty('webpack'))
                attrs.compile = attrs.webpack;

              // Convert props from string to boolean
              ['compile', 'emit', 'render', 'webpack'].forEach(function (prop) {
                if (attrs.hasOwnProperty(prop))
                  attrs[prop] = attrs[prop] === 'true';
              });

              example.files.push(it);
            });

            item.examples.push(example);
          });
        })
    });

  // Ids
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