var path = require('path');
var Docpack = require('docpack');
var Page = require('docpack/lib/data/Page');
var slug = require('url-slug');
var utils = require('webpack-toolkit');
var isPlainObject = require('is-plain-object');
var ChildCompiler = utils.ChildCompiler;
var merge = require('merge-options');


/**
match
template
filename: String|Function
context: Object|Function

- match: надо чтобы принимал функцию, чтобы отфильтровать сорцы без примеров например???

- targets: позволяет выбрать другие объекты для которых нужно сгенерить страницы

- template: String

- filename: String|Function

- context: Object|Function

- recompileOnTemplateChange: Boolean (false by default)

- loader. Если у тебя уже есть твиг, но на клиентские шаблоны. По умолчанию, если найден лоадер,
 фоллбечный добавляться не будет. Но этой опцией можно перекрыть.
*/


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
  name: 'page-generator',
  defaultConfig: defaultConfig,
  init: function() {
    var config = this.config;

    if (!config.template) {
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
 * @type {String}
 */
PageGeneratorPlugin.prototype.hash = null;

/**
 * @type {Function}
 */
PageGeneratorPlugin.prototype.render = null;

/**
 * @param {Compiler} compiler
 */
PageGeneratorPlugin.prototype.configure = function(compiler) {
  var config = this.config;
  var tpl = config.template;
  var ext = path.extname(tpl);

  var resolveExtensions = compiler.options.resolve.extensions;
  var moduleOptions = compiler.options.module;
  var hasLoadersToProcessTemplate = resolveExtensions.indexOf(ext) >= 0 || utils.getMatchedLoaders(moduleOptions, tpl).length > 0;

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
      test: new RegExp('\.' + path.extname(tpl).substr(1) + '$'),
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
      if (plugin.render) {
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
          var hash = compilation.chunks[0].hash;
          var source = compilation.assets[assetFilename].source();
          var isShouldToRecompile = plugin.hash !== hash;

          delete compilation.assets[assetFilename];
          delete compilation.compiler.parentCompilation.assets[assetFilename];

          if (!isShouldToRecompile) {
            done(null, sources);
            return null;
          }

          plugin.hash = hash;

          return utils.compileVMScript(source)
            .then(function (render) {
              var docpack = compiler.options.plugins.filter(function(plugin) {
                return plugin instanceof Docpack
              })[0];
              plugin.render = render;
              done(null, sources.length == 0 ? docpack.sources : sources);
            });
        })
    });

    compilation.plugin(Docpack.HOOKS.GENERATE, function (sources, done) {
      plugin.generate(compilation, sources);
      done(null, sources);
    });
  });
};

PageGeneratorPlugin.prototype.generate = function(compilation, sources) {
  var plugin = this;
  var config = plugin.config;
  var compilerContext = compilation.compiler.context;
  var targets = sources;
  var filenameIsFunc = typeof config.filename == 'function';
  var contextIsFunc = typeof config.context == 'function';

  // Fetch targets
  if (config.match) {
    if (typeof config.match == 'function') {
      targets = config.match.call(compilation, sources);
    } else {
      targets = sources.filter(function(source) {
        return utils.matcher(config.match, source.absolutePath);
      });
    }
  }

  // Filename & generate content
  targets.forEach(function(target) {
    // Filename
    var filename;
    if ('attrs' in target && CONST.URL_ATTR_NAME in target.attrs) {
      // From attribute
      filename = target.attrs[CONST.URL_ATTR_NAME];

    } else if (filenameIsFunc) {
      // Returned from function
      filename = config.filename(target);

    } else {
      // String
      filename = config.filename;
    }

    // Generate page url
    var url = utils.interpolateName(filename, {
      path: target.absolutePath,
      context: context
    });

    // Template context
    var defaultContext = {
      publicPath: compilation.outputOptions.publicPath || '/',
      sources: targets,
      source: target
    };

    var context = contextIsFunc
      ? merge(defaultContext, config.context.call(compilation, targets))
      : merge(defaultContext, config.context);

    var content = plugin.render(context);

    target.page = new Page({url: url, content: content});

    if (url in compilation.assets) {
      var msg = url + ' page already exist in assets. Check `filename` option (and maybe make it more specific).';
      compilation.errors.push(msg);
    }

    utils.emitAsset(compilation, url, content);
  });
};