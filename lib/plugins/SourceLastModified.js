var HOOKS = require('../hooks');

function SourceLastModifiedPlugin() {

}

SourceLastModifiedPlugin.prototype.apply = function(compiler) {
  compiler.plugin('compilation', function(compilation) {
    compilation.plugin(HOOKS.SOURCE_CREATED, function (data, done) {
      var fs = data.plugin._compiler.inputFileSystem;

      fs.stat(data.source.absolutePath, function (err, result) {
        data.source.lastModified = result.mtime;
        done();
      });
    })
  })
};

module.exports = SourceLastModifiedPlugin;