var Plugin = require('./Plugin');
var path = require('path');
var extend = require('extend');
var HOOKS = require('../hooks');
var TemplateCompiler = require('../modules/TemplateCompiler');
var interpolateName = require('../utils/interpolateName');
var emitFile = require('../utils/emitFile');
var DocPage = require('../data/Page');
var Promise = require('bluebird');


var defaultOptions = {
  template: null,
  filename: 'docs/[path][name].[ext]/index.html',
  context: {}
};

var PagePlugin = Plugin.create(defaultOptions);

PagePlugin.prototype.apply = function (compiler) {
  var plugin = this;

  if (!this.options.template)
    throw new Error('Template not defined');

  compiler.plugin('compilation', function (compilation) {

    // Skip child compilations
    if (compilation.compiler.hasOwnProperty('parentCompilation'))
      return;

    compilation.plugin(HOOKS.EMIT_RESULTS, function(context, done) {
      var results = context.results;

      var promises = results.filter(function (result) {
        return result instanceof DocPage;
      })
      .map(function(page) {
        var filename;

        if (page.attrs.url) {
          filename = page.attrs.url;
        } else {
          filename = interpolateName(plugin.options.filename, {
            path: page.source.absolutePath,
            context: compilation.compiler.context
          });
        }

        page.path = filename;

        return page;
      })
      .map(function (page) {
        var compiler = new TemplateCompiler(compilation, plugin.options.template, true);
        var templateContext = plugin.options.context;

        Object.keys(templateContext).forEach(function(key) {
          if (typeof templateContext[key] == 'function') {
            templateContext[key] = templateContext[key].call(null, context.plugin.docs);
          }
        });

        templateContext = extend(true, {}, templateContext, {
          page: page.serialize()
        });

        return compiler.run().then(function (template) {
          var result = template(templateContext);
          emitFile(compilation, page.path, result);
          return true;
        });
      });

      Promise.all(promises)
        .then(function () {
          done(null, context);
        })
        .catch(function (err) {
          done(err);
        });

    });
  });

};

module.exports = PagePlugin;