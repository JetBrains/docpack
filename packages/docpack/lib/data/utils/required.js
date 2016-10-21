/**
 * @param {Array<String>} props
 * @param {Object} data
 */
module.exports = function required(props, data) {
  if (!data) {
    throw new Error('Data not specified');
  }

  props.forEach(function(propName) {
    if (!data.hasOwnProperty(propName)) {
      throw new Error(propName + ' is required');
    }
  });
};