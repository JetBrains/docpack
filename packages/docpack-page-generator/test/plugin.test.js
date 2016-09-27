var Plugin = require('../lib/plugin');
var docpack = require('docpack');
var InMemoryCompiler = require('webpack-toolkit').InMemoryCompiler;
var MemoryFS = require('memory-fs');

describe('Docpack Page Generator Plugin', () => {
  describe('constructor', () => {
    it('should throw when wrong arguments', () => {
      (() => Plugin()).should.throw();
    });

    it('should properly set config', () => {
      Plugin({template: 'qwe'}).config.template.should.equal('qwe');
    });
  });

  it('_getTemplateAssetFilename()', () => {
    var fs = new MemoryFS({
      'entry.js': new Buffer('console.log(123);'),
      'template.js': new Buffer('module.exports = function() {return ""}')
    });

    var generatePlugin = Plugin({template: '/template.js'});

    var compiler = new InMemoryCompiler({
      context: '/',
      entry: './entry',
      output: {
        filename: '[name].js'
      },
      plugins: [
        docpack(/entry/).use(generatePlugin)
      ]
    }, {inputFS: fs});

    compiler.run()
      .then((compilation) => {
        var name = generatePlugin._getTemplateAssetFilename(compilation)
        debugger;
      })
      .catch((error) => {
        debugger;
      });
  });
});