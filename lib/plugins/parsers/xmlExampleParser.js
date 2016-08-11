var path = require('path');
var sax = require('sax');
var stripIndent = require('strip-indent');

var Example = require('../../data/Example');
var ExampleFile = require('../../data/ExampleFile');

var FILE_TAG = 'file';
var EXAMPLE_TAG = 'example';
var PARSER_STRICT_MODE = false;
var PARSER_OPTIONS = {lowercase: true};

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

  var examples = [];
  var currentExample = null;
  var currentFile = null;
  var fileContentStartPosition = null;
  
  var parser = sax.parser(PARSER_STRICT_MODE, PARSER_OPTIONS);
    
  function stopFileParsing() {
    currentFile = null;
    fileContentStartPosition = null;
  }
  
  parser.onopentag = function (node) {
    if (node.name === EXAMPLE_TAG) {
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
    if (nodeName === EXAMPLE_TAG) {
      currentExample = null;
      stopFileParsing();
    }
    

    if (nodeName === FILE_TAG && currentExample && currentFile) {
      var fileContentEndPosition = parser.startTagPosition - 1;
      var fileContent = content.substring(fileContentStartPosition, fileContentEndPosition);
      
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

  parser.write(content).close();

  return examples;
};