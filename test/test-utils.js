var fs = require('fs');
var path = require('path');
var webpack = require('webpack');
var MemoryFS = require('memory-fs');

exports.loadFixture = function(filepath) {
  return fs.readFileSync(path.resolve(__dirname, 'fixtures', filepath), 'utf-8');
};

exports.compileInMemory = function(config, callback) {
  var compiler = webpack(config);

  compiler.outputFileSystem = new MemoryFS();

  compiler.run(function (error, stats) {
    if (error || stats.hasErrors())
      throw error;

    var compilation = stats.compilation;
    callback(compilation.assets, compilation);
  });
};