const path = require('path');
const Promise = require('bluebird');
const MemoryFS = require('memory-fs');

const readFile = require('webpack-toolkit/lib/readFile');

const extract = require('../lib/extractor');
const Source = require('docpack/lib/data/Source');
const Example = require('docpack/lib/data/Example');

const resolve = path.resolve;

function mockExtractor(fs) {
  const context = {
    fs,
    dependencies: [],
    addDependency(dep) {
      this.dependencies.push(dep);
    },
    readFile: readFile.bind(null, fs),
  };

  return extract.bind(context);
}

describe('Extractor', () => {
  let source;

  beforeEach(() => {
    source = new Source({
      path: 'source.js',
      absolutePath: '/source.js',
      content: '',
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
    source.content = '/** @type {{{ */ var a = 123;';
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
      .then((sourceResult) => {
        sourceResult.attrs.module.should.eql('tralala');
        sourceResult.blocks.should.have.lengthOf(2);
        sourceResult.blocks[0].attrs.module.should.eql('tralala');
        sourceResult.blocks[1].attrs.name.should.eql('qwe');
        done();
      })
      .catch(done);
  });

  it('should process markdown in comment text tag by default and should not if `raw=true`', (done) => {
    source.content = '/** qwe *qwe* qwe */';

    extract(source)
      .then(() => source.blocks[0].description.should.contain(' <em>qwe</em> '))
      .then(() => extract(source, { raw: true }))
      .then(() => {
        source.blocks[0].description.should.be.equal('qwe *qwe* qwe');
        done();
      })
      .catch(done);
  });

  it('should save every tag in block attributes and support custom tags', (done) => {
    source.content = `
      /**
       * @type {Object} foo
       * @qwe1 qwe1 *qwe*
       * @qwe2 qwe2
       */`;

    extract(source)
      .then((sourceResult) => {
        const attrs = sourceResult.blocks[0].attrs;
        attrs.should.have.property('type').and.equal('{Object} foo');
        attrs.should.have.property('qwe1').and.equal('qwe1 *qwe*');
        attrs.should.have.property('qwe2').and.equal('qwe2');
        done();
      })
      .catch(done);
  });

  describe('Tags special handling', () => {
    describe('@description', () => {
      it('should process markdown by default and should not if `raw=true`', (done) => {
        source.content = '/** @description qwe *qwe* */';
        extract(source)
          .then(() => source.blocks[0].attrs.description.should.contain('<em>qwe</em>'))
          .then(() => extract(source, { raw: true }))
          .then(() => source.blocks[0].attrs.description.should.be.equal('qwe *qwe*'))
          .then(() => done())
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
          .then((sourceResult) => {
            const example = sourceResult.getExamples()[0];
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
          .then((sourceResult) => {
            sourceResult.getExamples().should.be.lengthOf(3);
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
          .then((sourceResult) => {
            const example = sourceResult.getExamples()[0];
            example.should.exist.and.be.instanceOf(Example);
            example.files.should.be.lengthOf(1);
            done();
          })
          .catch(done);
      });
    });

    describe('@example-file', () => {
      let fs;
      let mocked;
      let writeFile;

      beforeEach(() => {
        fs = new MemoryFS();
        writeFile = function (filepath, content) {
          const dir = path.dirname(filepath);
          try {
            fs.statSync(dir).isDirectory();
          } catch (e) {
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
          const promises = [];

          writeFile(resolve('/examples.html'));

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
            content: '/** @example-file ../dir2/examples.html */',
          });

          writeFile(resolve('/dir2/examples.html'));

          return mocked(source).should.be.fulfilled;
        });
      });

      it('should parse file properly', (done) => {
        source.content = '/** @example-file examples.html */';
        writeFile(resolve('/examples.html'), '<example><file></file></example>');

        mocked(source).then((sourceResult) => {
          const example = sourceResult.getExamples()[0];
          example.should.exist;
          example.files.should.exist.and.be.lengthOf(1);
          done();
        })
        .catch(done);
      });

      it('should assign examples in right order', (done) => {
        const input = `
          /**
           * @example-file example1.html
           * @example-file example2.html
           * @example-file example3.html
           */
        `;

        const expectedOrder = [
          'example1.html',
          'example2.html',
          'example3.html',
        ];

        source.content = input;

        expectedOrder.forEach((filename) => {
          writeFile(resolve(`/${filename}`), `<example name="${filename}"></example>`);
        });

        mocked(source)
          .then((sourceResult) => {
            const examples = sourceResult.getExamples();
            const names = examples.map(example => example.attrs.name);

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
