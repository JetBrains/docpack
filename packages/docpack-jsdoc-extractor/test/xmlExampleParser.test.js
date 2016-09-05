require('chai').should();

var exampleParser = require('../lib/xmlExampleParser');
var Example = require('docpack/lib/data/Example');
var ExampleFile = require('docpack/lib/data/ExampleFile');

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
    var example = parse('<example attr1="value1" attr2="true" foo="false"></example>');
    example.attrs.should.be.deep.equal({
      attr1: 'value1', attr2: 'true', foo: 'false'
    })
  });


  it('should skip empty <file> tags', function () {
    var example = parse('<example><file></file></example>');
    example.should.be.instanceOf(Example);
    example.files.should.be.a('array').and.be.empty;
  });

  it('should copy all <file> tag attributes to ExampleFile attrs', function () {
    var file = parseAndGetFirstFile('<example><file type="js" name="index.js" foo="false">c</file></example>');
    file.should.be.instanceOf(ExampleFile);
    file.attrs.should.be.deep.equal({
      type: 'js', name: 'index.js', foo: 'false'
    })
  });

  it('should not modify file content (strip indents only)', function () {
    var file = parseAndGetFirstFile('<example><file>\n  var foo = "bar<tag></tag>";\n\n</file></example>');
    file.content.should.be.a('string').and.eql('\nvar foo = "bar<tag></tag>";\n\n');
  });

  it('should allow < signs inside <file> tags', function () {
    var file = parseAndGetFirstFile('<example><file>for (var i = 0; i < length; i++) {}</file></example>');
    file.content.should.be.a('string').and.eql('for (var i = 0; i < length; i++) {}');
  });

  it('should treat file type as "js" by default', function() {
    var file = parseAndGetFirstFile('<example><file>var a = 123;</file></example>');
    file.type.should.be.eql('js');
  });

  it('should detect file type by type attr', function () {
    var file = parseAndGetFirstFile('<example><file type="js" name="index.html">c</file></example>');
    file.type.should.be.eql('js');
  });

});