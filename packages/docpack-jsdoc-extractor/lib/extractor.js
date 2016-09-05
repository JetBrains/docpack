var path = require('path');
var parseComments = require('dox').parseComments;
var Promise = require('bluebird');
var format = require('util').format;

var CodeBlock = require('docpack/lib/data/CodeBlock');
var Example = require('docpack/lib/data/Example');
var xmlExampleParser = require('./parseXMLExamples');

/**
 * @param {Source} source
 * @returns {Promise<Source|null>}
 */
module.exports = function extract(source) {
  var extractor = this;
  var content = source.content;
  var isEmpty = content.trim() == '';

  if (isEmpty) {
    return Promise.resolve(null);
  }

  try {
    var tree = parseComments(content);
  } catch (e) {
    var error = new Error(format('Invalid JSDoc in %s\n%s', source.path, e.toString()));
    return Promise.reject(error);
  }

  var promises = [];
  var firstRecord = tree[0];

  // Tags from first comment goes to source attributes
  if (firstRecord && firstRecord.tags && firstRecord.tags.length > 0) {
    firstRecord.tags.forEach(function (tag) {
      source.attrs[tag.type] = tag.string;
    });
  }

  tree.forEach(function (record, i) {
    var codeBlock = new CodeBlock({content: record.code || ''});
    var tags = record.tags;

    if (record.description) {
      codeBlock.description = record.description.full;
    }

    // Tags
    tags && record.tags.forEach(function(tag) {
      var tagName = tag.type;
      var tagContent = tag.string;

      codeBlock.attrs[tagName] = tagContent;

      switch (tagName) {
        case 'description':
          codeBlock.attrs.description = tag.html;
          break;

        case 'example':
          var examples = xmlExampleParser(tagContent);
          if (examples.length == 0) {
            examples.push(new Example({content: tagContent}));
          }
          codeBlock.examples = codeBlock.examples.concat(examples);
          break;

        case 'example-file':
          var exampleFilePath = path.resolve( path.dirname(source.absolutePath), tagContent );
          extractor.addDependency(exampleFilePath);

          var promise = extractor.readFile(exampleFilePath).then(function(content) {
            var examples = xmlExampleParser(content.toString('utf-8'));
            codeBlock.examples = codeBlock.examples.concat(examples);
          });
          promises.push(promise);
          break;
      }
    });

    source.blocks.push(codeBlock);
  });

  return Promise.all(promises).then(function () {
    return source;
  });
};