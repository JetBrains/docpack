var HOOKS = require('../hooks');

function SourceLastModifiedPlugin() {

}

SourceLastModifiedPlugin.prototype.apply = function(compiler) {
  compiler.plugin('compilation', function(compilation) {
    compilation.plugin(HOOKS.SOURCE_CREATED, function (context, done) {
      var fs = context.plugin.compiler.inputFileSystem;

      fs.stat(context.source.absolutePath, function (err, result) {
        context.source.lastModified = result.mtime;
        done();
      });
    })
  })
};

module.exports = SourceLastModifiedPlugin;