var path = require('path');
var extend = require('object-assign');
var loaderUtils = require('loader-utils');
var interpolateName = require('./utils/interpolate-name');
var getHash = require('./utils/get-hash');

var defaultConfig = {
  extractor: path.resolve(__dirname, 'default-extractor.js'),
  templatePath: path.resolve(__dirname, 'templates/doc-page.html')
};

module.exports = function (content) {
  var plugin = this[__dirname];
  if (plugin === undefined) {
    throw new Error(
      '"docs-plugin" loader is used without the corresponding plugin, ' +
      'refer to https://github.com/kisenka/webpack-docs-plugin for the usage example'
    );
  }

  var query = loaderUtils.parseQuery(this.query);
  var config = extend({}, defaultConfig, query);
  var contextPath = this.options.context;
  var resourcePath = this.resourcePath;
  var resourceRelativePath = path.relative(contextPath, resourcePath);

  var filepath = interpolateName(plugin.config.docFileName, {
    path: resourcePath,
    context: contextPath
  });

  // TODO: check if file exists
  var extractor = require(config.extractor);
  var file = extractor(content, {loader: this});

  if (file === null)
    return null;
  else if (Object.prototype.toString.call(file) !== '[object Object]')
    throw new Error('Extractor must return an object');

  file.path = filepath;
  file.sourcePath = resourceRelativePath;
  file.templatePath = config.templatePath;
  file.hash = getHash(content);

  plugin.files[resourceRelativePath] = file;

  return content;
};

module.exports.defaultConfig = defaultConfig;