var path = require('path');
var sax = require('sax');
var stripIndent = require('strip-indent');

var Example = require('../../data/Example');
var ExampleFile = require('../../data/ExampleFile');

var FILE_TAG = 'file';
var EXAMPLE_TAG = 'example';
var PARSER_STRICT_MODE = false;
var PARSER_OPTIONS = {lowercase: true};
var TAG_START_REGEXP = /(?:<\s*\/\s*file)(?![\s\S]*<\s*\/\s*file)/;

/**
 * @param {ExampleFile} file
 * @returns {String|null}
 */
function getFileType(file) {
  return file.attrs.name ? path.extname(file.attrs.name).substr(1) : null;
}

/**
 * @param {string} content
 * @returns {Array<Example>|null}
 */
module.exports = function (content) {
  if (content.trim() == '' || content.indexOf('<example') == -1)
    return [];

  // Avoid xml parsing issues
  var wrappedContent = '<root>' + content + '</root>';
  var examples = [];
  var currentExample = null;
  var currentFile = null;
  var fileContentStartPosition = null;
  
  var parser = sax.parser(PARSER_STRICT_MODE, PARSER_OPTIONS);
    
  function stopFileParsing() {
    currentFile = null;
    fileContentStartPosition = null;
  }
  
  function getFileTagStartPosition(currentPosition) {
    var previousContent = wrappedContent.substring(0, currentPosition);
    var match = previousContent.match(TAG_START_REGEXP);
    
    return match && match.index;
  }
  
  parser.onopentag = function (node) {
    if (node.name === EXAMPLE_TAG && !currentExample) {
      currentExample = new Example({
        attrs: node.attributes,
        files: []
      });
      examples.push(currentExample);
    }

    // Don't go deeper than one level
    if (node.name === FILE_TAG && currentExample && !currentFile) {
      currentFile = new ExampleFile({
        attrs: node.attributes
      });
      fileContentStartPosition = parser.position;
    }
  };
  
  parser.onclosetag = function (nodeName) {
    if (nodeName === EXAMPLE_TAG && currentExample) {
      currentExample = null;
      stopFileParsing();
    }

    if (nodeName === FILE_TAG && currentExample && currentFile) {
      var fileContentEndPosition = getFileTagStartPosition(parser.position);
      if (!fileContentEndPosition) {
        stopFileParsing();
        return;
      }
      
      var fileContent = wrappedContent.substring(fileContentStartPosition, fileContentEndPosition);
      if (fileContent.trim() === '') {
        stopFileParsing();
        return;
      } 

      currentFile.type = currentFile.attrs.type || getFileType(currentFile);
      currentFile.source = stripIndent(fileContent);

      currentExample.files.push(currentFile);

      stopFileParsing();
    }
  };

  parser.write(wrappedContent).close();
  return examples;
};