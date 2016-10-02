var path = require('path');
var Docpack = require('docpack');
var merge = require('merge-options');
var utils = require('webpack-toolkit');
var Page = require('docpack/lib/data/Page');
var slug = require('url-slug');
var ChildCompiler = utils.ChildCompiler;

var defaultConfig = {
  match: null,
  template: null,
  filename: '[path][name].[ext].html',
  context: {},
  recompileOnTemplateChange: false,
  loader: null
};

var CONST = {
  TEMPLATE_ASSET_NAME: 'docpack-page-generator-template',
  FALLBACK_LOADER_NAME: 'twig-loader',
  URL_ATTR_NAME: 'url'
};

/**
 * @constructor
 */
var PageGeneratorPlugin = Docpack.createPlugin({
  name: 'docpack-page-generator',
  defaultConfig: defaultConfig,
  init: function() {
    if (!this.config.template) {
      throw new Error('`template` is required');
    }
  }
});

module.exports = PageGeneratorPlugin;
module.exports.defaultConfig = defaultConfig;

/**
 * @static
 * @param {String} template
 * @returns {String}
 */
PageGeneratorPlugin.getCompilerNameFor = function(template) {
  return 'docpack-page-generator__' + slug(template);
};

/**
 * @type {Function}
 */
PageGeneratorPlugin.prototype.renderer = null;

/**
 * @param {Compiler} compiler
 */
PageGeneratorPlugin.prototype.configure = function(compiler) {
  var config = this.config;
  var tpl = config.template;
  var tplExt = path.extname(tpl);

  var resolveExtensions = compiler.options.resolve.extensions;
  var moduleOptions = compiler.options.module;
  var hasLoadersToProcessTemplate = resolveExtensions.indexOf(tplExt) >= 0 || utils.getMatchedLoaders(moduleOptions, tpl).length > 0;

  if (!Array.isArray(moduleOptions.loaders)) {
    moduleOptions.loaders = [];
  }

  // If loader specified explicitly, add them to config
  if (config.loader) {
    moduleOptions.loaders.push(config.loader);
  }
  else if (!hasLoadersToProcessTemplate) {
    // If no loaders to process the template - add fallback loader to config
    var fallbackLoaderPath;

    try {
       fallbackLoaderPath = require.resolve(CONST.FALLBACK_LOADER_NAME);
    } catch (e) {
      throw new Error('Fallback loader not found');
    }

    moduleOptions.loaders.push({
      test: new RegExp('\.' + tplExt.substr(1) + '$'),
      loader: fallbackLoaderPath
    });
  }
};

PageGeneratorPlugin.prototype.apply = function(compiler) {
  var plugin = this;
  var template = this.config.template;
  var compilerName = PageGeneratorPlugin.getCompilerNameFor(template);
  var assetFilename = CONST.TEMPLATE_ASSET_NAME;

  compiler.plugin('compilation', function(compilation) {
    compilation.plugin(Docpack.HOOKS.BEFORE_EXTRACT, function(sources, done) {
      if (plugin.renderer) {
        done(null, sources);
        return;
      }

      var templateCompiler = new ChildCompiler(compilation, {
        name: compilerName,
        output: {
          filename: assetFilename
        }
      });

      templateCompiler.addEntry(template, assetFilename);

      templateCompiler.run()
        .then(function (compilation) {
          var source = compilation.assets[assetFilename].source();

          delete compilation.assets[assetFilename];
          delete compilation.compiler.parentCompilation.assets[assetFilename];

          return utils.compileVMScript(source)
            .then(function (render) {
              plugin.renderer = render;
              done(null, sources);
            });
        })
    });

    compilation.plugin(Docpack.HOOKS.GENERATE, function (sources, done) {
      plugin.generate(compilation, sources);
      done(null, sources);
    });
  });
};

/**
 * @param {Compilation} compilation
 * @param {Array<Source>} sources
 * @returns {Array<Source>}
 * @private
 */
PageGeneratorPlugin.prototype.select = function(compilation, sources) {
  var config = this.config;
  var targets = sources;

  if (config.match) {
    if (typeof config.match == 'function') {
      targets = config.match.call(compilation, sources);
      if (!Array.isArray(targets)) {
        throw new Error('If `match` provided as function it should return array of objects');
      }

    } else {
      targets = sources.filter(function (source) {
        return utils.matcher(config.match, source.absolutePath);
      });
    }
  }

  return targets;
};

/**
 * @param {Compilation} compilation
 * @param {Source} target
 * @returns {String}
 */
PageGeneratorPlugin.prototype.generateURL = function(compilation, target) {
  var config = this.config;
  var filename;
  var typeofFilename = typeof config.filename;

  if ('attrs' in target && CONST.URL_ATTR_NAME in target.attrs) {
    filename = target.attrs[CONST.URL_ATTR_NAME];
  }
  else if (typeofFilename == 'string') {
    filename = config.filename;

  } else if (typeofFilename == 'function') {
    filename = config.filename.call(compilation, target);
    if (typeof filename != 'string') {
      throw new Error('`filename` function should return a string');
    }

  } else {
    throw new Error('`filename` option can be string or function');
  }

  return utils.interpolateName(filename, {
    path: target.absolutePath,
    context: compilation.compiler.context,
    content: target.content
  });
};

/**
 * @param {Compilation} compilation
 * @param {Array<Source>} targets
 * @param {Source} target
 * @returns {String}
 * @private
 */
PageGeneratorPlugin.prototype.render = function(compilation, targets, target) {
  var config = this.config;

  var defaultContext = {
    publicPath: compilation.outputOptions.publicPath || '/',
    sources: targets,
    source: target
  };

  var context = typeof config.context == 'function'
    ? merge(defaultContext, config.context.call(compilation, targets))
    : merge(defaultContext, config.context);

  return this.renderer(context);
};

/**
 * @param {Compilation} compilation
 * @param {Array<Source>} sources
 */
PageGeneratorPlugin.prototype.generate = function(compilation, sources) {
  var plugin = this;
  var targets = this.select(compilation, sources);

  // Filename & generate content
  targets.forEach(function(target) {
    var url = plugin.generateURL(compilation, target);
    var content = plugin.render(compilation, targets, target);

    target.page = new Page({url: url, content: content});

    if (url in compilation.assets) {
      var msg = url + ' page already exist in assets. Check `filename` option (and maybe make it more specific).';
      compilation.errors.push(msg);
    }

    utils.emitAsset(compilation, url, content);
  });
};