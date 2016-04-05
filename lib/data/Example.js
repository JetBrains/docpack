/**
 * @param {Object} [data]
 * @param {Array<ExampleFile>} [data.items]
 * @constructor
 */
function Example(data) {
  var data = data || {};
  this.name = data.name || null;
  this.path = data.path || null;
  this.files = data.files || [];
  this.content = data.content || null;
}

/**
 * @type {Array<ExampleFile>}
 */
Example.prototype.files = null;

/**
 * @type {string}
 */
Example.prototype.path = null;

/**
 * Rendered example content
 *
 * @type {string}
 */
Example.prototype.content = null;

module.exports = Example;