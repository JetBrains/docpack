var loaderUtils = require('loader-utils');

module.exports = function (source) {
  var query = loaderUtils.parseQuery(this.query);
  var data = this.extractExamplesLoader;
  var recordIndex = parseInt(query.record);
  var exampleIndex = parseInt(query.example);
  var itemIndex = parseInt(query.item);
  var content = data.content[recordIndex].examples[exampleIndex].items[itemIndex].source;
  return content;
};