/**
 * @param {Object} [data]
 * @param {string} [data.name]
 * @param {Array<ExampleFile>} [data.items]
 * @constructor
 */
function Example(data) {
  this.name = data.name || null;
  this.files = data.files || [];
}

/**
 * @type {Array<ExampleFile>}
 */
Example.prototype.files = null;

/**
 * @type {string}
 */
Example.prototype.name = null;

module.exports = Example;