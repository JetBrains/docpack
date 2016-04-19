var matcher = require('webpack/lib/ModuleFilenameHelpers').matchObject;

/**
 * @param {Object} config
 * @param {DocsPluginConfig} config.initial
 * @param {Array<DocsPluginConfig>} config.loaders
 * @param {string} [filepath]
 * @returns {DocsPluginConfig}
 */
function getConfig(config, filepath) {
  var cfg = config.initial;

  if (filepath) {
    cfg = config.loaders.filter(function (config) {
      return matcher(config, filepath)
    });

    cfg = cfg.length > 0 ? cfg[0] : null;
  }

  return cfg;
}

module.exports = getConfig;