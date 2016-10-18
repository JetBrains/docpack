var sax = require('sax');
var stripIndent = require('strip-indent');

var Example = require('docpack/lib/data/Example');
var ExampleFile = require('docpack/lib/data/ExampleFile');

var FILE_TAG = 'file';
var EXAMPLE_TAG = 'example';
var PARSER_STRICT_MODE = false;
var PARSER_OPTIONS = { lowercase: true };
var TAG_START_REGEXP = /(?:<\s*\/\s*file\s*>)(?![\s\S]*<\s*\/\s*file\s*>)/;
var EXAMPLE_START_REGEXP = /(?:<\s*\/\s*example\s*>)(?![\s\S]*<\s*\/\s*example\s*>)/;

/**
 * @param {string} content
 * @returns {Array<Example>|null}
 */
module.exports = function (content) {
  var hasXMLExamples = content.match(EXAMPLE_START_REGEXP);

  var examples = [];
  var wrappedContent = '<root>' + content + '</root>';

  var files = [];
  var fileNode = null;
  var exampleNode = null;
  var fileContentStartPosition = null;
  var exampleContentStartPosition = null;

  var parser = sax.parser(PARSER_STRICT_MODE, PARSER_OPTIONS);

  if (!hasXMLExamples) {
    return [];
  }

  function stopFileParsing() {
    fileNode = null;
    fileContentStartPosition = null;
  }

  function stopExampleParsing() {
    files = [];
    exampleNode = null;
    exampleContentStartPosition = null;
  }

  function getTagContent(startPosition, currentPosition, regexp) {
    var previousContent = wrappedContent.substring(0, currentPosition);
    var match = previousContent.match(regexp);
    var endPosition = match && match.index;

    return endPosition ? wrappedContent.substring(startPosition, endPosition) : '';
  }

  parser.onopentag = function (node) {
    if (node.name === EXAMPLE_TAG && !exampleNode) {
      exampleNode = node;
      exampleContentStartPosition = parser.position;
    }

    // Don't go deeper than one level
    if (node.name === FILE_TAG && exampleNode && !fileNode) {
      fileNode = node;
      fileContentStartPosition = parser.position;
    }
  };

  parser.onclosetag = function (nodeName) {
    var tagContent;

    if (nodeName === EXAMPLE_TAG && exampleNode) {
      tagContent = getTagContent(
        exampleContentStartPosition,
        parser.position,
        EXAMPLE_START_REGEXP
      );

      examples.push(new Example({
        content: stripIndent(tagContent),
        attrs: exampleNode.attributes,
        files: files
      }));

      stopFileParsing();
      stopExampleParsing();
    }

    if (nodeName === FILE_TAG && exampleNode && fileNode) {
      tagContent = getTagContent(
        fileContentStartPosition,
        parser.position,
        TAG_START_REGEXP
      );

      if (tagContent == null) {
        stopFileParsing();
        return;
      }

      files.push(new ExampleFile({
        type: fileNode.attributes.type || 'js',
        content: stripIndent(tagContent),
        attrs: fileNode.attributes
      }));

      stopFileParsing();
    }
  };

  parser.write(wrappedContent).close();
  return examples;
};
