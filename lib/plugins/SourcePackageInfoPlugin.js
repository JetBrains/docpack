var path = require('path');
var Promise = require('bluebird');

var Plugin = require('./Plugin');
var HOOKS = require('../hooks');
var readFile = require('../utils/readFile');

// TODO: files cache
var fileCache = {};
var packageInfoCache = {};


var SourcePackageInfoPlugin = Plugin.create();

SourcePackageInfoPlugin.prototype.apply = function (compiler) {
  compiler.plugin('compilation', function (compilation) {
    compilation.plugin(HOOKS.SOURCES_CREATED, function (sources, done) {

      var promises = Promise.map(sources, function (source) {
        return findFile('package.json', {cwd: path.dirname(source.absolutePath)})
          .then(function (filepath) {
            if (filepath === null)
              return;

            return readFile(filepath, compiler.inputFileSystem);
          })
          .then(function (contents) {
            if (contents) {
              source.packageInfo = JSON.parse(contents);
            }
          });
      });

      Promise.all(promises).then(function () {
        done();
      });
    });
  })
};

module.exports = SourcePackageInfoPlugin;

/**
 * pathExists, splitPath, join and findFile is adapted from https://github.com/sindresorhus/find-up
 * @see https://github.com/sindresorhus/find-up
 */

/**
 * @param {string} filepath
 * @param {CachedInputFileSystem} fs
 * @returns {Promise}
 */
function pathExists(filepath, fs) {
  var fs = fs || require('fs');

  return new Promise(function (resolve) {
    fs.stat(filepath, function (err) {
      resolve(err instanceof Error == false);
    });
  });
}

function splitPath(x) {
  return path.resolve(x || '').split(path.sep);
}

function join(parts, filename) {
  return path.resolve(parts.join(path.sep) + path.sep, filename);
}

function findFile(filename, opts) {
  opts = opts || {};
  var fs = opts.fs || require('fs');

  var parts = splitPath(opts.cwd);

  return new Promise(function (resolve) {
    (function find() {
      var fp = join(parts, filename);

      pathExists(fp, fs).then(function (exists) {
        if (exists) {
          resolve(fp);
        } else if (parts.pop()) {
          find();
        } else {
          resolve(null);
        }
      });
    })();
  });
}