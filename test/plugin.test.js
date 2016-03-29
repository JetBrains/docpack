var expect = require('chai').expect;
var path = require('path');
var clone = require('clone');
var extend = require('object-assign');
var Plugin = require('../lib/plugin');

var compileInMemory = require('./test-utils').compileInMemory;
var baseConfig = require('./fixtures/plugin/webpack.config');

function compile(config, callback) {
  var cloned = clone(baseConfig);
  var cfg = extend(cloned, config || {});
  compileInMemory(cfg, callback);
}

describe('Plugin', function() {

  describe('#constructor()', function() {

    it('should use default config when called without params', function() {
      var plugin = new Plugin();

      expect(plugin.config).to.eql(Plugin.defaultConfig);
    });

    it('should merge default config with external', function() {
      var plugin = new Plugin({
        templateEngine: 'nunjucks'
      });

      expect(plugin.config.templateEngine).to.eql('nunjucks');
    });
  });

  describe('::extract()', function() {

    it('should exists', function() {
      expect(Plugin.extract).to.be.a('function');
    });

    it('should return path to loader', function() {
      var result = Plugin.extract();

      expect(result).to.eql(Plugin.docsLoaderPath);
    });

    it('should return path with query params when options are presented', function() {
      var extractorPath = path.resolve(__dirname, 'extractor.js');
      var result = Plugin.extract({extractor: extractorPath});
      var expected = Plugin.docsLoaderPath + '?' + JSON.stringify({extractor: extractorPath});

      expect(result).to.eql(expected);
    });
  });

  describe('apply()', function() {

    it('should exists', function() {
      expect(new Plugin().apply).to.be.a('function');
    });

    it('should ', function(done) {
      compile({}, function(assets) {
        done();
      })
    });

  });

});