var matcher = require('webpack/lib/ModuleFilenameHelpers').matchObject;

/**
 * @param {Array<DocsPluginConfig>} configs
 * @param {string} filepath
 * @returns {DocsPluginConfig|null}
 */
function getConfigForFile(configs, filepath) {
  var cfg = configs.filter(function (config) {
    return matcher(config, filepath)
  });

  return cfg.length > 0 ? cfg[0] : null;
}

/**
 * @param {Array<string>} files
 * @param {Array<DocsPluginConfig>} configs
 * @returns {Array<Object>}
 */
function findFilesToProcess(files, configs) {
  var filesToProcess = [];
  files.forEach(function (filepath) {
    var config = getConfigForFile(configs, filepath);

    if (config)
      filesToProcess.push({path: filepath, config: config});
  });

  return filesToProcess;
}

module.exports = findFilesToProcess;