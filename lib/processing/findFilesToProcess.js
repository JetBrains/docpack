var getConfig = require('../configurator/getConfig');

/**
 * @param {Array<string>} files
 * @param {Array<DocsPluginConfig>} configs
 * @returns {Array<string>}
 */
function findFilesToProcess(files, configs) {
  var filesToProcess = [];

  files.forEach(function (filepath) {
    var config = getConfig(configs, filepath);

    if (config)
      filesToProcess.push(filepath);
  });

  return filesToProcess;
}

module.exports = findFilesToProcess;