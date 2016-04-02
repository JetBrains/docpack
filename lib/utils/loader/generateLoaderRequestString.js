/**
 * @param {string} loaderPath Loader absolute path
 * @param {Object} [query]
 * @param {string} [resourcePath] Relative or absolute path to resource
 * @returns {string}
 */
function generateLoaderRequestString(loaderPath, query, resourcePath) {
  return [
    loaderPath,
    (query)
      ? '?' + JSON.stringify(query)
      : '',
    (resourcePath)
      ? '!' + resourcePath
      : ''
  ].join('');
}

exports = generateLoaderRequestString;