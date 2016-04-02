var SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');

/**
 * @param {Object} compiler Webpack compiler instance
 * @param {string} entryName Entry name
 * @param {string} entryPath Relative path to entry
 * @param {string} [contextPath]
 */
function addSingleEntry(compiler, entryName, entryPath, contextPath) {
  var entry = new SingleEntryPlugin(contextPath || null, entryPath, entryName);
  compiler.apply(entry);
}

exports = addSingleEntry;