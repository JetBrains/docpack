var Plugin = require('./Plugin');
var path = require('path');
var HOOKS = require('../hooks');
var TemplateCompiler = require('../modules/TemplateCompiler');
var interpolateName = require('../utils/interpolateName');
var emitFile = require('../utils/emitFile');
var DocPage = require('../data/Page');
var Promise = require('bluebird');


var defaultOptions = {
  template: null,
  filename: 'docs/[path][name].[ext]/index.html'
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
      .map(function (page) {
        var source = page.source;
        var compiler = new TemplateCompiler(compilation, plugin.options.template, true);

        return compiler.run().then(function (template) {
          var templateContext = {
            page: page.serialize()
          };

          var result = template(templateContext);
          var filename = interpolateName(plugin.options.filename, {
            path: source.absolutePath,
            context: compilation.compiler.context,
            content: result
          });

          emitFile(compilation, filename, result);
          return true;
        });
      });

      Promise.all(promises).then(function () {
        done();
      });

    });
  });

};

module.exports = PagePlugin;