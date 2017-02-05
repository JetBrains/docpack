var path = require('path');
var sinon = require('sinon');
var shuffleArray = require('shuffle-array');
var tools = require('webpack-toolkit');
var InMemoryCompiler = require('webpack-toolkit/lib/InMemoryCompiler');
var MemoryFS = require('memory-fs');

var Docpack = require('../lib/docpack');
var HOOKS = Docpack.HOOKS;
var DocpackPlugin = require('../lib/utils/DocpackPlugin');
var createPlugin = DocpackPlugin.create;
var Source = require('../lib/data/Source');

var processingHooks = [
  HOOKS.BEFORE_EXTRACT,
  HOOKS.EXTRACT,
  HOOKS.AFTER_EXTRACT,
  HOOKS.BEFORE_GENERATE,
  HOOKS.GENERATE,
  HOOKS.AFTER_GENERATE,
  HOOKS.EMIT
];

var context = '/';
var entry = './entry';

function createSpiedPluginBody() {
  return sinon.spy((sources, done) => done(null, sources));
}

function createFS() {
  return new MemoryFS({
    'entry.js': new Buffer('console.log(123)')
  });
}

describe('Docpack', () => {
  it('statics', () => {
    Object.keys(Docpack).should.be.eql([
      'API_VERSION',
      'HOOKS',
      'defaultConfig',
      'DocpackPlugin',
      'createPlugin',
      'getCompilerVersion'
    ]);

    Docpack.should.have.property('API_VERSION').and.be.a('string');
    Docpack.should.have.property('HOOKS').and.be.eql(HOOKS);
    Docpack.should.have.property('defaultConfig').and.be.an('object');
    Docpack.should.have.property('DocpackPlugin').and.be.equal(DocpackPlugin);
    Docpack.should.have.property('createPlugin').and.be.equal(createPlugin);
    Docpack.should.have.property('getCompilerVersion').and.be.a('function');
  });

  describe('constructor()', () => {
    it('should allow to create instance via function call', () => {
      Docpack().should.be.instanceof(Docpack);
    });

    it('should properly set initial values', () => {
      var docpack = Docpack();
      docpack.should.have.property('config').and.be.eql(Docpack.defaultConfig);
      docpack.should.have.property('plugins').and.be.empty;
    });

    it('should assign passed config', () => {
      var cfg = {test: /\.jsx$/, exclude: false, foo: 'bar'};
      Docpack(cfg).should.have.property('config').and.be.eql(cfg);
    });
  });

  describe('use()', () => {
    it('should throws when wrong plugin signature', () => {
      var docpack = Docpack();
      (function() { docpack.use( function(){} ) }).should.throws(TypeError);
      (function() { docpack.use( (function(){})() ) }).should.throws(TypeError);
      (function() { docpack.use( function(){ return function() {} }() ) }).should.throws(TypeError);
      (function() { docpack.use( createPlugin() ) }).should.throws();

      (function() { docpack.use( createPlugin()() ) }).should.not.throws();
    });

    it('should allow to inject in any hook (actually simple plugin creation) (hook:String, handler:Function)', () => {
      var docpack = Docpack();
      (function() { docpack.use(1, function(){}) }).should.throws(TypeError);
      (function() { docpack.use(function(){}, function(){}) }).should.throws(TypeError);
      (function() { docpack.use('qwe', function(){}) }).should.not.throws();
      docpack.plugins[0].should.be.instanceOf(DocpackPlugin);
    });

    it('should return docpack instance (chainable)', () => {
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

  describe('save()', () => {
    it('should save source', () => {
      var source = new Source({path: '/qwe', absolutePath: '/qwe', content: 'qwe'});
      var docpack = Docpack();

      docpack.save(source);
      docpack.sources.should.include(source).and.to.have.lengthOf(1);

      docpack.save(source);
      docpack.sources.should.include(source).and.to.have.lengthOf(1);
    });
  });

  describe('apply()', () => {
    it('should apply all plugins registered via `use()`', (done) => {
      var pluginBody = sinon.spy();
      var plugin = createPlugin(pluginBody)();

      InMemoryCompiler({
        context: context,
        entry: entry,
        plugins: [Docpack().use(plugin)]
      })
        .setInputFS(createFS())
        .run()
        .then(compilation => {
          pluginBody.should.have.been.calledOne;
          done();
        })
        .catch(done);
    });

    it('should always process original sources', (done) => {
      var docpack = Docpack();
      var compiler = InMemoryCompiler({
        context: context,
        entry: entry,
        module: {
          loaders: [
            {
              test: /\.js$/,
              loader: require.resolve('null-loader')
            }
          ]
        },
        plugins: [docpack]
      })
      .setInputFS(createFS());

      compiler.setInputFS(new MemoryFS({
        'entry.js': new Buffer('console.log(123)')
      }));

      compiler.run()
        .then(compilation => {
          var content = docpack.sources[0].content;
          content.should.be.equal('console.log(123)');
          done()
        })
        .catch(done);
    });

    describe('Hooks', () => {
      var fs;
      var compiler;

      beforeEach(() => {
        compiler = InMemoryCompiler({
          context: context,
          entry: entry,
          plugins: []
        })
        .setInputFS(createFS());
      });

      it('should throw if invalid type returned from plugin', () => {
        var docpack = Docpack()
          .use(HOOKS.BEFORE_EXTRACT, (sources, done) => done(null, 'qwe'));

        compiler.apply(docpack);

        return compiler.run().should.be.rejectedWith(TypeError);
      });

      it('should properly handle errors from plugins', () => {
        var docpack = Docpack()
          .use(HOOKS.EXTRACT, (sources, done) => done('Bad content'));

        return compiler.apply(docpack).run().should.be.rejectedWith('Bad content');
      });

      it('should invoke plugins in proper order', (done) => {
        var docpack = Docpack();
        var expectedOrder = processingHooks;
        var actualOrder = [];

        shuffleArray(expectedOrder, {copy: true}).map((hookName) => {
          var Plugin = createPlugin(function(compiler) {
            compiler.plugin('compilation', function(compilation) {
              compilation.plugin(hookName, function(sources, done) {
                actualOrder.push(hookName);
                done(null, sources);
              });
            });
          });

          docpack.use(Plugin());
        });

        compiler.apply(docpack).run()
          .then(c => {
            actualOrder.should.be.eql(expectedOrder);
            done();
          })
          .catch(done)
      });

      it('should INVOKE plugins even if no matched sources found', (done) => {
        var docpack = Docpack(/\.foo$/);

        var dummyPluginsByHooks = processingHooks.map(hookName => {
          return {
            hook: hookName,
            body: createSpiedPluginBody()
          }
        });

        dummyPluginsByHooks.forEach(plugin => {
          docpack.use(plugin.hook, plugin.body)
        });

        compiler.apply(docpack).run().then(c => {
          dummyPluginsByHooks.forEach(plugin => {
            plugin.body.should.have.been.called;
          });
          done();
        })
        .catch(done);
      });

      it('should skip child compilations', (done) => {
        var docpack = Docpack();
        var plugin = createSpiedPluginBody();
        docpack.use(HOOKS.BEFORE_EXTRACT, plugin);

        sinon.spy(docpack, 'apply');

        InMemoryCompiler({
          context: context,
          entry: entry,
          plugins: [docpack]
        })
          .setInputFS(createFS())
          .run()
          .then(compilation => {
            var childCompiler = tools.ChildCompiler(compilation);
            childCompiler._compiler.apply(docpack);
            return childCompiler.run();
          })
          .then(compilation => {
            docpack.apply.should.have.been.calledTwice;
            docpack.apply.getCall(0).returnValue.should.be.true;
            docpack.apply.getCall(1).returnValue.should.be.false;
            plugin.should.have.been.calledOnce;

            docpack.apply.restore();
            done();
          })
          .catch(done);
      });
    });
  });
});
