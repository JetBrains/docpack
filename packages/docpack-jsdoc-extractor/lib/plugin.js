var docpack = require('docpack');
var extractor = require('./extractor');
var Promise = require('bluebird');
var _readFile = require('webpack-toolkit/lib/readFile');

module.exports = docpack.createPlugin('jsdoc-extractor', function(compiler) {
  compiler.plugin('compilation', function(compilation) {
    compilation.plugin(docpack.HOOKS.EXTRACT, function(sources, done) {
      var promises = Promise.map(sources, function(source) {

        var context = {
          fs: compilation.compiler.inputFileSystem,
          compilation: compilation,
          module: compilation.modules.filter(function (module) {
            return module.resource == source.absolutePath
          })[0],
          addDependency: function (filepath) {
            this.module.fileDependencies.push(filepath);
          },
          readFile: function (filepath) {
            return _readFile(this.fs, filepath);
          }
        };

        return extractor.call(context, source);
      });

      Promise.all(promises).then(function(s) {
        done(null, s);
      });

    });
  });
});