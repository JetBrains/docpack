var path = require('path');
var docpack = require('docpack');
var ExamplesCompiler = require('./ExamplesCompiler');
var tools = require('webpack-toolkit');
var Asset = require('docpack/lib/data/Asset');

var defaultConfig = {
  match: null,
  filter: null,

  /**
   * Used for loaders matching, can be overridden via ExampleFile attrs.filename
   */
  filename: 'example.[type]',

  /**
   * Used for naming emitted files.
   * Extension will be appended automatically (technically - the name of entry point).
   */
  outputFilename: 'examples/[hash]'
};

var ExamplesCompilerPlugin = docpack.createPlugin({
  name: 'docpack-examples-compiler',
  defaultConfig: defaultConfig,
  apply: function(compiler) {
    var config = this.config;

    compiler.plugin('compilation', function(compilation) {
      compilation.plugin(docpack.HOOKS.AFTER_EXTRACT, function(sources, done) {
        var compiler = new ExamplesCompiler(compilation, {
          filename: config.filename,
          outputFilename: config.outputFilename
        });

        var hasFilter = typeof config.filter == 'function';

        var targets = config.match === null
          ? sources
          : sources.filter(function(source) {
              return tools.matcher(config.match, source.absolutePath);
            });

        var filesByPaths = getExampleFilesByPath(targets);

        for (var sourcePath in filesByPaths) {
          filesByPaths[sourcePath].forEach(function(file) {
            if (hasFilter && !config.filter(file)) {
              return;
            }

            file.chunkName = compiler.getOutputFilename(file, sourcePath);
            compiler.addFile(file, sourcePath);
          });
        }

        compiler.run()
          .then(function(compilation) {
            var files = compiler.files;
            var assetsByChunk = tools.getAssetsByChunkName(compilation);

            files.forEach(function(file) {
              if (file.chunkName in assetsByChunk == false) {
                return;
              }

              assetsByChunk[file.chunkName].forEach(function (assetPath) {
                var asset = new Asset({
                  type: path.extname(assetPath).substr(1),
                  content: compilation.assets[assetPath].source(),
                  path: assetPath
                });

                file.assets.push(asset);
              });

              delete file.chunkName;
            });

            done(null, sources);
          })
          .catch(done);
      });
    })
  }
});

module.exports = ExamplesCompilerPlugin;

// TODO refactor this shit
function getExampleFilesByPath(sources) {
  var filesByPath = {};

  sources.forEach(function (source) {
    filesByPath[source.absolutePath] = [];

    source.blocks.forEach(function (block) {
      block.examples.forEach(function (example) {
        filesByPath[source.absolutePath] = filesByPath[source.absolutePath].concat(example.files);
      });
    });
  });

  return filesByPath;
}