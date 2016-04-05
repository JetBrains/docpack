module.exports = function (filepath) {
  return filepath.substr(filepath.lastIndexOf('.') + 1)
};