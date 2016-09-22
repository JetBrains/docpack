var docpack = require('docpack');
var createContext = require('docpack/lib/utils/createExtractorContext');
var extractor = require('./extractor');
var findModule = require('webpack-toolkit').getModuleByFilepath;
var Promise = require('bluebird');

module.exports = docpack.createPlugin('jsdoc-extractor', function(compiler) {
  compiler.plugin('compilation', function(compilation) {
    compilation.plugin(docpack.HOOKS.EXTRACT, function(sources, done) {

      var promises = Promise.map(sources, function (source) {
        var module = findModule(compilation, source.absolutePath);
        var context = createContext(compiler.inputFileSystem, module);
        return extractor.call(context, source);
      });

      Promise.all(promises).then(function(sources) {
        done(null, sources);
      });
    });
  });
});