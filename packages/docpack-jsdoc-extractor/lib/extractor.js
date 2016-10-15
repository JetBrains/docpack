var path = require('path');
var parseComments = require('dox').parseComments;
var Promise = require('bluebird');
var format = require('util').format;

var CodeBlock = require('docpack/lib/data/CodeBlock');
var Example = require('docpack/lib/data/Example');
var parseXMLExample = require('./parseXMLExamples');

/**
 * @param {Source} source
 * @param {Object} options
 * @returns {Promise<Source>}
 */
module.exports = function extract(source, options) {
  var opts = options || {};
  var extractor = this;
  var content = source.content;
  var isEmpty = content.trim() == '';

  if (isEmpty) {
    return Promise.resolve(source);
  }

  try {
    var comments = parseComments(content, opts);
  } catch (e) {
    var error = new Error(format('Invalid JSDoc in %s\n%s', source.path, e.toString()));
    return Promise.reject(error);
  }

  var promises = [];

  if (comments.length > 0) {
    source.blocks = [];
  }

  comments.forEach(function (comment, commentIndex) {
    var isFirstComment = commentIndex == 0;
    var codeBlock = new CodeBlock({content: comment.code || ''});
    var tags = comment.tags;

    if (comment.description) {
      codeBlock.description = comment.description.full;
    }

    // Tags
    tags && comment.tags.forEach(function(tag, i) {
      var tagName = tag.type;
      var tagContent = tag.string;

      // Every tag from first comment goes to source attributes
      if (isFirstComment) {
        source.attrs[tagName] = tagContent;
      }

      switch (tagName) {
        default:
          codeBlock.attrs[tagName] = tagContent;
          break;

        case 'description':
          codeBlock.attrs.description = opts.raw ? tag.full : tag.html;
          break;

        case 'example':
          var examples = parseXMLExample(tagContent);
          if (examples.length == 0) {
            examples.push(new Example({content: tagContent}));
          }

          codeBlock.examples = codeBlock.examples.concat(examples);
          break;

        case 'example-file':
          var filepath = path.resolve( path.dirname(source.absolutePath), tagContent );

          var promise = extractor.readFile(filepath)
            .then(function (content) {
              extractor.addDependency(filepath);
              codeBlock.examples.push(parseXMLExample(content));
            })
            .catch(function(err) {
              var error = err;

              if (err.code == 'ENOENT') {
                error = new Error(format('Example file "%s" not found in %s (line %s)', tagContent, source.path, comment.line));
              }

              return Promise.reject(error);
            });

          promises.push(promise);
          break;
      }
    });

    source.blocks.push(codeBlock);
  });

  return Promise.all(promises).then(function () {
    // turn examples array of arrays into flat list
    source.blocks.forEach(function(block) {
      block.examples = [].concat.apply([], block.examples);
    });

    return source;
  });
};