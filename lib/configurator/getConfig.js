var matcher = require('webpack/lib/ModuleFilenameHelpers').matchObject;

/**
 * @param {Object} config
 * @param {DocpackConfig} config.initial
 * @param {Array<DocpackConfig>} config.loaders
 * @param {string} [filepath]
 * @returns {DocpackConfig}
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