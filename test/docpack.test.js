var path = require('path');
var sinon = require('sinon');

var Docpack = require('../lib/docpack');
var DocpackPlugin = require('../lib/utils/DocpackPlugin');
var HOOKS = require('../lib/hooks');

var InMemoryCompiler = require('webpack-toolkit/lib/InMemoryCompiler');
var MemoryFS = require('memory-fs');

function noop() {}

describe('Docpack', () => {
  describe('static props', () => {
    Docpack.should.have.property('API_VERSION').and.be.a('string');
    Docpack.should.have.property('HOOKS').and.be.eql(HOOKS);
    Docpack.should.have.property('defaultConfig').and.be.an('object');
  });

  describe('static methods', () => {
    describe('createPlugin()', () => {
      it('exist', () => {
        Docpack.createPlugin.should.exist.and.be.a('function');
      });
    });
  });

  describe('constructor()', () => {
    it('allow to create instance via function call', () => {
      Docpack().should.be.instanceof(Docpack);
    });

    it('properly set initial values', () => {
      Docpack().should.have.property('config').and.be.eql(Docpack.defaultConfig);
      Docpack().should.have.property('plugins').and.be.empty;
      Docpack().should.have.property('sources').and.be.empty;
    });

    it('assign passed config', () => {
      var cfg = {test: /\.jsx$/, exclude: false, foo: 'bar'};
      Docpack(cfg).should.have.property('config').and.be.eql(cfg);
    });
  });
  
  describe('use()', () => {
    it('should throws when wrong plugin type', () => {
      var docpack = Docpack();
      (function() { docpack.use( noop ) }).should.throws(TypeError);
      (function() { docpack.use( noop() ) }).should.throws(TypeError);
      (function() { docpack.use( function(){ return function() {} }() ) }).should.throws(TypeError);
      (function() { docpack.use( DocpackPlugin.create('foo')() ) }).should.not.throws();
    });

    it('should return docpack instance to simplify plugins registration', () => {
      var Plugin = Docpack.createPlugin('foo');
      Docpack().use(Plugin()).should.be.instanceOf(Docpack);
    });

    it('should save plugins in `plugins` field', () => {
      var docpack = Docpack();
      var Plugin1 = Docpack.createPlugin('foo');
      var Plugin2 = Docpack.createPlugin('bar');

      docpack.use(Plugin1()).use(Plugin2());
      docpack.plugins.should.be.lengthOf(2);
      docpack.plugins[0].should.be.instanceOf(Plugin1);
      docpack.plugins[1].should.be.instanceOf(Plugin2);
    });
  });

  describe('apply()', () => {
    it('should apply all plugins registered via `use()`', (done) => {
      var Plugin = Docpack.createPlugin('foo', sinon.spy());
      var plugin = new Plugin();

      var compiler = new InMemoryCompiler({
        plugins: [ Docpack().use(plugin) ]
      });

      return compiler.run().then(compilation => {
        plugin.apply.should.have.been.calledOne;
        done();
      }).catch(done);
    });

    it('should do nothing if no matched sources found', (done) => {
      var data = {};
      data[path.resolve('/', 'entry.js')] = new Buffer('');
      var fs = new MemoryFS(data);

      var plugin = new Docpack.createPlugin('foo', sinon.spy());
      var compiler = InMemoryCompiler({
        context: path.resolve('/'),
        entry: path.resolve('/', 'entry'),
        plugins: [ Docpack().use(plugin()) ]
      }, {inputFS: new MemoryFS(data)});

      compiler.run().then(compilation => {
        debugger;
        done();
      }).catch(done);
    });
  });
});