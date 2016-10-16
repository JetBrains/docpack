var Docpack = require('docpack');
var createContext = require('docpack/lib/utils/createExtractorContext');
var Promise = require('bluebird');
var tools = require('webpack-toolkit');
var extractor = require('./extractor');

var defaultConfig = {
  match: /\.js$/,
  parseMarkdown: true
};

var JSDocExtractor = Docpack.createPlugin({
  name: 'jsdoc-extractor',
  defaultConfig: defaultConfig,
  apply: function (compiler) {
    var config = this.config;
    var doxConfig = {raw: !config.parseMarkdown};

    compiler.plugin('compilation', function (compilation) {
      compilation.plugin(Docpack.HOOKS.EXTRACT, function (sources, done) {
        var targets = sources.filter(function(source) {
          return tools.matcher(config.match, source.absolutePath);
        });

        var promises = Promise.map(targets, function (source) {
          var module = tools.getModuleByFilepath(compilation, source.absolutePath);
          var context = createContext(compiler.inputFileSystem, module);
          return extractor.call(context, source, doxConfig);
        });

        Promise.all(promises).then(function() {
          done(null, sources);
        });
      });
    });
  }
});

module.exports = JSDocExtractor;
module.exports.defaultConfig = defaultConfig;