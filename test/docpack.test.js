var path = require('path');
var sinon = require('sinon');

var InMemoryCompiler = require('webpack-toolkit/lib/InMemoryCompiler');
var MemoryFS = require('memory-fs');

var Docpack = require('../lib/docpack');
var HOOKS = require('../lib/hooks');
var createPlugin = require('../lib/docpackPlugin').create;
var Source = require('../lib/data/Source');

function noop() {}

function plugInHook(hook, handler) {
  return function(compiler) {
    compiler.plugin('compilation', function (compilation) {
      compilation.plugin(hook, handler);
    });
  }
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
      (function() { docpack.use( createPlugin('foo')() ) }).should.not.throws();
    });

    it('should return docpack instance to simplify plugins registration', () => {
      var Plugin = createPlugin('foo');
      Docpack().use(Plugin()).should.be.instanceOf(Docpack);
    });

    it('should save plugins in `plugins` field', () => {
      var docpack = Docpack();
      var Plugin1 = createPlugin('foo');
      var Plugin2 = createPlugin('bar');

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
      var Plugin = createPlugin('foo', sinon.spy());
      var plugin = new Plugin();

      var compiler = new InMemoryCompiler({
        plugins: [ Docpack().use(plugin) ]
      });

      compiler.run().then(compilation => {
        plugin.apply.should.have.been.calledOne;
        done();
      }).catch(done);
    });

    describe('Hooks', () => {
      var fs;
      var spy;
      var compiler;
      var _compiler;
      var plugins;

      beforeEach(() => {
        fs = new MemoryFS({
          'entry.js': new Buffer(`
            require('./dep1');
            require('./dep2');
          `)
        });

        spy = sinon.spy((sources, done) => {
          done(null, sources);
        });

        compiler = InMemoryCompiler({
          context: '/',
          entry: './entry',
          plugins: []
        }, {inputFS: fs});

        compiler.addPlugin = function() {
          this._compiler.apply.apply(this._compiler, arguments);
        };

        _compiler = compiler._compiler;
        plugins = _compiler.options.plugins;
      });

      afterEach(() => {
        fs = spy = compiler = _compiler = plugins = null;
      });

      it('should do nothing if no matched sources found', (done) => {
        compiler.addPlugin(
          Docpack(/\.txt$/),
          createPlugin('foo', plugInHook(HOOKS.EXTRACT, spy))()
        );

        compiler.run().then(compilation => {
            spy.should.have.not.been.called;
            done();
          })
          .catch(done);
      });

      describe('BEFORE_EXTRACT', () => {
        it('should invoked with `sources` as first param', (done) => {
          compiler.addPlugin(
            Docpack(),
            createPlugin('qwe', plugInHook(HOOKS.BEFORE_EXTRACT, (sources, done) => {
              debugger;
              done(null, sources.filter(s => s.path != 'dep1.js'));
            }))(),
            createPlugin('qwe2', plugInHook(HOOKS.BEFORE_EXTRACT, (sources, done) => {
              debugger;
              done(null, sources.filter(s => s.path != 'dep2.js'));
            }))()
          );

          fs.writeFileSync('/dep1.js', '// qwe', 'utf-8');
          fs.writeFileSync('/dep2.js', '// qwe2', 'utf-8');

          compiler.run().then(compiation => {
              done();
              return;

              spy.should.have.been.calledOnce;
              spy.firstCall.args[0][0].should.be.instanceOf(Source);
              spy.firstCall.args[1].should.be.a('function');

            })
            .catch(done);
        });
      });


    });
  });
});