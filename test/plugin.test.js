var should = require('chai').should();
var Plugin = require('../lib/plugin');
var configureLoaderPath = require('../lib/configure/loader').LOADER_PATH;

describe('Plugin', function () {

  describe('::extract()', function () {

    it('should exists', function () {
      Plugin.extract.should.exist.and.be.a('function');
    });

    it('should return path to configure loader', function () {
      Plugin.extract().should.contain(configureLoaderPath);
    });

    it('should return path with query params when options are presented', function () {
      var params = {qwe: 123};
      Plugin.extract({qwe: 123}).should.contain(JSON.stringify(params));
    });

  });

});