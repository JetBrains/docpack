var path = require('path');
var docpack = require('docpack');
var Page = require('docpack/lib/data/Page');
var utils = require('webpack-toolkit');
var slug = require('url-slug');
var Promise = require('bluebird');
var format = require('util').format;

var defaultConfig = {
  template: null,
  filename: '[path][name].[ext]-docs.html',
  context: {}
};

var PageGeneratorPlugin = docpack.createPlugin({
  name: 'page-generator',
  defaultConfig: defaultConfig,
  init: function(config) {
    if (!config || !config.template) {
      throw new Error('Template should be provided');
    }
  }
});

module.exports = PageGeneratorPlugin;
module.exports.defaultConfig = defaultConfig;

/**
 * @param {Compilation} compilation
 * @returns {String|null}
 * @private
 */
PageGeneratorPlugin.prototype._getTemplateAssetFilename = function(compilation) {
  var template = this.config.template;
  var templateEntry = compilation.entries.filter(function (entry) {
    return entry.rawRequest === template;
  })[0];

  return templateEntry ? templateEntry.chunks[0].files[0] : null;
};

/**
 * @param {Compiler} compiler
 * @returns {Boolean}
 * @private
 */
PageGeneratorPlugin.prototype._isShouldAddFallbackLoader = function(compiler) {
  var template = this.config.template;
  var ext = path.extname(template);

  if (ext == '.js') {
    return false;
  }

  var moduleOptions = compiler.options.module;

  var loaders = [].concat(
    moduleOptions.preLoaders  || [],
    moduleOptions.loaders     || [],
    moduleOptions.postLoaders || []
  );

  var loadersToProcessTemplate = loaders.filter(function (loaderCfg) {
    return utils.matcher(loaderCfg, template);
  });

  return loadersToProcessTemplate.length == 0;
};

/**
 * @param {Compilation} compilation
 * @returns {Boolean}
 * @private
 */
PageGeneratorPlugin.prototype._isShouldRecompileTemplate = function(compilation) {
  var affected = utils.getAffectedFiles(compilation);
  return affected.indexOf(this.templateAbsolutePath) >= 0;
};

/**
 * @param {Compiler} compiler
 * @private
 */
PageGeneratorPlugin.prototype._configureCompiler = function(compiler) {
  var template = this.config.template;

  // Add entry point
  utils.addEntry(compiler, template, this.entryName);

  // Add fallback loader
  if (this._isShouldAddFallbackLoader(compiler)) {
    var moduleOptions = compiler.options.module;

    if (!Array.isArray(moduleOptions.loaders)) {
      moduleOptions.loaders = [];
    }

    moduleOptions.loaders.push({
      test: new RegExp('\.' + path.extname(template).substr(1) + '$'),
      loader: require.resolve('twig-loader')
    });
  }
};

PageGeneratorPlugin.prototype.apply = function (compiler) {
  var plugin = this;
  var template = this.config.template;

  plugin.templateAbsolutePath = path.resolve(compiler.context, template);
  plugin.entryName = '__docpack-page-generator-template__' + slug(template);

  compiler.plugin(docpack.HOOKS.INIT, plugin._configureCompiler.bind(plugin, compiler));

  compiler.plugin('compilation', function (compilation) {

    compilation.plugin(docpack.HOOKS.GENERATE, function (sources, done) {
      var templateAssetFilename = plugin._getTemplateAssetFilename(compilation);
      var templateSource = compilation.assets[templateAssetFilename].source();
      delete compilation.assets[templateAssetFilename];

      Promise.resolve(sources)
        .then(function(sources) {
          var isShouldRecompile = plugin._isShouldRecompileTemplate(compilation);

          if (!isShouldRecompile) {
            return sources;
          }

          return utils.compileVMScript(templateSource)
            .then(function (result) {
              var resultType = typeof result;

              if (resultType != 'function') {
                var msg = format(
                  '%s should return a function after being processed by loader, but currently %s is returned',
                  template,
                  resultType
                );
                return Promise.reject(new Error(msg));
              }

              return result;
            })
            .then(function (result) {
              plugin.render = result;
              return sources;
            });
        })
        .then(function(sources) {
          plugin.generate(compilation, sources);
          done(null, sources);
        });
    });
  });
};

/**
 * @param {Compilation} compilation
 * @param {Array<Source>} sources
 */
PageGeneratorPlugin.prototype.generate = function(compilation, sources) {
  var plugin = this;
  var context = compilation.compiler.context;

  sources.forEach(function(source) {
    var content = plugin.render({source: source});

    if (typeof content != 'string' || content instanceof Buffer) {
      var msg = format(
        '%s template function should return string or buffer, but currently %s is returned',
        plugin.config.template,
        typeof content
      );
      throw new Error(msg);
    }

    var url = utils.interpolateName(plugin.config.filename, {
      path: source.absolutePath,
      context: context
    });

    source.page = new Page({url: url, content: content});

    utils.emitAsset(compilation, url, content);
  });
};