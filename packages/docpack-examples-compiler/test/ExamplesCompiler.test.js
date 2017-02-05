var path = require('path');
var resolve = path.resolve;
var sinon = require('sinon');
var format = require('util').format;

var ExamplesCompiler = require('../lib/ExamplesCompiler');
var tools = require('webpack-toolkit');
var createCompilation = tools.createCompilation;
var loader = require('../lib/loader');
var ExampleFile = require('docpack/lib/data/ExampleFile');
var TextExtractPlugin = require('extract-text-webpack-plugin');
var getHash = require('loader-utils').getHashDigest;
var Docpack = require('docpack');
var DocpackPlugin = require('docpack/lib/utils/DocpackPlugin');

var sharedDataLoaderPath = require.resolve('../lib/loader');
var fixturesPath = resolve(__dirname, 'fixtures');
var entryPath = resolve(fixturesPath, './dummy.js');

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
      compiler._compiler.options.output.filename.should.be.equal('[name].js');
    });

    it('should apply parent compiler plugins to examples compiler & skip Docpack plugins', () => {
      var plugin = {apply: function() {}};
      var docpack = Docpack();
      var docpackPlugin = Docpack.createPlugin({apply: function() {}})();

      var compilation = createCompilation({
        plugins: [plugin, docpack, docpackPlugin]
      });

      var compiler = ExamplesCompiler(compilation, {applyParentCompilerPlugins: false});
      sinon.spy(compiler._compiler, 'apply');

      compiler.applyParentCompilerPlugins();
      compiler._compiler.apply.should.have.been.calledOnce.and.calledWith(plugin);
      compiler._compiler.apply.restore();
    });
  });

  describe('#getLoadersToProcessExampleFile()', () => {
    var test = function (file, loadersConfig, filename) {
      var f = new ExampleFile({type: file.type, content: file.content || '', attrs: file.attrs});
      return ExamplesCompiler.getLoadersToProcessExampleFile(
        f,
        filename || ExamplesCompiler.defaultConfig.filename,
        loadersConfig || {loaders: []}
      )
    };

    it('should allow to override example filename via attrs.filename', () => {
      var r = test(
        {type: 'qwe', attrs: {filename: 'custom.css'}},
        {loaders: [{test: /custom\.css$/, loader: 'css'}]}
      ).should.be.eql([{test: /custom\.css$/, loader: 'css'}]);
    });

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
        {
          loaders: [{
            test: /\.scss$/,
            loader: TextExtractPlugin.extract('css-loader!scss-loader')
          }
          ]
        }
      );

      var stringified = tools.stringifyLoaderConfig(textExtractPluginCase[0]);

      stringified
        .should.contain('node_modules/extract-text-webpack-plugin')
        .and.contain('css-loader!scss-loader');
    });
  });

  describe('addFile()', () => {
    var compilation;
    var file;
    var getLoaders;
    var getFilename;
    var addEntry;

    beforeEach(() => {
      compilation = createCompilation({context: fixturesPath, entry: './dummy'});
      file = new ExampleFile({type: 'js', content: 'console.log(456);'});
      getLoaders = sinon.spy(ExamplesCompiler.prototype, 'getLoadersToProcessExampleFile');
      getFilename = sinon.spy(ExamplesCompiler.prototype, 'getOutputFilename');
      addEntry = sinon.spy(ExamplesCompiler.prototype, 'addEntry');
    });

    afterEach(() => {
      ExamplesCompiler.prototype.getLoadersToProcessExampleFile.restore();
      ExamplesCompiler.prototype.getOutputFilename.restore();
      ExamplesCompiler.prototype.addEntry.restore();
    });

    it('should add file to storage and create entry point', () => {
      var compiler = new ExamplesCompiler(compilation, {outputFilename: 'example'});
      var fullRequest = format(
        '!!%s?%s!%s',
        sharedDataLoaderPath,
        JSON.stringify({path: '0.content', hash: getHash(file.content)}),
        entryPath
      );

      compiler.addFile(file, entryPath);

      compiler.files[0].should.be.equal(file);

      getLoaders.should.have.been.calledOnce
        .and.calledWith(file)
        .and.returned([]);

      getFilename.should.have.been.calledOnce
        .and.calledWith(file, entryPath)
        .and.returned('example');

      addEntry.should.have.been.calledOnce
        .and.calledWith(fullRequest, 'example', compiler._compiler.context);
    });
  });

  describe('getOutputFilename()', () => {
    var test = function (file, resourcePath, outputFilename) {
      var compiler = ExamplesCompiler(createCompilation(), {
        outputFilename: outputFilename || ExamplesCompiler.defaultConfig.outputFilename
      });

      var f = new ExampleFile({type: file.type, content: file.content || ''});

      return compiler.getOutputFilename(f, resourcePath);
    };

    it('should fix case when content of the file is empty string', () => {
      test({type: 'js', content: ''}, resolve('./qwe'), '[hash]')
        .should.be.equal(`${getHash(' ')}`);
    });
  });

  describe('run()', () => {
    it('should compile simple js', (done) => {
      var compilation = createCompilation({context: fixturesPath, entry: './dummy'});
      var compiler = new ExamplesCompiler(compilation, {outputFilename: 'example'});

      var file = new ExampleFile({type: 'js', content: 'console.log(456)'});
      compiler.addFile(file, entryPath);

      compiler.run()
        .then(compilation => {
          compilation.assets['example.js'].source().should.contain('console.log(456)');
          done();
        })
        .catch(done);
    });

    it('should work with CSS & TextExtractPlugin', (done) => {
      var compilation = createCompilation({
        context: fixturesPath,
        entry: './dummy',
        module: {
          rules: [{
            test: /\.css$/,
            loader: TextExtractPlugin.extract({use: 'css-loader'})
          }]
        },
        plugins: [new TextExtractPlugin({filename: '[name].css'})]
      });
      var compiler = new ExamplesCompiler(compilation, {outputFilename: 'example'});

      var file = new ExampleFile({type: 'css', content: '.red {color: red}'});
      compiler.addFile(file, entryPath);

      compiler.run()
        .then(compilation => {
          var assets = compilation.assets;
          Object.keys(assets).should.be.eql(['example.js', 'example.css']);
          assets['example.css'].source().should.be.equal('.red {color: red}');
          done();
        })
        .catch(done);
    });
  });
});
