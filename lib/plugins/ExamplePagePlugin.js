var Plugin = require('./Plugin');
var path = require('path');
var extend = require('extend');
var HOOKS = require('../hooks');
var TemplateCompiler = require('../modules/TemplateCompiler');
var interpolateName = require('../utils/interpolateName');
var emitFile = require('../utils/emitFile');
var Page = require('../data/Page');
var Example = require('../data/Example');
var flatten = require('../utils/find');
var format = require('util').format;
var slug = require('url-slug');

var defaultOptions = {
  template: null,
  filename: 'docs/[path][name].[ext]/examples/example-[example-index].html',
  context: {}
};

var ExamplePagePlugin = Plugin.create(defaultOptions);

ExamplePagePlugin.prototype.apply = function (compiler) {
  var plugin = this;
  var options = plugin.options;

  if (!this.options.template)
    throw new Error('Template not defined');

  compiler.plugin('compilation', function (compilation) {

    // Skip child compilations
    if (compilation.compiler.hasOwnProperty('parentCompilation'))
      return;

    compilation.plugin(HOOKS.EMIT_RESULTS, function(context, done) {
      var results = context.results;
      var promises = [];

      results.filter(function (result) {
        return result instanceof Page;
      })
      .forEach(function (page) {
        var source = page.source;

        flatten(page, function (item) {
          return item instanceof Example
        })
        .forEach(function (example, exampleIndex) {
          var compiler = new TemplateCompiler(compilation, options.template, true);

          promises.push(
            compiler.run().then(function (template) {
              var templateContext = extend(true, {}, options.context, {
                example: example.serialize()
              });

              var result = template(templateContext);
              var filenameReplacements = {
                '[example-index]': exampleIndex
              };

              if (example.attrs.name) {
                filenameReplacements['[example-name]'] = slug(example.attrs.name);
              }

              var filename = interpolateName(options.filename, {
                path: source.absolutePath,
                context: compilation.compiler.context,
                content: result,
                replacements: filenameReplacements
              });

              if (filename in compilation.assets) {
                var errorMsg = format(
                  'Error when creating example page for %s: %s already exist in assets.',
                  source.path,
                  filename
                );
                compilation.errors.push(errorMsg);
              }

              example.path = filename;

              emitFile(compilation, filename, result);
            })
          );

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

module.exports = ExamplePagePlugin;