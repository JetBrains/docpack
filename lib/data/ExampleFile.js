var serialize = require('./utils/serialize');

/**
 * @param {Object} [data]
 * @constructor
 */
function ExampleFile(data) {
  var data = data || {};

  this.id = data.id || null;
  this.type = data.type || null;
  this.source = data.source || null;
  this.context = data.context || null;
  this.attrs = data.attrs || {};
  this.path = data.path || null;
  this.assets = [];
}

/** @type {string} */
ExampleFile.prototype.id = null;

/**
 * File type html, js, css, scss, md, etc
 *
 * @type {string}
 */
ExampleFile.prototype.type = null;

/**
 * @type {string}
 */
ExampleFile.prototype.source = null;

/**
 * @type {string}
 */
ExampleFile.prototype.compiledSource = null;

/**
 * @type {string} Context path
 */
ExampleFile.prototype.context = null;

/**
 * @type {Object}
 */
ExampleFile.prototype.attrs = null;

/**
 * @type {string}
 */
ExampleFile.prototype.path = null;

/**
 * @type {Array<Asset>}
 */
ExampleFile.prototype.assets = null;

/**
 * @type {Object}
 * @prop {boolean} compile
 * @prop {boolean} webpack Alias of compile
 * @prop {boolean} emit
 * @prop {boolean} render
 */
ExampleFile.prototype.attrs = null;

/**
 * @returns {Object}
 */
ExampleFile.prototype.serialize = function () {
  return serialize(this, {
    assets: this.assets.map(function(asset) { return asset.serialize() })
  });
};

module.exports = ExampleFile;