var path = require('path');
var Plugin = require('../lib/plugin');
var docpack = require('docpack');
var Source = require('docpack/lib/data/Source');
var merge = require('merge-options');
var tools = require('webpack-toolkit');
var sinon = require('sinon');
var InMemoryCompiler = require('webpack-toolkit').InMemoryCompiler;
var MemoryFS = require('memory-fs');

describe('Docpack Page Generator Plugin', () => {
  describe('statics', () => {
    it('should export statics', () => {
      Plugin.should.have.property('defaultConfig');
      Plugin.should.have.property('getCompilerNameFor');
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

  describe('_select()', () => {
    var plugin;
    var compilation;
    var sources;

    beforeEach(() => {
      plugin = Plugin({template: 'qwe'});
      compilation = tools.createCompilation();
      sources = [
        new Source({path: '1', absolutePath: '1', content:''}),
        new Source({path: '2', absolutePath: '2', content:''})
      ];
    });

    it('should allow use function as `match` option value', () => {
      var match = sinon.spy(function(sources) {
        return sources.filter(source => source.path == '2');
      });

      plugin.config.match = match;

      plugin._select(compilation, sources)
        .should.be.an('array')
        .and.have.lengthOf(1)
        .and.eql([sources[1]]);

      match.firstCall.args[0].should.equal(sources);
      match.firstCall.thisValue.should.equal(compilation);
    });

    it('should throw if non-array returned from `match` function', () => {
      plugin.config.match = (sources => sources[0]);
      (() => plugin._select(compilation, sources)).should.throw();
    });

    it('should allow use regexp as `match` option value', () => {
      plugin.config.match = /2/;
      var result = plugin._select(compilation, sources);
      result.should.be.an('array');
      result[0].should.be.equal(sources[1]);
    });
  });

  describe('_generateURL()', () => {
    var plugin;
    var compilation;
    var source;

    beforeEach(() => {
      plugin = Plugin({template: 'qwe'});
      compilation = tools.createCompilation();
      source = new Source({
        attrs: {foo: 'bar'},
        path: 'source.js',
        absolutePath: path.resolve('source.js'),
        content:''
      });
    });

    it('should allow use string as `filename` option', () => {
      plugin.config.filename = '[name].[ext].html';
      plugin._generateURL(compilation, source).should.be.equal('source.js.html');
    });

    it('should allow use function as `filename` option (with placeholders)', () => {
      var filename = sinon.spy(function(source) {
        return `[name].[ext].${source.attrs.foo}.html`;
      });
      plugin.config.filename = filename;

      plugin._generateURL(compilation, source).should.equal('source.js.bar.html');
      filename.firstCall.args[0].should.equal(source);
      filename.firstCall.thisValue.should.equal(compilation);
    });

    it('should throw if non-string returned', () => {
      plugin.config.filename = function() { return 123 };
      (() => plugin._generateURL(compilation, source)).should.throw();
    });

    it('should allow to use `url` attr from source to generate URL', () => {

    });
  });
});