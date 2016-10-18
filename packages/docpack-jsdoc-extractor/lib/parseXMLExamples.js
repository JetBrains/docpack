const path = require('path');
const sax = require('sax');
const stripIndent = require('strip-indent');

const Example = require('docpack/lib/data/Example');
const ExampleFile = require('docpack/lib/data/ExampleFile');

const FILE_TAG = 'file';
const EXAMPLE_TAG = 'example';
const PARSER_STRICT_MODE = false;
const PARSER_OPTIONS = {lowercase: true};
const TAG_START_REGEXP = /(?:<\s*\/\s*file\s*>)(?![\s\S]*<\s*\/\s*file\s*>)/;
const EXAMPLE_START_REGEXP = /(?:<\s*\/\s*example\s*>)(?![\s\S]*<\s*\/\s*example\s*>)/;

/**
 * @param {string} content
 * @returns {Array<Example>|null}
 */
module.exports = function (content) {
  const hasXMLExamples = content.match(EXAMPLE_START_REGEXP);
  if (!hasXMLExamples) {
    return [];
  }

  const examples = [];
  const wrappedContent = '<root>' + content + '</root>';

  let files = [];
  let fileNode = null;
  let exampleNode = null;
  let fileContentStartPosition = null;
  let exampleContentStartPosition = null;

  const parser = sax.parser(PARSER_STRICT_MODE, PARSER_OPTIONS);

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
    const previousContent = wrappedContent.substring(0, currentPosition);
    const match = previousContent.match(regexp);
    const endPosition = match && match.index;

    return endPosition && wrappedContent.substring(startPosition, endPosition) || '';
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
    if (nodeName === EXAMPLE_TAG && exampleNode) {
      const content = getTagContent(exampleContentStartPosition, parser.position, EXAMPLE_START_REGEXP);
      examples.push(new Example({
        content: stripIndent(content),
        attrs: exampleNode.attributes,
        files
      }));

      stopFileParsing();
      stopExampleParsing();
    }

    if (nodeName === FILE_TAG && exampleNode && fileNode) {
      const content = getTagContent(fileContentStartPosition, parser.position, TAG_START_REGEXP);

      if (content == null) {
        stopFileParsing();
        return;
      }

      files.push(new ExampleFile({
        type: fileNode.attributes.type || 'js',
        content: stripIndent(content),
        attrs: fileNode.attributes
      }));

      stopFileParsing();
    }
  };

  parser.write(wrappedContent).close();
  return examples;
};
