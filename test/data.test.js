require('chai').should();
var expect = require('chai').expect;

describe('Data sources', function () {

  describe('Source', function () {
    var Source = require('../lib/data/Source');
    var defaults = {
      path: 'file.js',
      absolutePath: '/src/file.js',
      content: ''
    };

    it('should throws when required attributes not provided', function() {
      expect(function() { new Source() }).to.throws();
      expect(function() { new Source({}) }).to.throws();
      expect(function() { new Source({path: ''}) }).to.throws();
      expect(function() { new Source({path: '', absolutePath: ''}) }).to.throws();
      expect(function() { new Source(defaults) }).to.not.throws();
    });

    it('should properly set default values for optional fields', function() {
      var source = new Source(defaults);

      source.path.should.be.a('string');
      source.absolutePath.should.be.a('string');
      source.content.should.be.a('string');
      source.attrs.should.be.an('object').and.be.empty;
      source.blocks.should.be.an('array').and.be.empty;
    });
  });

  describe('CodeBlock', function () {
    var CodeBlock = require('../lib/data/CodeBlock');

    it('should throws when required attributes not provided', function() {
      expect(function() { new CodeBlock() }).to.throws();
      expect(function() { new CodeBlock({}) }).to.throws();
      expect(function() { new CodeBlock({content: ''}) }).to.not.throws();
    });

    it('should properly set default values for optional fields', function() {
      var block = new CodeBlock({content: ''});

      block.content.should.be.a('string');
      expect(block.description).to.be.a('null');
      block.attrs.should.be.an('object').and.be.empty;
      block.examples.should.be.an('array').and.be.empty;
    });
  });

  describe('Example', function () {
    var Example = require('../lib/data/Example');

    it('should throws when required attributes not provided', function() {
      expect(function() { new Example() }).to.throws();
      expect(function() { new Example({}) }).to.throws();
      expect(function() { new Example({content: ''}) }).to.not.throws();
    });

    it('should properly set default values for optional fields', function() {
      var example = new Example({content: ''});

      example.content.should.be.a('string');
      example.attrs.should.be.an('object').and.be.empty;
      example.files.should.be.an('array').and.be.empty;
    });
  });

  describe('ExampleFile', function () {
    var ExampleFile = require('../lib/data/ExampleFile');

    it('should throws when required attributes not provided', function() {
      expect(function() { new ExampleFile() }).to.throws();
      expect(function() { new ExampleFile({}) }).to.throws();
      expect(function() { new ExampleFile({type: 'js'}) }).to.throws();
      expect(function() { new ExampleFile({content: ''}) }).to.throws();
      expect(function() { new ExampleFile({type: 'js', content: ''}) }).to.not.throws();
    });

    it('should properly set default values for optional fields', function() {
      var file = new ExampleFile({type: 'js', content: ''});

      file.type.should.be.a('string');
      file.content.should.be.a('string');
      file.attrs.should.be.an('object').and.be.empty;
      file.assets.should.be.an('array').and.be.empty;
    });
  });

  describe('Asset', function () {
    var Asset = require('../lib/data/Asset');

    it('should throws when required attributes not provided', function() {
      expect(function() { new Asset() }).to.throws();
      expect(function() { new Asset({}) }).to.throws();
      expect(function() { new Asset({type: 'js'}) }).to.throws();
      expect(function() { new Asset({content: ''}) }).to.throws();
      expect(function() { new Asset({type: 'js', content: ''}) }).to.not.throws();
    });

    it('should properly set default values for optional fields', function() {
      var asset = new Asset({type: 'js', content: ''});

      asset.type.should.be.a('string');
      asset.content.should.be.a('string');
      expect(asset.path).to.be.a('null');
    });
  });

  describe('Page', function () {
    var Page = require('../lib/data/Page');

    it('should throws when required attributes not provided', function() {
      expect(function() { new Page() }).to.throws();
      expect(function() { new Page({}) }).to.throws();
      expect(function() { new Page({url: ''}) }).to.not.throws();
    });

    it('should properly set default values for optional fields', function() {
      var page = new Page({url: ''});

      page.url.should.be.a('string');
      expect(page.content).to.be.a('null');
    });
  });

});