var expect = require('chai').expect;
var extractor = require('../lib/default-extractor');
var loadFixture = require('./test-utils').loadFixture;

describe('default-extractor', function() {

  var source = loadFixture('default-extractor/simple.js');
  var result = extractor(source);

  it('should be a proper type', function() {
    expect(result).to.be.a('object');
  });

  it('should have `content` prop with proper structure', function() {
    var content = result.content;

    expect(content).to.be.a('array');
    expect(content[0].description.full).to.have.length.above(0);
    expect(content[0].tags).to.have.length.above(0);
  });

  it('should have `meta` prop with proper structure', function() {
    expect(result.meta).to.be.a('object');
    expect(result.meta.name).to.be.a('string');
  });
});