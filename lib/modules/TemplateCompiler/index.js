var vm = require('vm');
var Promise = require('bluebird');
var extend = require('extend');
var format = require('util').format;

var ChildCompiler = require('../ChildCompiler');
var loaderPath = require('./loader').LOADER_PATH;
var generateLoaderRequestString = require('../../utils/loader/generateLoaderRequestString');

var NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin');
var NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');
var LoaderTargetPlugin = require('webpack/lib/LoaderTargetPlugin');
var LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin');
var SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');

/**
 * @param {string} templatePath Absolute path to template
 * @param {Compilation} compilation
 * @constructor
 */
function TemplateCompiler(templatePath, compilation) {
  ChildCompiler.call(this, compilation, {
    name: 'Template compiler: ' + templatePath
  });

  var compiler = this._compiler;
  var outputOptions = compiler.options.ouput;
  var templateRequest = generateLoaderRequestString(loaderPath, null, templatePath);

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

TemplateCompiler.prototype = Object.create(ChildCompiler.prototype);

TemplateCompiler.prototype.run = function() {
  var compiler = this;

  return ChildCompiler.prototype.run.call(this)
    .then(function(compilation) {
      var assetName = Object.keys(compilation.assets)[0];
      var source = compilation.assets[assetName].source();
      return compiler.evaluateCompilationResult(source);
    });
};

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