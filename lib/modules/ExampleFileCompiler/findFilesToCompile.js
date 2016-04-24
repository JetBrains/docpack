/**
 * @param {Array<ExampleFile>} files
 * @param {Array<string>|Boolean} config List of types to compile or true|false
 * @param {Object} [loaders]
 * TODO: implement loaders matching
 */
module.exports = function (files, config, loaders) {
  return files.filter(function(file) {
    var compile = false;

    // Config overriding
    // TODO: remove wepback property checking
    if (file.attrs && file.attrs.hasOwnProperty('compile')) {
      compile = file.attrs.compile;
    } else {
      compile = typeof config === 'boolean'
        ? config
        : config.indexOf(file.type) !== -1;
    }

    return compile;
  })
};
