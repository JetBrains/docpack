var path = require('path');
var resolve = path.resolve;
var sinon = require('sinon');

var ExamplesCompiler = require('../lib/ExamplesCompiler');
var tools = require('webpack-toolkit');
var createCompilation = tools.createCompilation;
var loader = require('../lib/loader');
var ExampleFile = require('docpack/lib/data/ExampleFile');
var TextExtractPlugin = require('extract-text-webpack-plugin');
var getHash = require('loader-utils').getHashDigest;

describe('ExamplesCompiler', () => {
  it('should export static fields', () => {
    ExamplesCompiler.defaultConfig.should.exist.and.be.an('object');
  });

  describe('constructor()', () => {
    it('should create instance via function call', () => {
      ExamplesCompiler(createCompilation())
        .should.be.instanceOf(ExamplesCompiler)
        .and.instanceOf(tools.ChildCompiler);
    });

    it('should inject shared data in compiler', () => {
      var pluginInCompiler = sinon.spy(loader, 'plugInCompiler');
      var compiler = ExamplesCompiler(createCompilation());

      pluginInCompiler.should.have.been.calledWith(compiler._compiler, compiler.files);
      pluginInCompiler.restore();
    });

    it('should override child compiler output filename', () => {
      var compiler = ExamplesCompiler(createCompilation(), {
        outputFilename: 'qwe',
        output: {filename: 'tralalala'}
      });
      compiler._compiler.options.output.filename.should.be.equal('[name]');
    });
  });

  describe('#getLoadersToProcessExampleFile()', () => {
    var test = function(file, loadersConfig, filename) {
      var f = new ExampleFile({type: file.type, content: file.content || ''});
      return ExamplesCompiler.getLoadersToProcessExampleFile(
        f,
        filename || ExamplesCompiler.defaultConfig.filename,
        loadersConfig || {}
      )
    };

    it('should work with js', () => {
      test(
        {type: 'js'}
      ).should.be.eql([]);
    });

    it('should work with css', () => {
      test(
        {type: 'css'},
        {loaders: [{test: /\.css$/, loader: 'css'}]}
      ).should.be.eql([{test: /\.css$/, loader: 'css'}]);
    });

    it('should properly skip excluded cases', () => {
      test(
        {type: 'css'},
        {loaders: [{test: /\.css$/, loader: 'css', exclude: /example\.css/}]},
        'example.[type]'
      ).should.be.eql([]);
    });

    it('should work with extract-text-webpack-plugin', () => {
      var textExtractPluginCase = test(
        {type: 'scss'},
        {loaders: [{
          test: /\.scss$/,
          loader: TextExtractPlugin.extract('css!scss')}
        ]}
      );

      textExtractPluginCase.should.be.lengthOf(1);
      textExtractPluginCase[0].loader
        .should.contain('node_modules/extract-text-webpack-plugin')
        .and.contain('css!scss');
    });
  });

  describe('addFile()', () => {
    var fixturesPath = resolve(__dirname, 'fixtures');
    var compilation = createCompilation({context: fixturesPath, entry: './dummy'});

    it('should work', (done) => {
      new tools.InMemoryCompiler({
        context: fixturesPath,
        entry: './dummy',
        output: {
          filename: '[name].js'
        }
      })
        .setInputFS(tools.createCachedInputFileSystem())
        .run()
        .then(function(parentCompilation) {
          var compiler = new ExamplesCompiler(parentCompilation);
          var file = new ExampleFile({type: 'js', content: 'console.log(456);'});
          var file2 = new ExampleFile({type: 'js', content: 'console.log(789);'});

          var info1 = compiler.addFile(file, resolve(fixturesPath, './dummy'));
          var info2 = compiler.addFile(file2, resolve(fixturesPath, './dummy'));

          return compiler.run()
            .then(function (compilation) {
              var i1 = info1;
              var i2 = info2;
              var chunks = tools.getAssetsByChunkName(compilation);
              debugger;
              done();
            });
        })
        .catch(done);
    });
  });

  describe('getOutputFilename()', () => {
    var test = function(file, resourcePath, outputFilename) {
      var compiler = ExamplesCompiler(createCompilation(), {
        outputFilename: outputFilename || ExamplesCompiler.defaultConfig.outputFilename
      });

      var f = new ExampleFile({type: file.type, content: file.content || ''});

      return compiler.getOutputFilename(f, resourcePath);
    };

    it('should fix case when content of the file is empty string', () => {
      test({type: 'js', content: ''}, resolve('./qwe'))
        .should.be.equal(`${getHash(' ')}`);
    });

    it('should properly replace [type] placeholder', () => {
      test({type: 'css', content: ''}, resolve('./qwe'), '[name].[type]')
        .should.be.equal('qwe.css');
    });
  });
});