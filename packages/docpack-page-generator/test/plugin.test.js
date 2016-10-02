var path = require('path');
var sinon = require('sinon');
var merge = require('merge-options');
var tools = require('webpack-toolkit');
var Plugin = require('../lib/plugin');
var Docpack = require('docpack');
var Source = require('docpack/lib/data/Source');
var Page = require('docpack/lib/data/Page');

describe('Docpack Page Generator Plugin', () => {
  describe('statics', () => {
    it('should export statics', () => {
      Plugin.should.have.property('defaultConfig').and.be.an('object');
      Plugin.should.have.property('getCompilerNameFor').and.be.a('function');
    });
  });

  describe('constructor()', () => {
    it('should throw when wrong arguments', () => {
      (() => Plugin()).should.throw();
    });

    it('should properly set config', () => {
      var expected = merge(Plugin.defaultConfig, {template: 'qwe'});
      Plugin({template: 'qwe'}).config.should.eql(expected);
    });
  });

  describe('configure()', () => {
    it('should not extend webpack config if template can be compiled with existing loaders', () => {
      // resolve extensions
      var plugin = Plugin({template: 'template.foo'});
      var compiler = new tools.createCompiler({
        resolve: {extensions: ['.foo']}
      });

      plugin.configure(compiler);
      compiler.options.module.loaders.should.be.empty;

      // matched loaders
      plugin = Plugin({template: 'template.zzz'});
      compiler = new tools.createCompiler({
        module: {loaders: [
          {test: /\.zzz$/, loader: 'zzz-loader'}
        ]}
      });
      plugin.configure(compiler);
      compiler.options.module.loaders.should.be.eql([
        {test: /\.zzz$/, loader: 'zzz-loader'}
      ]);
    });

    it('should create `loaders` field of webpack config section if it\'s empty', () => {
      var plugin = Plugin({template: 'qwe'});
      var compiler = new tools.createCompiler();

      compiler.options.module.should.not.have.property('loaders');
      plugin.configure(compiler);
      compiler.options.module.loaders.should.be.an('array').and.be.empty;
    });

    it('should use `loader` option if presented', () => {
      var plugin = Plugin({
        template: 'qwe',
        loader: {
          test: /zzz$/,
          loader: 'zzz-loader'
        }
      });
      var compiler = new tools.createCompiler();

      plugin.configure(compiler);
      compiler.options.module.loaders[0].should.be.eql({
        test: /zzz$/,
        loader: 'zzz-loader'
      });
    });

    it('should use fallback loader if no processing template loaders found', () => {
      var plugin = Plugin({template: './template.zzz'});
      var compiler = new tools.createCompiler();
      plugin.configure(compiler);

      compiler.options.module.loaders[0].should.be.eql({
        test: /\.zzz$/,
        loader: require.resolve(Plugin.CONST.FALLBACK_LOADER_NAME)
      });
    });
  });

  describe('select()', () => {
    var plugin;
    var compilation;
    var sources;

    before(() => {
      sources = [
        new Source({path: '1', absolutePath: '1', content: ''}),
        new Source({path: '2', absolutePath: '2', content: ''})
      ];
    });

    beforeEach(() => {
      plugin = Plugin({template: 'qwe'});
      compilation = tools.createCompilation();
    });

    it('should allow use function as `match` option value', () => {
      var match = sinon.spy(function(sources) {
        return sources.filter(source => source.path == '2');
      });

      plugin.config.match = match;

      plugin.select(sources)
        .should.be.an('array')
        .and.have.lengthOf(1)
        .and.eql([sources[1]]);

      match.firstCall.args[0].should.equal(sources);
    });

    it('should throw if non-array returned from `match` function', () => {
      plugin.config.match = (sources => sources[0]);
      (() => plugin.select(compilation, sources)).should.throw();
    });

    it('should allow use regexp as `match` option value', () => {
      plugin.config.match = /2/;
      var result = plugin.select(sources);
      result.should.be.an('array');
      result[0].should.be.equal(sources[1]);
    });
  });

  describe('generateURL()', () => {
    var plugin;
    var compilation;
    var source;

    before(() => {
      source = new Source({
        attrs: {foo: 'bar'},
        path: 'source.js',
        absolutePath: path.resolve('source.js'),
        content: ''
      });
    });

    beforeEach(() => {
      plugin = Plugin({template: 'qwe'});
      compilation = tools.createCompilation();
    });

    it('should allow use string as `filename` option', () => {
      plugin.config.filename = '[name].[ext].html';
      plugin.generateURL(source).should.be.equal('source.js.html');
    });

    it('should allow use function as `filename` option (with placeholders)', () => {
      var filename = sinon.spy(function(source) {
        return `[name].[ext].${source.attrs.foo}.html`;
      });
      plugin.config.filename = filename;

      plugin.generateURL(source).should.equal('source.js.bar.html');
      filename.firstCall.args[0].should.equal(source);
    });

    it('should throw if non-string returned', () => {
      plugin.config.filename = function() { return 123 };
      (() => plugin.generateURL(source)).should.throw();
    });

    it('should allow to override filename from `url` source attr', () => {
      source.attrs.url = 'foo.html';
      plugin.generateURL(source).should.be.equal('foo.html');
    });
  });

  describe('render()', () => {
    var plugin;
    var source;
    var sources;

    before(() => {
      sources = [
        new Source({path: '1', absolutePath: '1', content: '1'}),
        new Source({path: '2', absolutePath: '2', content: '2'})
      ];
      source = sources[1];
    });

    beforeEach(() => {
      plugin = Plugin({template: 'qwe'});
      plugin.renderer = sinon.spy();
    });

    it('should use default context', () => {
      plugin.render(tools.createCompilation(), source, sources);

      plugin.renderer.should.be.calledWithExactly({
        source: source,
        sources: sources,
        publicPath: undefined,
        assetsByChunkName: {}
      });
    });

    it('should use `publicPath` from compilation by default', () => {
      var compilation = tools.createCompilation({output: {publicPath: '/qwe'}});
      plugin.render(compilation, source, sources);
      plugin.renderer.firstCall.args[0].publicPath.should.be.equal('/qwe');
    });

    it('should allow to override `publicPath` via config', () => {
      plugin.config.context.publicPath = '/def';
      var compilation = tools.createCompilation({output: {publicPath: '/abc'}});
      plugin.render(compilation, source, sources);
      plugin.renderer.firstCall.args[0].publicPath.should.be.equal('/def');
    });

    it('should allow to pass user data object to template', () => {
      plugin.config.context = {foo: 'bar'};
      plugin.render(tools.createCompilation(), source, sources);
      plugin.renderer.firstCall.args[0].should.have.property('foo').and.be.equal('bar');
    });

    it('should allow to use function to construct user data object and throw if non-object returned', () => {
      var compilation = tools.createCompilation();
      plugin.config.context = (sources) => {
        return {foo: sources[1].content}
      };
      plugin.render(compilation, source, sources);
      plugin.renderer.firstCall.args[0].should.have.property('foo').and.be.equal('2');

      plugin.renderer.reset();
      plugin.config.context = (sources => []);
      (() => plugin.render(compilation, source, sources)).should.throw();
    });
  });

  describe('generate()', () => {
    var plugin;
    var sources;

    before(() => {
      plugin = Plugin({
        template: 'qwe',
        filename: '[name].html'
      });
      plugin.renderer = function(context) {
        return 'qwe';
      };
    });

    beforeEach(() => {
      sources = [
        new Source({path: '1.js', absolutePath: path.resolve('1.js'), content: '1'}),
        new Source({path: '2.js', absolutePath: path.resolve('2.js'), content: '2', attrs: {url: '3.html'}})
      ];
    });

    it('should create Page instance in Source and emit assets', () => {
      var compilation = tools.createCompilation();
      plugin.generate(compilation, sources);

      sources.forEach(source => {
        source.should.have.property('page').and.be.instanceOf(Page);
      });

      Object.keys(compilation.assets).should.be.eql(['1.html', '3.html']);
    });

    it('should throw if asset with the same name already exists', () => {
      sources[1].attrs.url = '1.html';

      var compilation = tools.createCompilation();
      (() => plugin.generate(compilation, sources)).should.throw();
      Object.keys(compilation.assets).should.be.eql(['1.html']);
    });
  });
});