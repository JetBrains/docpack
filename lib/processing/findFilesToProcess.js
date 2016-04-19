var getConfig = require('../configuration/getConfig');

/**
 * @param {Array<string>} files
 * @param {Array<DocsPluginConfig>} configs
 * @returns {Array<Object>}
 */
function findFilesToProcess(files, configs) {
  var filesToProcess = [];
  files.forEach(function (filepath) {
    var config = getConfig(configs, filepath);

    if (config)
      filesToProcess.push({path: filepath, config: config});
  });

  return filesToProcess;
}

module.exports = findFilesToProcess;