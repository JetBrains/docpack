function Example(data) {
  this.name = data.name || null;
  this.items = data.items || [];
}

/**
 * @type {Array<ExampleItem>}
 */
Example.prototype.items = null;

/**
 * @type {string}
 */
Example.prototype.name = null;

module.exports = Example;