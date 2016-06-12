var should = require('chai').should();
var expect = require('chai').expect;

var configure = require('../../lib/configurator');
var createConfig = configure.createConfigFromLoaders;
var Plugin = require('../../lib/plugin');
var defaultConfig = require('../../lib/config');

describe('configurator()', function() {

  it('should use default config if no options presented', function() {
    configure().should.deep.equal(defaultConfig);
  });

  it('should properly set params and override defaults', function() {
    var params = {
      test: 'olala',
      qwe: 123
    };

    var config = configure(params);
    config.should.have.property('qwe').and.eql(123);
    config.should.have.property('test').and.eql('olala');
  });

});


describe('createConfigFromLoaders()', function() {

  it('should throw when loaders config is not an array', function() {
    expect(function() {
      createConfig({test: /\.png$/, loader: 'file'})
    }).to.throw();
  });

  it('should skip non-plugin loaders', function() {
    createConfig([ {test: /\.png$/, loader: 'file'} ])
      .should.be.a('array').and.be.empty;
  });

  it('should skip `loaders` property', function() {
    createConfig([ {test: /\.scss$/, loaders: ['style', 'css', 'sass']} ])
      .should.be.a('array').and.be.empty;
  });

  it('should copy test, include and exclude properties', function() {
    var loaderConfig = {
      test: /\.js$/,
      include: [],
      exclude: [],
      loader: Plugin.extract()
    };
    var result = createConfig([loaderConfig]);
    var config = result[0];

    result.should.be.a('array').and.have.lengthOf(1);
    config.should.have.property('test').and.eql(loaderConfig.test);
    config.should.have.property('include').and.eql(loaderConfig.include);
    config.should.have.property('exclude').and.eql(loaderConfig.exclude);
  });

});