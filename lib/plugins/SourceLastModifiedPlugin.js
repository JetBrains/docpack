var Plugin = require('./Plugin');
var HOOKS = require('../hooks');

/**
 * @constructor
 */
var SourceLastModifiedPlugin = Plugin.create();

SourceLastModifiedPlugin.prototype.apply = function (compiler) {
  compiler.plugin('compilation', function (compilation) {
    compilation.plugin(HOOKS.SOURCE_CREATED, function (source, done) {
      var fs = compiler.inputFileSystem;

      fs.stat(source.absolutePath, function (err, result) {
        source.lastModified = result.mtime;
        done(null, source);
      });
    })
  })
};

module.exports = SourceLastModifiedPlugin;