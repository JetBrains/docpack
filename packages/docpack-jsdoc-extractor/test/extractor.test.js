var chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

var extract = require('../lib/extractor');
var Source = require('docpack/lib/data/Source');
var Example = require('docpack/lib/data/Example');

describe('Extractor', () => {
  var source;

  beforeEach(() => {
    source = new Source({
      path: 'source.js',
      absolutePath: '/source.js',
      content: ''
    });
  });

  it('should return null if source content is empty', () => {
    source.content = '';
    return extract(source).should.become(null);
  });

  it('should reject when invalid jsdoc', () => {
    source.content = `/** @type {{{ */ var a = 123;`;
    return extract(source).should.be.rejected;
  });

  it('should save tags from first comment in source attributes', (done) => {
    source.content = `
      /** @module tralala */
      var a = 1

      /** @name qwe */
      var b = 2
    `;

    extract(source)
      .then(source => {
        source.attrs.module.should.eql('tralala');
        source.blocks.should.have.lengthOf(2);
        source.blocks[0].attrs.module.should.eql('tralala');
        source.blocks[1].attrs.name.should.eql('qwe');
        done();
      })
      .catch(done);
  });

  it('should process markdown in comment text', (done) => {
    source.content = '/** qwe *qwe* qwe */';
    extract(source)
      .then(source => {
        source.blocks[0].description.should.contain(' <em>qwe</em> ');
        done();
      })
      .catch(done);
  });

  it('should save every tag in block.attrs and support custom tags', (done) => {
    source.content = `
      /**
       * @type {Object} foo
       * @qwe1 qwe1
       * @qwe2 qwe2
       */`;

    extract(source)
      .then(source => {
        var attrs = source.blocks[0].attrs;
        attrs.should.have.property('type').and.eql('{Object} foo');
        attrs.should.have.property('qwe1').and.eql('qwe1');
        attrs.should.have.property('qwe2').and.eql('qwe2');
        done();
      })
      .catch(done);
  });

  describe('Tags special processing', () => {
    describe('@description', () => {
      it('should process markdown', (done) => {
        source.content = `
          /**
           * @description qwe *qwe* ***
           */
        `;
        extract(source)
          .then(source => {
            source.blocks[0].attrs.description.should.contain(' <em>qwe</em> ');
            done();
          })
          .catch(done);
      });
    });

    describe('@example', () => {
      it('should create example from simple example', (done) => {
        source.content = `
          /**
           * @example
           *   func(123);
           *   // => 456;
           */
        `;

        extract(source)
          .then(source => {
            var example = source.blocks[0].examples[0];
            example.should.exist.and.be.instanceOf(Example);
            example.files.should.be.empty;
            done();
          })
          .catch(done);
      });

      it('should process xml examples', (done) => {
        source.content = `
          /**
           * @example
           * <example><file></file></example>
           */
        `;

        extract(source)
          .then(source => {
            var example = source.blocks[0].examples[0];
            example.should.exist.and.be.instanceOf(Example);
            example.files.should.be.lengthOf(1);
            done();
          })
          .catch(done);
      });
    });

    describe('@example-file', () => {
      it('should properly resolve the file', () => {});
      it('should parse file properly', () => {});
      it('should assign examples in right order', () => {});
      it('should cause recompilation when example file was changed', () => {});
    });
  });
});