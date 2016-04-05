var emitFile = require('../utils/compilation/emitFile');

/**
 * @param {Object} [data]
 * @param {string} data.type File type: html, js, css, scss, md, etc
 * @param {string} data.path
 * @param {string} data.content
 * @param {Object} data.attrs
 * @param {Array<Asset>} data.assets
 * @constructor
 */
function ExampleFile(data) {
  var data = data || {};

  this.type = data.type || null;
  this.path = data.path || null;
  this.content = data.content || null;
  this.attrs = data.attrs || {};
  this.assets = [];
}

/**
 *  File type html, js, css, scss, md, etc
 *
 * @type {string}
 */
ExampleFile.prototype.type = null;

/**
 * @type {string}
 */
ExampleFile.prototype.path = null;

/**
 * @type {string}
 */
ExampleFile.prototype.content = null;

/**
 * @type {Array<Asset>}
 */
ExampleFile.prototype.assets = null;

/**
 * @type {Object}
 */
ExampleFile.prototype.attrs = null;

/**
 * @param {Compilation} compilation
 */
ExampleFile.prototype.emitAssets = function(compilation) {
  this.assets.forEach(function(asset) {
    emitFile(compilation, asset.path, asset.content);
  });
};

module.exports = ExampleFile;