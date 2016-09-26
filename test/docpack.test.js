var path = require('path');
var sinon = require('sinon');
var shuffleArray = require('shuffle-array');

var InMemoryCompiler = require('webpack-toolkit/lib/InMemoryCompiler');
var MemoryFS = require('memory-fs');

var Docpack = require('../lib/docpack');
var HOOKS = require('../lib/hooks');
var DocpackPlugin = require('../lib/utils/DocpackPlugin');
var createPlugin = DocpackPlugin.create;
var Source = require('../lib/data/Source');

function noop() {}

function plugInHook(hook, handler) {
  return function(compiler) {
    compiler.plugin('compilation', function (compilation) {
      compilation.plugin(hook, handler);
    });
  }
}

function createSpiedPluginBody() {
  return sinon.spy((sources, done) => done(null, sources));
}

describe('Docpack', () => {
  describe('static props', () => {
    Docpack.should.have.property('API_VERSION').and.be.a('string');
    Docpack.should.have.property('HOOKS').and.be.eql(HOOKS);
    Docpack.should.have.property('defaultConfig').and.be.an('object');
  });

  describe('static methods', () => {
    describe('createPlugin()', () => {
      it('should exist', () => {
        Docpack.createPlugin.should.exist.and.be.a('function').and.be.equal(createPlugin);
      });
    });
  });

  describe('constructor()', () => {
    it('should allow to create instance via function call', () => {
      Docpack().should.be.instanceof(Docpack);
    });

    it('should properly set initial values', () => {
      var docpack = Docpack();
      docpack.should.have.property('config').and.be.eql(Docpack.defaultConfig);
      docpack.should.have.property('plugins').and.be.empty;
      docpack.should.have.property('sources').and.be.empty;
    });

    it('should assign passed config', () => {
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
      (function() { docpack.use( createPlugin()() ) }).should.not.throws();
    });

    it('should allow to inject in any hook (actually simple plugin creation) (hook:String, handler:Function)', () => {
      var docpack = Docpack();
      (function() { docpack.use(1, function(){}) }).should.throws(TypeError);
      (function() { docpack.use(function(){}, function(){}) }).should.throws(TypeError);
      (function() { docpack.use('qwe', function(){}) }).should.not.throws();
      docpack.plugins[0].should.be.instanceOf(DocpackPlugin);
    });

    it('should return docpack instance', () => {
      var Plugin = createPlugin();
      Docpack().use(Plugin()).should.be.instanceOf(Docpack);
    });

    it('should save plugins in `plugins` prop', () => {
      var docpack = Docpack();
      var Plugin1 = createPlugin();
      var Plugin2 = createPlugin();

      docpack.use(Plugin1()).use(Plugin2());
      docpack.plugins.should.be.lengthOf(2);
      docpack.plugins[0].should.be.instanceOf(Plugin1);
      docpack.plugins[1].should.be.instanceOf(Plugin2);
    });
  });

  describe('save()', function () {
    it('should save source', function () {
      var source = new Source({path: '/qwe', absolutePath: '/qwe', content: 'qwe'});
      var docpack = Docpack();

      docpack.save(source);
      docpack.sources.should.include(source).and.to.have.lengthOf(1);

      docpack.save(source);
      docpack.sources.should.include(source).and.to.have.lengthOf(1);
    })
  });

  describe('apply()', () => {
    it('should apply all plugins registered via `use()`', (done) => {
      var pluginBody = sinon.spy();
      var plugin = createPlugin(pluginBody)();

      InMemoryCompiler({plugins: [Docpack().use(plugin)]})
        .run()
        .then(compilation => {
          pluginBody.should.have.been.calledOne;
          done();
        })
        .catch(done);
    });

    describe('Hooks', () => {
      var fs;
      var compiler;

      beforeEach(() => {
        fs = new MemoryFS({
          'entry.js': new Buffer('')
        });

        compiler = InMemoryCompiler({
          context: '/',
          entry: './entry',
          plugins: []
        }, {inputFS: fs});
      });

      afterEach(() => {
        fs = compiler = null;
      });

      it('should invoke all handlers in proper order', (done) => {
        var docpack = Docpack();

        var expectedOrder = [
          HOOKS.BEFORE_EXTRACT,
          HOOKS.EXTRACT,
          HOOKS.AFTER_EXTRACT,
          HOOKS.BEFORE_GENERATE,
          HOOKS.GENERATE,
          HOOKS.AFTER_GENERATE,
          HOOKS.EMIT
        ];
        var actualOrder = [];

        shuffleArray(expectedOrder, {copy: true}).map((hookName) => {
          var Plugin = createPlugin(plugInHook(hookName, (sources, done) => {
            actualOrder.push(hookName);
            done(null, sources);
          }));

          docpack.use(Plugin());
        });

        compiler.apply(docpack).run()
          .then(c => {
            actualOrder.should.be.eql(expectedOrder);
            done();
          })
          .catch(done)
      });

      it('should invoke handlers properly', (done) => {
        var extractPlugin = createSpiedPluginBody();
        var generatePlugin = createSpiedPluginBody();

        var docpack = Docpack(/\.txt$/)
          .use(HOOKS.BEFORE_EXTRACT, extractPlugin)
          .use(HOOKS.BEFORE_GENERATE, generatePlugin);

        compiler.apply(docpack).run().then(c => {
          // Handlers attached to extract stage are not invoked if there is no files to process
          extractPlugin.should.have.not.been.called;

          // Handlers attached to generate stage invoked ALWAYS, even if there is no files to process
          generatePlugin.should.have.been.calledOnce;

          // When there is no files to process handlers in generate stage receives [] as first param
          generatePlugin.should.have.been.calledWith([]);
          done();
        })
        .catch(done);
      });

      it('should throw if invalid type returned from plugin', () => {
        var docpack = Docpack()
          .use(HOOKS.BEFORE_EXTRACT, (sources, done) => done(null, 'qwe'));

        compiler.apply(docpack);

        return compiler.run().should.be.rejectedWith('Plugins should return array');
      });

      it('should properly handle errors from plugins', () => {
        var docpack = Docpack()
          .use(HOOKS.EXTRACT, (sources, done) => done('Bad content'));

        return compiler.apply(docpack).run().should.be.rejectedWith('Bad content');
      });

      it('should save results after AFTER_EXTRACT', (done) => {
        var s;
        var docpack = Docpack();
        docpack.sources.should.be.lengthOf(0);

        docpack.use(HOOKS.AFTER_EXTRACT, (sources, done) => {
          s = sources;
          done(null, sources);
        });

        compiler.apply(docpack).run().then(c => {
          docpack.sources.should.be.lengthOf(1).and.be.eql(s);
          done();
        }).catch(done);


      });
    });
  });
});