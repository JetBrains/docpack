require('chai').should();

var exampleParser = require('../../lib/plugins/parsers/xmlExampleParser');
var Example = require('../../lib/data/Example');
var ExampleFile = require('../../lib/data/ExampleFile');

function parse(input) {
  return exampleParser(input)[0];
}

function parseAndGetFirstFile(input) {
  return exampleParser(input)[0].files[0];
}

describe('xmlExampleParser', function() {

  it('should return empty array on empty input', function () {
    var input = ['\n', '\n', '   ', '\n', '  \n'].join('');
    exampleParser(input).should.be.a('array').and.be.empty;
  });

  it('should return empty array if no <example> tags', function () {
    var input = 'var a = 123; <file></file>';
    exampleParser(input).should.be.a('array').and.be.empty;
  });

  it('should NOT skip empty <example> tags', function () {
    var input = '<example></example>';
    parse(input).should.be.instanceOf(Example);
  });

  it('should copy all <example> tag attributes to Example attrs', function () {
    var result = parse('<example attr1="value1" attr2="true" foo="false"></example>');
    result.attrs.should.be.deep.equal({
      attr1: 'value1', attr2: 'true', foo: 'false'
    })
  });


  it('should skip empty <file> tags', function () {
    var input = '<example><file></file></example>';
    var result = parse(input);
    result.should.be.instanceOf(Example);
    result.files.should.be.a('array').and.be.empty;
  });

  it('should copy all <file> tag attributes to ExampleFile attrs', function () {
    var result = parseAndGetFirstFile('<example><file type="js" name="index.js" foo="false">c</file></example>');
    result.should.be.instanceOf(ExampleFile);
    result.attrs.should.be.deep.equal({
      type: 'js', name: 'index.js', foo: 'false'
    })
  });

  it('should not modify file content (strip indents only)', function () {
    var result = parseAndGetFirstFile('<example><file>\n  var foo = "bar<tag></tag>";\n\n</file></example>');
    result.source.should.be.a('string').and.eql('\nvar foo = "bar<tag></tag>";\n\n');
  });

  it('should detect file type by name attr', function () {
    var result = parseAndGetFirstFile('<example><file name="index.html">c</file></example>');
    result.type.should.be.eql('html');
  });

  it('should detect file type by type attr', function () {
    var result = parseAndGetFirstFile('<example><file type="js" name="index.html">c</file></example>');
    result.type.should.be.eql('js');
  });

});