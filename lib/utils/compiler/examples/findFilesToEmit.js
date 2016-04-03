/**
 * @param {Array<ExampleFile>} files
 * @param {Array<string>|Boolean} config List of types to compile or true|false
 */
module.exports = function (files, config) {
  return files.filter(function(file) {
    var emit = false;

    // Config overriding
    if (file.hasOwnProperty('emit')) {
      emit = file.emit;
    } else {
      emit = typeof config === 'boolean'
        ? config
        : config.indexOf(file.type) !== -1;
    }

    return emit;
  })
};
