var extract = require('../lib/extractor');
var tools = require('webpack-toolkit');
var Source = require('docpack/lib/data/Source');

describe('Extractor', () => {
  var source;

  beforeEach(() => {
    source = new Source({
      path: 'source.md',
      absolutePath: '/source.md',
      content: ''
    });
  });

  it('should return with Source', () => {
    return extract(source).should.become(source);
  });

  it('should parse YAML Front Matter and save it as Source attrs', (done) => {
    source.content = `---
foo: bar
a:
 - b
 - c
---`;

    extract(source).then(function(source) {
      source.attrs.should.have.property('foo').that.equal('bar');
      source.attrs.should.have.property('a').that.eql(['b', 'c']);
      source.should.have.property('rendered').that.eql('');
      done();
    })
    .catch(done);
  });

  // This is very stupid test
  it('should render markdown to HTML', () => {
    source.content = 'a *b* c';
    return extract(source).should.eventually.have.property('rendered').that.contains('<em>b</em>');
  });

  it('should pass options to markdown parser', () => {
    source.content = '<hr>';
    return extract(source, {html: true}).should.eventually.have.property('content').that.equal('<hr>');
  });
});