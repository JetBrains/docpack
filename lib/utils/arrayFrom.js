/**
 * @param arrayLike
 * @returns {Array.<T>}
 */
function arrayFrom(arrayLike) {
  return Array.prototype.slice.call(arrayLike, 0);
}

module.exports = arrayFrom;