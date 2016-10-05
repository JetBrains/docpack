var path = require('path');
var Docpack = require('docpack');
var merge = require('merge-options');
var utils = require('webpack-toolkit');
var Page = require('docpack/lib/data/Page');
var slug = require('url-slug');
var isPlainObject = require('is-plain-object');
var ChildCompiler = utils.ChildCompiler;

var defaultConfig = {
  match: null,
  template: null,
  url: '[path][name].[ext].html',
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
module.exports.CONST = CONST;

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

  // If loader specified explicitly, add it to config
  if (config.loader) {
    moduleOptions.loaders.push(config.loader);
  }
  else if (!hasLoadersToProcessTemplate) {
    // If no loaders to process the template - add fallback loader to config
    moduleOptions.loaders.push({
      test: new RegExp('\\.' + tplExt.substr(1) + '$'),
      loader: require.resolve(CONST.FALLBACK_LOADER_NAME)
    });
  }
};

PageGeneratorPlugin.prototype.apply = function(compiler) {
  var plugin = this;
  var template = this.config.template;
  var compilerName = PageGeneratorPlugin.getCompilerNameFor(template);
  var assetFilename = CONST.TEMPLATE_ASSET_NAME;

  compiler.plugin(Docpack.HOOKS.INIT, this.configure.bind(this));

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
 * @param {Array<Source>} sources
 * @returns {Array<Source>}
 */
PageGeneratorPlugin.prototype.select = function(sources) {
  var config = this.config;
  var targets = sources;

  if (config.match) {
    if (typeof config.match == 'function') {
      targets = config.match(sources);
      if (!Array.isArray(targets)) {
        throw new Error('`match` should return array of objects');
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
 * @param {Source} target
 * @param {String} compilationContext Compilation context
 * @returns {String}
 */
PageGeneratorPlugin.prototype.generateURL = function(target, compilationContext) {
  var config = this.config;
  var url;
  var typeofURL = typeof config.url;

  if ('attrs' in target && CONST.URL_ATTR_NAME in target.attrs) {
    url = target.attrs[CONST.URL_ATTR_NAME];
  }
  else if (typeofURL == 'string') {
    url = config.url;
  } else if (typeofURL == 'function') {
    url = config.url(target);
    if (typeof url != 'string') {
      throw new Error('`url` function should return a string');
    }
  } else {
    throw new Error('`url` option can be string or function');
  }

  return utils.interpolateName(url, {
    path: target.absolutePath,
    context: compilationContext,
    content: target.content
  });
};

/**
 * @param {Compilation} compilation
 * @param {Source} target
 * @param {Array<Source>} targets
 * @returns {String}
 */
PageGeneratorPlugin.prototype.render = function(compilation, target, targets) {
  var config = this.config;

  var defaultContext = {
    source: target,
    sources: targets,
    publicPath: compilation.outputOptions.publicPath,
    assetsByChunkName: utils.getAssetsByChunkName(compilation)
  };

  var context;
  if (typeof config.context == 'function') {
    context = merge(defaultContext, config.context(targets));
    if (!isPlainObject(context)) {
      throw new Error('`context` function should return an object');
    }
  } else {
    context = merge(defaultContext, config.context);
  }

  return this.renderer(context);
};

/**
 * @param {Compilation} compilation
 * @param {Array<Source>} sources
 */
PageGeneratorPlugin.prototype.generate = function(compilation, sources) {
  var plugin = this;
  var targets = this.select(sources);

  targets.forEach(function(target) {
    var url = plugin.generateURL(target, compilation.compiler.context);
    var content = plugin.render(compilation, target, targets);

    target.page = new Page({url: url, content: content});

    if (url in compilation.assets) {
      var msg = url + ' page already exist in assets. Check `url` option (and maybe make it more specific)';
      throw new Error(msg);
    }

    utils.emitAsset(compilation, url, content);
  });
};