var path = require('path');
var highlight = require('highlight.js');
var beautify = require('js-beautify');

var HOOKS = require('../hooks');
var Plugin = require('./Plugin');
var flatten = require('../utils/find');
var ExampleFile = require('../data/ExampleFile');

var beautifyLangMap = {
  'js': 'js',
  'jsx': 'js',
  'html': 'html',
  'css': 'css',
  'scss': 'css'
};

var defaultOptions = {
  highlight: {
    themeCSS: require.resolve('highlight.js/styles/idea.css')
  },
  beautify: {
    indent_size: 2
  }
};

var HighlightCodePlugin = Plugin.create(defaultOptions);

HighlightCodePlugin.prototype.apply = function(compiler) {
  var options = this.options;

  compiler.plugin('compilation', function(compilation) {
    compilation.plugin(HOOKS.EXTRACTOR_DONE, function(result, done) {

      var files = flatten(result, function(item) {
        return item instanceof ExampleFile
      });

      files.forEach(function(file) {
        var source = file.source;
        var lang = file.type;

        if (options.beautify && lang in beautify) {
          source = beautify[lang](source, options.beautify);
        }

        file.highlighted = highlight.highlight(lang, source).value;
      });

      done(null, result);
    })
  })
};

module.exports = HighlightCodePlugin;