var Plugin = require('./Plugin');
var path = require('path');
var HOOKS = require('../hooks');
var TemplateCompiler = require('../modules/TemplateCompiler');
var interpolateName = require('../utils/interpolateName');
var emitFile = require('../compilation/emitFile');
var Example = require('../data/Example');
var flatten = require('../utils/flatten');


var defaultOptions = {
  template: null,
  filename: 'docs/[path][name].[ext]/examples/[example-index].html'
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

    compilation.plugin(HOOKS.EXTRACTOR_DONE, function(context, done) {
      var page = context.result;
      var source = page.source;

      var examples = flatten(page, function (item) { return item instanceof Example });

      if (examples.length == 0)
        done();

      var promises = [];

      examples.forEach(function (example, exampleIndex) {
        var compiler = new TemplateCompiler(compilation, plugin.options.template);

        promises.push(
          compiler.run().then(function (template) {
            var templateContext = {
              example: example.serialize()
            };

            var result = template(templateContext);
            var filename = interpolateName(plugin.options.filename, {
              path: source.absolutePath,
              context: compilation.compiler.context,
              content: result,
              replacements: {
                '[example-index]': exampleIndex
              }
            });

            emitFile(compilation, filename, result);
          })
        );
      });

      Promise.all(promises)
        .then(function () {
          done(null, context);
        });

    });
  });

};

module.exports = DocPagePlugin;