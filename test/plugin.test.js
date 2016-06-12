var chai = require('chai');
var expect = chai.expect;
chai.should();

var Plugin = require('../lib/plugin');
var HOOKS = require('../lib/hooks');
var configureLoaderPath = require('../lib/configurator/loader').LOADER_PATH;
var InMemoryCompiler = require('../lib/modules/MemoryCompiler');
var mergeConfig = require('webpack-config-merger');
var Source = require('../lib/data/Source');

function inMemoryCompiler(config) {
  var defaultConfig = {
    context: '/',

    output: {
      filename: '[name].js',
      path: '/build'
    }
  };

  var compiler = new InMemoryCompiler(
    mergeConfig(defaultConfig, config || {}),
    true,
    true
  );

  return compiler;
}

describe('Plugin', function () {

  describe('static props', function () {
    Plugin.should.have.property('HOOKS').and.be.a('object').and.eql(HOOKS);
  });


  describe('::extract()', function () {

    it('should exist', function () {
      Plugin.extract.should.exist.and.be.a('function');
    });

    it('should return path to configure loader', function () {
      Plugin.extract().should.contain(configureLoaderPath);
    });

    it('should return path with query params when options are presented', function () {
      var params = {qwe: 123};
      Plugin.extract({qwe: 123}).should.contain(JSON.stringify(params));
    });

  });


  describe('constructor', function () {

    it('should set initial config', function () {
      var plugin = new Plugin();
      plugin.should.have.property('config').and.be.an('object');
      plugin.should.have.property('extractors').and.be.an('object');
      plugin.config.should.have.property('loaders').and.be.an('array');
    });

  });


  describe('getConfig()', function () {

    it('should exist', function () {
      new Plugin().getConfig.should.exist;
    });

    it('should return initial config if no argument specified', function () {
      var plugin = new Plugin();
      plugin.getConfig().should.eql(plugin.config.initial);
    });

    describe('when plugin instantiated', function () {
      var plugin;
      var compiler;

      beforeEach(function () {
        plugin = new Plugin();
        compiler = inMemoryCompiler({
          module: {
            loaders: [
              {test: /\.qwe$/, loader: Plugin.extract({foo: 'bar'})}
            ]
          },
          plugins: [plugin]
        });
      });

      it('should return config provided in loaders', function (done) {
        compiler.run().then(function () {
          var config = plugin.getConfig('/tralala/test.qwe');
          config.should.have.property('foo');
          config.foo.should.be.eql('bar');
          done();
        });
      });

      it('should return initial config value if no param specified via loaders found', function (done) {
        compiler.run().then(function () {
          var config = plugin.getConfig('/tralala');
          config.should.be.eql(plugin.config.initial);
          done();
        });
      });

    });

  });


  describe('registerExtractor()', function () {

    it('should throw if invalid extractor structure provided', function() {
      var extractor = {
        apply: function (compiler) {
          var extractor = this;

          compiler.plugin(HOOKS.CONFIGURE, function (plugin) {
            plugin.registerExtractor(extractor);
          })
        }
      };

      expect(function() {
        inMemoryCompiler({plugins: [ new Plugin(), extractor ]})
      }).to.throw();
    });

    it('should register extractor and throw when it already registered', function (done) {
      var extractorName = 'tralala';
      var extractor = {
        getName: function () { return extractorName },
        extract: function () {},
        apply: function (compiler) {
          var extractor = this;

          compiler.plugin(HOOKS.CONFIGURE, function (plugin) {
            plugin.registerExtractor(extractor);
          })
        }
      };

      var plugin = new Plugin();

      inMemoryCompiler({plugins: [plugin, extractor]}).run().then(function () {
        plugin.extractors.should.have.property(extractorName).and.be.eql(extractor);

        expect(function() {
          plugin.registerExtractor({
            getName: function() { return 'tralala' },
            extract: function() {}
          });

        }).to.throw();

        done();
      });

    });

  });


  describe('save()', function () {

    it('should save source', function() {
      var source = new Source({path: '/qwe', absolutePath: '/qwe', content: 'qwe'});
      var plugin = new Plugin();

      plugin.save(source);
      plugin.sources.should.include(source).and.to.have.lengthOf(1);

      plugin.save(source);
      plugin.sources.should.include(source).and.to.have.lengthOf(1);
    })

  });


  describe('readFile()', function () {

    it('should use the same filesystem as compiler', function() {
      var file = {
        path: '/test.txt',
        content: 'qwe'
      };

      var plugin = new Plugin();
      var compiler = inMemoryCompiler({plugins: [plugin]});

      compiler.inputFileSystem.writeFileSync(file.path, file.content, 'utf-8');
      plugin.readFile(file.path).then(function(content) {
        content.toString().should.eql(file.content);
      });
    })

  });

});