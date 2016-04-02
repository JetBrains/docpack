/**
 * @param {string} type html, js, css, scss, md, etc
 * @param {Object|string} content
 * @constructor
 */
function ExampleItem(type, content) {
  this.type = type;
  this.content = content;
  this.assets = [];
}

/**
 * @type {string}
 */
ExampleItem.prototype.content = null;

/**
 * @type {string} html, js, css, scss, md, etc
 */
ExampleItem.prototype.type = null;

/**
 * @type {Array<Asset>}
 */
ExampleItem.prototype.assets = null;

module.exports = ExampleItem;