var extend = require('extend');
var Promise = require('bluebird');
var format = require('util').format;

/**
 * @typedef {Object} ChildCompilerOptions
 * @property {Object} options
 * @property {string} options.name Compiler name required, because it used as cache key in parent compilation.
 * @property {string} [options.context] By default taken from parent compilation.
 * @property {Object} [options.output] Output options. By default taken from parent compilation.
 * @see http://webpack.github.io/docs/configuration.html#output
 */

/**
 * @param {Compilation} compilation
 * @param {ChildCompilerOptions} options
 * @constructor
 */
function ChildCompiler(compilation, options) {
  options = options || {};
  var context = options.context || compilation.compiler.context;
  var outputOptions = extend(true, {}, compilation.outputOptions, options.output || {});
  var name = options.name;

  var compiler = compilation.createChildCompiler(name, outputOptions);
  compiler.context = context;

  // Cache
  compiler.plugin('compilation', function (compilation) {
    if (compilation.cache) {
      if (!compilation.cache[name]) {
        compilation.cache[name] = {};
      }
      compilation.cache = compilation.cache[name];
    }
  });

  this._compiler = compiler;
}

/**
 * TODO: Restore the parent compilation to the state like it was before the child compilation (html-webpack-plugin)
 * Taken from html-webpack-plugin
 * @see https://github.com/ampedandwired/html-webpack-plugin
 * @returns {Promise}
 */
ChildCompiler.prototype.run = function () {
  var compiler = this._compiler;

  return new Promise(function (resolve, reject) {
    compiler.runAsChild(function (err, entries, compilation) {
      var hasErrors = compilation.errors && compilation.errors.length;

      if (hasErrors) {
        var errorDetails = compilation.errors.map(function (error) {
          return error.message + (error.error ? ':\n' + error.error : '');
        }).join('\n');

        reject(new Error(
          format('Child compilation %s failed: %s', compiler.name, errorDetails)
        ));

      } else if (err) {
        reject(err);

      } else {
        resolve(compilation);
      }
    });
  });
};

module.exports = ChildCompiler;