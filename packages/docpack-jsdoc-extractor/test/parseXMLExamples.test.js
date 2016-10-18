const examplesParser = require('../lib/parseXMLExamples');
const Example = require('docpack/lib/data/Example');
const ExampleFile = require('docpack/lib/data/ExampleFile');

function parse(input) {
  return examplesParser(input)[0];
}

function parseAndGetFirstFile(input) {
  return examplesParser(input)[0].files[0];
}

describe('xmlExampleParser', () => {
  it('should return empty array if no examples found', () => {
    const input = ['\n', '\n', '   ', '\n', '  \n'].join('');
    examplesParser(input).should.be.a('array').and.be.empty;
  });

  it('should return empty array if only <file>s found', () => {
    const input = 'var a = 123; <file></file>';
    examplesParser(input).should.be.a('array').and.be.empty;
  });

  it('should return empty array if incorrect <example> tags found', () => {
    const input = 'var a = 123; <example></example';
    examplesParser(input).should.be.a('array').and.be.empty;
  });

  describe('<example>', () => {
    it('should NOT skip empty <example> tags', () => {
      const input = '<example></example>';
      const example = parse(input);
      example.should.be.instanceOf(Example);
      example.should.have.a.property('content').and.equal('');
    });

    it('should copy all <example> tag attributes to Example attrs', () => {
      const example = parse('<example attr1="value1" attr2="true" foo="false"></example>');
      example.should.have.a.property('content').and.equal('');
      example.attrs.should.be.deep.equal({
        attr1: 'value1', attr2: 'true', foo: 'false',
      });
    });
  });

  describe('<file>', () => {
    it('should NOT skip empty <file> tags', () => {
      const example = parse('<example><file></file></example>');
      example.should.have.a.property('content').and.equal('<file></file>');
      example.files.should.be.a('array').and.be.lengthOf(1);
      example.files[0].should.be.instanceOf(ExampleFile);
    });

    it('should copy all <file> tag attributes to ExampleFile attrs', () => {
      const file = parseAndGetFirstFile('<example><file type="js" name="index.js" foo="false">c</file></example>');
      file.should.be.instanceOf(ExampleFile);
      file.attrs.should.be.deep.equal({
        type: 'js', name: 'index.js', foo: 'false',
      });
    });

    it('should not modify file content (strip indents only)', () => {
      const file = parseAndGetFirstFile('<example><file>\n  var foo = "bar<tag></tag>";\n\n</file></example>');
      file.content.should.be.a('string').and.eql('\nvar foo = "bar<tag></tag>";\n\n');
    });

    it('should allow < signs inside <file> tags', () => {
      const file = parseAndGetFirstFile('<example><file>for (var i = 0; i < length; i++) {}</file></example>');
      file.content.should.be.a('string').and.eql('for (var i = 0; i < length; i++) {}');
    });

    it('should treat file type as "js" by default', () => {
      const file = parseAndGetFirstFile('<example><file>var a = 123;</file></example>');
      file.type.should.be.eql('js');
    });

    it('should detect file type by type attr', () => {
      const file = parseAndGetFirstFile('<example><file type="js" name="index.html">c</file></example>');
      file.type.should.be.eql('js');
    });
  });
});
