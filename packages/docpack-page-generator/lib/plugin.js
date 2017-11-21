var path = require('path');
var Docpack = require('docpack');
var merge = require('merge-options');
var tools = require('webpack-toolkit');
var Page = require('docpack/lib/data/Page');
var slug = require('url-slug');
var isPlainObject = require('is-plain-object');

var defaultConfig = {
  match: null,
  select: null,
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
  var tplAbsPath = path.resolve(tpl);

  var resolveExtensions = compiler.options.resolve.extensions;
  var moduleOptions = compiler.options.module;
  var hasLoadersToProcessTemplate = resolveExtensions.indexOf(tplExt) >= 0 || tools.getMatchedLoaders(moduleOptions, tplAbsPath).length > 0;

  var loadersProp = tools.getWebpackVersion(true) >= '2' ? 'rules' : 'loaders';

  if (!Array.isArray(moduleOptions[loadersProp])) {
    moduleOptions[loadersProp] = [];
  }

  // If loader specified explicitly, add it to config
  if (config.loader) {
    moduleOptions[loadersProp].push(config.loader);
  }
  else if (!hasLoadersToProcessTemplate) {
    // If no loaders to process the template - add fallback loader to config
    moduleOptions[loadersProp].push({
      test: new RegExp('\\.' + tplExt.substr(1) + '$'),
      loader: require.resolve(CONST.FALLBACK_LOADER_NAME),
      include: path.dirname(tplAbsPath)
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

      tools.TemplateCompiler(compilation, {
        template: template,
        name: compilerName,
        output: {
          filename: assetFilename
        }
      })
        .run()
        .then(function (fn) {
          plugin.renderer = fn;
          done(null, sources);
        });
    });

    compilation.plugin(Docpack.HOOKS.BEFORE_GENERATE, function (sources, done) {
      plugin.generate(compilation, sources);
      done(null, sources);
    });

    compilation.plugin(Docpack.HOOKS.GENERATE, function (sources, done) {
      // TODO: refactor this ugly caching
      plugin._assetsByChunkName = tools.getAssetsByChunkName(compilation);

      plugin.generatePagesContent(compilation, sources);
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
    targets = sources.filter(function (source) {
      return tools.matcher(config.match, source.absolutePath);
    });
  }

  if (typeof config.select == 'function') {
    targets = config.select(sources);
    if (!Array.isArray(targets)) {
      throw new Error('`select` should return an array');
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

  return tools.interpolateName(url, {
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
    assetsByChunkName: this._assetsByChunkName
  };

  var context;
  if (typeof config.context == 'function') {
    context = merge(defaultContext, config.context(targets, target));
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

  targets.forEach(function(source) {
    var url = plugin.generateURL(source, compilation.compiler.context);
    source.page = new Page({url: url});
  });
};

PageGeneratorPlugin.prototype.generatePagesContent = function(compilation, sources) {
  var plugin = this;
  var targets = this.select(sources).filter(function (source) {
    return 'page' in source;
  });

  targets
    .forEach(function(source) {
      var page = source.page;

      if (page.url in compilation.assets) {
        var msg = page.url + ' page already exist in assets. Check `url` option (and maybe make it more specific)';
        compilation.errors.push(new Error(msg));
        return;
      }

      page.content = plugin.render(compilation, source, targets);
      tools.emitAsset(compilation, page.url, page.content);
    });
};
