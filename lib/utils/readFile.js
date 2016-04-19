var Promise = require('bluebird');

/**
 * @param {string} filepath
 * @param {CachedInputFileSystem} fs
 * @returns {Promise}
 */
function readFile(filepath, fs) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filepath, function (err, result) {
      err ? reject(err) : resolve(result);
    })
  })
}

module.exports = readFile;