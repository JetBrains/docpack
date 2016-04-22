require('chai').should();
var extend = require('extend');

var loader = require('../../lib/configuration/loader');
var configureLoaderPath = loader.LOADER_PATH;
var MemoryCompiler = require('../../lib/compiler/InMemoryCompiler');

function createCompiler(options) {
  var opts = extend(true, {
    context: '/',
    output: {
      filename: '[name]',
      path: '/build'
    },
    module: {
      loaders: [
        {
          test: /\.(js|svg|source-with-prefix-loader)$/,
          loader: configureLoaderPath
        },
        {
          // second loader for this file type
          test: /\.source-with-prefix-loader$/,
          loader: require.resolve('./test-utils/prefix-loader') + '?qwe'
        }
      ]
    }
  }, options || {});

  return new MemoryCompiler(opts, true, true);
}


describe('configure loader', function() {

  it('should contain LOADER_PATH property', function() {
      loader.should.have.property('LOADER_PATH');
    });

  it('should skip js files', function(done) {
    var entryContent = 'console.log(123);';

    var compiler = createCompiler({entry: {test: './test'}});
    compiler.inputFileSystem.writeFileSync('/test.js', entryContent, 'utf-8');

    compiler.run().then(function(compilation) {
      compilation.assets.test.source().should.contain(entryContent);
      done();
    })
  });

  it('should skip files with configured loaders', function (done) {
    var entryContent = 'console.log(123);';
    var entryContentWithPrefix = 'qwe' + entryContent;

    var compiler = createCompiler({entry: {test: './test.source-with-prefix-loader'}});
    compiler.inputFileSystem.writeFileSync('/test.source-with-prefix-loader', entryContent, 'utf-8');

    compiler.run().then(function (compilation) {
      compilation.assets.test.source().should.contain(entryContentWithPrefix);
      done();
    })
  });

  it('should not return any result for files without configured loaders', function (done) {
    var entryContent = '<svg></svg>';

    var compiler = createCompiler({entry: {test: './test.svg'}});
    compiler.inputFileSystem.writeFileSync('/test.svg', entryContent, 'utf-8');

    compiler.run().then(function(compilation) {
      compilation.assets.test.source().should.not.contain(entryContent);
      done();
    })
  });

});