var parse = require('dox').parseComments;
var Page = require('../data/Page');
var PageItem = require('../data/PageItem');

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

  return page;
};