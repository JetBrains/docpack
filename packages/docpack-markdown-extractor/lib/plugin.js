var path = require('path');
var Docpack = require('docpack');
var Promise = require('bluebird');
var glob = require('glob');
var tools = require('webpack-toolkit');
var extractor = require('./extractor');

var defaultConfig = {
  match: /\.md$/,
  files: null,
  markdownOptions: {}
};

var MarkdownExtractor = Docpack.createPlugin({
  name: 'docpack-markdown-extractor',
  defaultConfig: defaultConfig,
  init: function() {
    var files = this.config.files;

    if (files === null) {
      this.emitError('`files` option should be provided');
    } else if (typeof files != 'string' && !Array.isArray(files)) {
      this.emitError('`files` can be a string (glob wildcard) or array of files');
    }
  }
});

module.exports = MarkdownExtractor;
module.exports.defaultConfig = defaultConfig;

MarkdownExtractor.prototype.configure = function(compiler) {
  var config = this.config;
  var files;

  if (typeof config.files == 'string') {
    files = glob.sync(path.resolve(compiler.context, config.files), {absolute: true});

    if (!files.length) {
      this.emitError('No markdown files found');
    }
  } else if (Array.isArray(config.files)) {
    files = config.files.map(function(filepath) {
      return path.resolve(compiler.context, filepath);
    });
  }

  this.files = files;

  var nullLoaderPath = require.resolve('null-loader');

  files.forEach(function(filepath) {
    var request = tools.stringifyLoaderRequest(nullLoaderPath, null, filepath);
    tools.addEntry(compiler, request, filepath);
  });
};

MarkdownExtractor.prototype.apply = function(compiler) {
  var plugin = this;
  var config = this.config;

  compiler.plugin(Docpack.HOOKS.INIT, this.configure.bind(this));

  compiler.plugin('compilation', function(compilation) {
    compilation.plugin('chunk-asset', function (chunk, filename) {
      var chunkName = chunk.name;
      if (plugin.files.indexOf(chunkName) != -1) {
        delete this.assets[filename];
      }
    });

    compilation.plugin(Docpack.HOOKS.EXTRACT, function(sources, done) {
      var targets = sources.filter(function(source) {
        return tools.matcher(config.match, source.absolutePath);
      });

      var promises = Promise.map(targets, function (source) {
        return extractor(source, config.markdownOptions);
      });

      Promise.all(promises).then(function(sources) {
        done(null, sources);
      });
    });
  })
};