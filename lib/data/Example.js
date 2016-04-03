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
 * @type {string}
 */
Example.prototype.path = null;

module.exports = Example;