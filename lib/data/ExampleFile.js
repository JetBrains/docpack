/**
 * @param {string} type html, js, css, scss, md, etc
 * @param {Object|string} content
 * @constructor
 */
function ExampleFile(type, content) {
  this.type = type || null;
  this.content = content || null;
  this.assets = [];
}

/**
 * @type {string}
 */
ExampleFile.prototype.content = null;

/**
 * @type {string} html, js, css, scss, md, etc
 */
ExampleFile.prototype.type = null;

/**
 * @type {Array<Asset>}
 */
ExampleFile.prototype.assets = null;

module.exports = ExampleFile;