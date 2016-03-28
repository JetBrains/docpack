module.exports = function(content) {
  var matches = content.match(/\/\*\*/g);

  return {
    count: matches ? matches.length : 0
  };
};