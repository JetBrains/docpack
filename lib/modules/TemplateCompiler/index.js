var vm = require('vm');
var Promise = require('bluebird');
var extend = require('extend');
var format = require('util').format;

var ChildCompiler = require('../ChildCompiler');
var loaderPath = require('./loader').LOADER_PATH;
var stringifyLoaderRequest = require('webpack-toolkit/lib/stringifyLoaderRequest');

var NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin');
var NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');
var LoaderTargetPlugin = require('webpack/lib/LoaderTargetPlugin');
var LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin');
var SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');

var loaderOverridingRegexp = /^\-?\!{0,2}/;

/**
 * @param {Compilation} compilation
 * @param {string} templatePath Absolute path to template
 * @constructor
 */
function TemplateCompiler(compilation, templatePath) {
  ChildCompiler.call(this, compilation, {
    name: 'Template compiler: ' + templatePath,
    output: {
      filename: templatePath
    }
  });

  var compiler = this._compiler;
  var outputOptions = compiler.options.output;

  var loaderOverriding = templatePath.match(/^\-?\!{0,2}/);
  loaderOverriding = loaderOverriding[0] ? loaderOverriding[0] : '';
  var templateRequest;

  if (loaderOverriding) {
    templateRequest = loaderOverriding + stringifyLoaderRequest(loaderPath, null, templatePath.replace(loaderOverridingRegexp, ''));
  } else {
    templateRequest = stringifyLoaderRequest(loaderPath, null, templatePath);
  }

  this.parentCompilation = compilation;
  this.assetsBeforeCompilation = extend({}, compilation.assets[outputOptions.filename]);
  this.templatePath = templatePath;
  this.templateRequest = templateRequest;

  compiler.apply(
    new NodeTemplatePlugin(outputOptions),
    new NodeTargetPlugin(),
    new LibraryTemplatePlugin('WEBPACK_DOCS_PLUGIN_RESULT', 'var'),
    new SingleEntryPlugin(compiler.context, templateRequest),
    new LoaderTargetPlugin('node')
  );
}

TemplateCompiler.cache = {};

/**
 *
 * @param {string} templateRequest
 * @returns {boolean}
 */
TemplateCompiler.isCached = function(templateRequest) {
  return templateRequest in TemplateCompiler.cache;
};

/**
 * @param {string} templateRequest
 * @param {Object} data
 */
TemplateCompiler.saveToCache = function(templateRequest, data) {
  TemplateCompiler.cache[templateRequest] = data;
};

/**
 * @param {string} templateRequest
 * @returns {Function}
 */
TemplateCompiler.getFromCache = function(templateRequest) {
  return TemplateCompiler.cache[templateRequest];
};

TemplateCompiler.prototype = Object.create(ChildCompiler.prototype);

/**
 * @returns {Promise}
 */
TemplateCompiler.prototype.run = function() {
  var compiler = this;
  var _compiler = this._compiler;
  var outputFilename = _compiler.options.output.filename;
  var parentCompilation = this.parentCompilation;
  var assetsBeforeCompilation = this.assetsBeforeCompilation;
  var templateRequest = this.templateRequest;
  var isCached = TemplateCompiler.isCached(templateRequest);
  var cached;

  if (isCached) {
    cached = TemplateCompiler.getFromCache(templateRequest);
    return cached.promise.isPending()
      ? cached.promise
      : Promise.resolve(cached.template)
  } else {
    cached = {
      template: null,
      promise: null
    };

    cached.promise = ChildCompiler.prototype.run.call(this)
      .then(function (compilation) {

        // Restore the parent compilation to the state like it
        // was before the child compilation
        parentCompilation.assets[outputFilename] = assetsBeforeCompilation[outputFilename];

        if (assetsBeforeCompilation[outputFilename] === undefined) {
          // If it wasn't there - delete it
          delete parentCompilation.assets[outputFilename];
        }

        var assetName = Object.keys(compilation.assets)[0];
        var hash = compilation.chunks[0].hash;
        var source = compilation.assets[assetName].source();

        return compiler.evaluateCompilationResult(source);
      })
      .then(function(func) {
        cached.template = func;
        return func;
      });

    TemplateCompiler.saveToCache(templateRequest, cached);
    return cached.promise;
  }


};

/**
 * @param {string} source Template source
 * @returns {Promise}
 */
TemplateCompiler.prototype.evaluateCompilationResult = function (source) {
  if (!source)
    return Promise.reject('The child compilation didn\'t provide a result');

  // The LibraryTemplatePlugin stores the template result in a local variable.
  // To extract the result during the evaluation this part has to be removed.
  source = source.replace('var WEBPACK_DOCS_PLUGIN_RESULT =', '');

  var templatePath = this.templatePath;
  var vmContext = vm.createContext(extend(true, {WEBPACK_DOCS_PLUGIN: true, require: require}, global));
  var vmScript = new vm.Script(source, {filename: templatePath});

  // Evaluate code and cast to string
  var newSource;
  try {
    newSource = vmScript.runInContext(vmContext);
  } catch (e) {
    return Promise.reject(e);
  }

  return typeof newSource === 'string' || typeof newSource === 'function'
    ? Promise.resolve(newSource)
    : Promise.reject(format('The loader "%s" didn\'t return html', this.templateRequest));
};

module.exports = TemplateCompiler;