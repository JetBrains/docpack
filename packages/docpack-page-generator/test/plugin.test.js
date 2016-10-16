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

  describe('apply()', () => {
    it('should work with js-templates and should not produce any other assets', (done) => {
      var plugin = Plugin({
        template: './template',
        url: 'page.html'
      });

      tools.InMemoryCompiler({
        context: path.resolve(__dirname, 'fixtures'),
        entry: './entry',
        plugins: [Docpack().use(plugin)]
      })
        .setInputFS(tools.createCachedInputFileSystem())
        .run()
        .then(compilation => {
          var assets = compilation.assets;

          assets['page.html'].source().should.be.equal('console.log(123);');

          // should not produce any other assets
          Object.keys(assets).should.be.eql(['main.js', 'page.html']);

          done();
        })
        .catch(done);
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

    it('should allow use regexp as `match` option value', () => {
      plugin.config.match = /2/;
      var result = plugin.select(sources);
      result.should.be.an('array');
      result[0].should.be.equal(sources[1]);
    });

    it('should allow use function as `select` option value', () => {
      var select = sinon.spy(function(sources) {
        return sources.filter(source => source.path == '2');
      });

      plugin.config.select = select;

      plugin.select(sources)
        .should.be.an('array')
        .and.have.lengthOf(1)
        .and.eql([sources[1]]);

      select.firstCall.args[0].should.equal(sources);
    });

    it('should throw if non-array returned from `select` function', () => {
      plugin.config.select = (sources => sources[0]);
      (() => plugin.select(compilation, sources)).should.throw();
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

    it('should allow use string as `url` option', () => {
      plugin.config.url = '[name].[ext].html';
      plugin.generateURL(source).should.be.equal('source.js.html');
    });

    it('should allow use function as `url` option (with placeholders)', () => {
      var url = sinon.spy(function(source) {
        return `[name].[ext].${source.attrs.foo}.html`;
      });
      plugin.config.url = url;

      plugin.generateURL(source).should.equal('source.js.bar.html');
      url.firstCall.args[0].should.equal(source);
    });

    it('should throw if non-string returned', () => {
      plugin.config.url = function() { return 123 };
      (() => plugin.generateURL(source)).should.throw();
    });

    it('should allow to override url from `url` source attr', () => {
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
        url: '[name].html'
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