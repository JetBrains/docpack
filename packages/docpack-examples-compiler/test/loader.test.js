var loader = require('../lib/loader');
var tools = require('webpack-toolkit');
var Promise = require('bluebird');
var MemoryFS = require('memory-fs');

function createContext(context) {
  var sharedData;

  if ('sharedData' in context) {
    sharedData = context.sharedData;
    delete context.sharedData;
  }

  var ctx = new tools.MockedLoaderContext(context);
  ctx[loader.SHARED_DATA_PROPERTY_NAME] = sharedData;
  return ctx;
}

describe('docpack-examples-compiler/loader', () => {
  it('should be cacheable & async', (done) => {
    var context = createContext({sharedData: '1'});

    context.run(loader)
      .then(res => {
        context.isCacheable.should.be.true;
        context.isSync.should.be.false;
        done();
      })
      .catch(done);
  });

  it('should work with different data types', () => {
    return Promise.all([
      createContext({sharedData: 1}).run(loader).should.become(1),
      createContext({sharedData: '1'}).run(loader).should.become('1'),
      createContext({sharedData: true}).run(loader).should.become(true),
      createContext({sharedData: null}).run(loader).should.become(null),
      createContext({sharedData: []}).run(loader).should.become([]),
      createContext({sharedData: {}}).run(loader).should.become({})
    ]);
  });

  it('should throw when shared data is undefined', () => {
    return createContext({sharedData: undefined}).run(loader).should.be.rejectedWith('Undefined is not allowed');
  });

  it('should throw when shared data not found', () => {
    return createContext({
      sharedData: {a: 1},
      query: {path: 'b'}
    })
      .run(loader)
      .should.be.rejectedWith(/not found/);
  });

  it('should work with complex paths', () => {
    var sharedData = {a: {b: {c: {d: [1, 'OK']}}}};
    var path = 'a.b.c.d.1';

    return createContext({
      sharedData: sharedData,
      query: {path: path}}
    )
      .run(loader)
      .should.become('OK');
  });

  it('should work with real Webpack compiler via plugInCompiler() function', (done) => {
    var compiler = tools.InMemoryCompiler({
      context: '/',
      entry: './entry',
      module: {
        loaders: [
          {
            test: /entry\.js$/,
            loader: require.resolve('../lib/loader')
          }
        ]
      }
    });

    compiler.setInputFS(new MemoryFS({
      'entry.js': new Buffer('console.log(123)')
    }));

    loader.plugInCompiler(compiler._compiler, 'console.log(456)');

    compiler.run().then(compilation => {
      compilation.modules[0]._source.source().should.be.equal('console.log(456)');
      done();
    }).catch(done);
  });
});