var docpack = require('docpack');
var extractor = require('./extractor');

module.exports = docpack.createPlugin('jsdoc-extractor', {
  apply: function(compiler) {
    var extractorPlugin = this;

    compiler.plugin(docpack.HOOKS.INIT, function(docpack) {
      docpack.registerExtractor(extractorPlugin);
    });
  },

  extract: extractor
});