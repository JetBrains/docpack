var traverse = require('traverse');

/**
 * Flatten an object into a flat array.
 * Works only with complex objects and ignore leaf nodes.
 *
 * @param {Object|Array} data
 * @param {Function} filter
 * @returns {Array<*>}
 */
function flatten(data, filter) {
  return traverse(data).reduce(function (prev, item) {
    if (!this.isLeaf && filter.call(this, item))
      prev.push(item);

    return prev;
  }, []);
}

module.exports = flatten;