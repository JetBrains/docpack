const sinon = require('sinon');
const bluebird = require('bluebird');
const Plugin = require('../lib/plugin');
const Docpack = require('docpack');
const Source = require('docpack/lib/data/Source');
const tools = require('webpack-toolkit');
const extractor = require('../lib/extractor');
const merge = require('object-assign');

const Compiler = tools.InMemoryCompiler;
const PluginRewired = require('rewire')('../lib/plugin');

PluginRewired.__set__({
  Docpack,
  bluebird,
  tools,
});

PluginRewired.__set__('tools', merge(
  {},
  tools,
  {
    getModuleByFilepath() {
      return {
        fileDependencies: [],
      };
    },
  }
));

describe('docpack-jsdoc-extractor', () => {
  it('should export static props', () => {
    Plugin.defaultConfig.should.exist.and.be.an('object');
  });

  describe('apply()', () => {
    let sources;

    beforeEach(() => {
      sources = [
        new Source({ path: 'source1.js', absolutePath: '/source1.js', content: '/** @name source1 */' }),
        new Source({ path: 'source2.js', absolutePath: '/source2.js', content: '/** @name source2 */' }),
      ];
    });

    it('should work', (done) => {
      const spiedExtractor = sinon.spy(extractor);
      PluginRewired.__set__('extractor', spiedExtractor);

      const compiler = Compiler({
        entry: '/entry',
        plugins: [
          Docpack()
            .use(Docpack.HOOKS.BEFORE_EXTRACT, (s, hookDone) => hookDone(null, sources))
            .use(PluginRewired({ match: /source1\.js/, parseMarkdown: false })),
        ],
      });

      const fs = tools.MemoryFileSystem(compiler._compiler.inputFileSystem);

      fs.writeFile('/entry.js', '', 'utf-8')
        .then(() => compiler.run())
        .then((compilation) => {
          spiedExtractor.should.be.calledOnce;

          const call = spiedExtractor.firstCall;

          // Extractor context
          const thisValue = call.thisValue;
          thisValue.should.have.a.property('addDependency').and.be.a('function');
          thisValue.should.have.a.property('readFile').and.be.a('function');
          thisValue.should.have.a.property('fs').and.be.equal(compilation.compiler.inputFileSystem);
          thisValue.should.have.a.property('module').and.be.eql({ fileDependencies: [] });

          // Extractor arguments
          const args = call.args;
          args.should.be.lengthOf(2);
          args[0].should.be.equal(sources[0]);
          args[1].should.be.eql({ raw: true });
          done();
        })
        .catch(done);
    });
  });
});
