/**
 * @param {Array<ExampleFile>} files
 * @param {Array<string>|Boolean} config List of types to compile or true|false
 * @returns {Array<ExampleFile>}
 */
module.exports = function (files, config) {
  return files.filter(function(file) {
    var emit = false;

    // Config overriding
    if (file.attrs && file.attrs.hasOwnProperty('emit')) {
      emit = file.attrs.emit;
    } else {
      emit = typeof config === 'boolean'
        ? config
        : config.indexOf(file.type) !== -1;
    }

    return emit;
  })
};
