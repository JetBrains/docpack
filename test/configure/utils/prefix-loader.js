module.exports = function(source) {
  this.cacheable && this.cacheable();
  var prefix = this.query.substr(this.query.lastIndexOf('?') + 1);

  return prefix + source;
};