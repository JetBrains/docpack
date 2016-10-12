var path = require('path');
var resolve = path.resolve;
var Docpack = require('docpack');
var ExamplesCompilerPlugin = require('../lib/plugin');
var tools = require('webpack-toolkit');
var TextExtractPlugin = require('extract-text-webpack-plugin');

var Source = require('docpack/lib/data/Source');
var CodeBlock = require('docpack/lib/data/CodeBlock');
var Example = require('docpack/lib/data/Example');
var ExampleFile = require('docpack/lib/data/ExampleFile');
var Asset = require('docpack/lib/data/Asset');

var fixturesPath = resolve(__dirname, 'fixtures');
var entryPath = resolve(fixturesPath, './dummy.js');

var mockSourceWithFiles = function(absPath, files) {
  return new Source({path: absPath, absolutePath: absPath, content: '', blocks: [
    new CodeBlock({content: '', examples: [
      new Example({content: '', files: !Array.isArray(files) ? [files] : files})
    ]})
  ]});
};

var createCompilerWithExampleFiles = function(files) {
  var compiler = tools.InMemoryCompiler({
    context: fixturesPath,
    plugins: [
      Docpack()
        .use(Docpack.HOOKS.EXTRACT, function (sources, done) {
          var source = mockSourceWithFiles(entryPath, files);
          done(null, [source]);
        })
        .use(ExamplesCompilerPlugin())
    ]
  });

  compiler.setInputFS(tools.createCachedInputFileSystem());

  return compiler;

};

describe('docpack-example-compiler', () => {
  it('should work', (done) => {
    var file = new ExampleFile({type: 'js', content: 'console.log(123)'});

    createCompilerWithExampleFiles(file)
      .run()
      .then(compilation => {
        var asset = file.assets[0];

        file.assets.should.be.an('array').that.lengthOf(1);

        asset.should.be.instanceOf(Asset);
        asset.should.have.property('type').that.equal('js');

        compilation.assets.should.have.property(asset.path);

        asset
          .should.have.property('content').that.equal(compilation.assets[asset.path].source())
          .and.that.includes('console.log(123)');

        done();
      })
      .catch(done);
  });
});