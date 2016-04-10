/**
 * @param {string} filepath
 * @param config
 */
function isFileShouldBeProcessed(filepath, config) {
  var isMatchPattern = config.test.test(filepath);
  var isIncluded = true;

  if (config.include) {
    isIncluded = false;

    if (typeof config.include == 'string') {
      isIncluded = filepath.indexOf(config.include) == 0;
    }
    else if (Array.isArray(config.include)) {
      for (var i = 0, len = config.include.length; i < len; i++) {
        if (filepath.indexOf(config.include[i]) == 0) {
          isIncluded = true;
          break;
        }
      }
    } else {
      throw new Error('include should be string or array of strings');
    }
  }

  return isMatchPattern && isIncluded;
}

module.exports = isFileShouldBeProcessed;