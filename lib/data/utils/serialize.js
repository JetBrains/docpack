var extend = require('extend');

/**
 * @param {Object} obj
 * @returns {Object}
 */
function serializePrimitiveProps(obj) {
  var serialized = {};

  for (var propName in obj) {
    var property = obj[propName];
    var type = typeof property;
    var isPrimitive = /string|number|boolean|undefined/.test(type) || property === undefined;
    if (isPrimitive)
      serialized[propName] = property;
  }

  return serialized;
}

/**
 * @param {Object} obj
 * @param {Object} extra
 * @returns {Object}
 */
module.exports = function(obj, extra) {
  return extend(true,
    {},
    obj.attrs,
    serializePrimitiveProps(obj),
    extra || {}
  )
};