function Example(data) {
  this.items = data.items || [];
  this.name = data.name || null;
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