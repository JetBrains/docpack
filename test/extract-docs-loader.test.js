var expect = require('chai').expect;
var path = require('path');
var extend = require('object-assign');

var loader = require('../lib/extract-docs-loader');
var Plugin = require('../lib/plugin');

function mockPlugin(config) {
  var cfg = extend({}, Plugin.defaultConfig, config || {});

  return {
    config: cfg,
    files: {}
  }
}

function mockContext(ctx) {
  var context = ctx || {};
  var mocked = {
    resourcePath: context.resourcePath,
    query: context.query ? '?' + JSON.stringify(context.query) : null,
    options: {
      context: '/'
    }
  };

  if ('plugin' in context) {
    var loaderWorkDir = path.dirname(require.resolve('../lib/extract-docs-loader'));
    mocked[loaderWorkDir] = mocked.plugin = context.plugin;
  }

  return mocked;
}

function run(context, content) {
  var context = context || {};
  context.plugin = 'plugin' in context ? context.plugin : mockPlugin();
  var mockedContext = mockContext(context);
  return {
    result: loader.call(mockedContext, content),
    plugin: mockedContext.plugin
  };
}


describe('extract-docs-loader', function() {

  it('should throws when loader is used without the plugin', function() {
    expect(function () {
      run({plugin: undefined}, '');
    }).to.throws(Error);
  });

  it('should accept params via query', function() {
    var templatePath = 'qwe';

    var result = run({
      resourcePath: '/test.js',
      query: {templatePath: templatePath}
    }, '');

    expect(Object.keys(result.plugin.files)).to.have.lengthOf(1);
    expect(result.plugin.files['test.js'].templatePath).to.eql(templatePath);
  });

  it('should not process file if extractor returns null', function() {
    var result = run({
      resourcePath: '/test.js',
      query: {extractor: require.resolve('./fixtures/extract-docs-loader/null-returns-extractor')}
    }, '');

    expect(result.result).to.eql(null);
    expect(Object.keys(result.plugin.files)).to.have.lengthOf(0);
  });

  it('should throws when extractor returns non object', function() {
    expect(function() {
      run({
        resourcePath: '/test.js',
        query: {extractor: require.resolve('./fixtures/extract-docs-loader/string-returns-extractor')}
      }, '');
    }).to.throws(Error);
  });

  it('should save extracted data if extractor returns object', function() {
    // comments count extractor
    var extractorPath = './fixtures/extract-docs-loader/comments-count-extractor';
    var extractor = require(extractorPath);
    var source = '/** qwe e qwe */ qwe w qe qw /** */ /** */';
    var expected = extractor(source).count; // => 3

    var result = run({
      resourcePath: '/test.js',
      query: {extractor: require.resolve(extractorPath)}
    }, source);

    expect(result.plugin.files['test.js'].count).to.eql(expected);
  });

  it('should properly fill file properties like path, hash, etc', function() {
    var getHash = require('../lib/utils/get-hash');
    var source = '';
    var result = run({resourcePath: '/test.js'}, source);
    var file = result.plugin.files[Object.keys(result.plugin.files)[0]];

    expect(file.path).to.be.a('string');
    expect(file.sourcePath).to.be.a('string');
    expect(file.templatePath).to.be.a('string');
    expect(file.hash).to.be.a('string').and.eql(getHash(source));
  })

});