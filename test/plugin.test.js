require('chai').should();
var expect = require('chai').expect;

var Plugin = require('../lib/plugin');
var HOOKS = require('../lib/hooks');
var configureLoaderPath = require('../lib/configurator/loader').LOADER_PATH;
var InMemoryCompiler = require('../lib/modules/MemoryCompiler');
var mergeConfig = require('webpack-config-merger');

function dummyCompiler(config) {
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

    it('should exists', function () {
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
      plugin.should.have.property('config').and.be.a('object');
      plugin.config.should.have.property('loaders').and.be.a('array');
      plugin.should.have.property('extractors').and.be.a('object');
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
        compiler = dummyCompiler({
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

    it('should throw when extractor already registered', function (done) {
      var fakeExtractor = {
        getName: function () { return 'tralala' },
        extract: function () {},
        apply: function (compiler) {
          var extractor = this;

          compiler.plugin(HOOKS.CONFIGURE, function (plugin) {
            plugin.registerExtractor(extractor);
          })
        }
      };

      var plugin = new Plugin({ plugins: [fakeExtractor] });

      dummyCompiler({plugins: [plugin]}).run().then(function () {
        expect(function() {
          plugin.registerExtractor({
            getName: function() { return 'tralala' },
            extract: function() {}
          });

        }).to.throws(Error);

        done();
      })
    });

  });


});