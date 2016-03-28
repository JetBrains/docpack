var getHashDigest = require('loader-utils').getHashDigest;

module.exports = function (content) {
  return getHashDigest(content);
};