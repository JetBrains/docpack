var chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

var path = require('path');
var extract = require('../lib/extractor');
var Source = require('docpack/lib/data/Source');
var Example = require('docpack/lib/data/Example');

var Promise = require('bluebird');

var MemoryFS = require('memory-fs');
var readFile = require('webpack-toolkit/lib/readFile');

function mockExtractor(fs) {
  var context = {
    fs: fs,
    dependencies: [],
    addDependency: function(dep) {
      this.dependencies.push(dep);
    },
    readFile: readFile.bind(null, fs)
  };

  return extract.bind(context);
}

describe('Extractor', () => {
  var source;

  beforeEach(() => {
    source = new Source({
      path: 'source.js',
      absolutePath: '/source.js',
      content: ''
    });
  });

  afterEach(() => {
    source = null;
  });

  it('should pass result to next step if content is empty', () => {
    source.content = '';
    return extract(source).should.become(source);
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

  it('should save every tag in block attributes and support custom tags', (done) => {
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

  describe('Tags special handling', () => {
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

      it('should process multiple @example tags', (done) => {
        source.content = `
          /**
           * @example func(1)
           * @example func(2)
           * @example func(3)
           */
        `;

        extract(source)
          .then(source => {
            var examples = source.blocks[0].examples;
            examples.should.be.lengthOf(3);
            done();
          })
          .catch(done);
      });

      it('should process xml examples', (done) => {
        source.content = `
          /**
           * @example <example><file></file></example>
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
      var fs;
      var mocked;
      var writeFile;

      beforeEach(() => {
        fs = new MemoryFS();
        writeFile = function(filepath, content) {
          var dir = path.dirname(filepath);
          try {
            fs.statSync(dir).isDirectory();
          } catch(e) {
            fs.mkdirpSync(dir);
          }
          fs.writeFileSync(filepath, content || '', 'utf-8');
        };

        mocked = mockExtractor(fs);
      });

      describe('Resolving', () => {
        it('should reject if file doesn\'t exist', () => {
          source.content = '/** @example-file ./examples.html */';
          return mocked(source).should.be.rejected;
        });

        it('should resolve file properly', () => {
          var promises = [];

          writeFile('/examples.html');

          source.content = '/** @example-file examples.html */';
          promises.push(mocked(source).should.be.fulfilled);

          source.content = '/** @example-file ./examples.html */';
          promises.push(mocked(source).should.be.fulfilled);

          source.content = '/** @example-file /examples.html */';
          promises.push(mocked(source).should.be.fulfilled);

          return Promise.all(promises);
        });

        it('should allow to use parent directory', () => {
          source = new Source({
            path: 'dir/source.js',
            absolutePath: '/dir/source.js',
            content: '/** @example-file ../dir2/examples.html */'
          });

          writeFile('/dir2/examples.html');

          return mocked(source).should.be.fulfilled;
        });
      });

      it('should parse file properly', (done) => {
        source.content = '/** @example-file examples.html */';
        writeFile('/examples.html', '<example><file></file></example>');

        mocked(source).then(source => {
          var example = source.blocks[0].examples[0];
          example.should.exist;
          example.files.should.exist.and.be.lengthOf(1);
          done();
        })
        .catch(done);
      });

      it('should assign examples in right order', (done) => {
        var input = `
          /**
           * @example-file example1.html
           * @example-file example2.html
           * @example-file example3.html
           */
        `;

        var expectedOrder = [
          'example1.html',
          'example2.html',
          'example3.html'
        ];

        source.content = input;

        expectedOrder.forEach((filename) => {
          writeFile(`/${filename}`, `<example name="${filename}"></example>`);
        });

        mocked(source)
          .then(source => {
            var examples = source.blocks[0].examples;
            var names = examples.map((example) => { return example.attrs.name });

            examples.should.have.lengthOf(expectedOrder.length);
            names.forEach((filename, i) => {
              filename.should.be.equal(expectedOrder[i]);
            });
            done();
          })
          .catch(done);
      });

      it('should cause recompilation when example file was changed', () => {
        // TODO
      });
    });
  });
});