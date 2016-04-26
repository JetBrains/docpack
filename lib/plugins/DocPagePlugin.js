var Plugin = require('./Plugin');
var path = require('path');
var HOOKS = require('../hooks');
var TemplateCompiler = require('../modules/TemplateCompiler');
var interpolateName = require('../utils/interpolateName');
var emitFile = require('../utils/emitFile');


var defaultOptions = {
  template: null,
  filename: 'docs/[path][name].[ext]/index.html'
};

var DocPagePlugin = Plugin.create(defaultOptions);

DocPagePlugin.prototype.apply = function (compiler) {
  var plugin = this;

  if (!this.options.template)
    throw new Error('Template not defined');

  compiler.plugin('compilation', function (compilation) {

    // Skip child compilations
    if (compilation.compiler.hasOwnProperty('parentCompilation'))
      return;

    compilation.plugin(HOOKS.EXTRACTOR_DONE, function(page, done) {
      var source = page.source;
      var compiler = new TemplateCompiler(compilation, plugin.options.template);

      compiler.run().then(function (template) {
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

        done(null, page);
      });

    });
  });

};

module.exports = DocPagePlugin;