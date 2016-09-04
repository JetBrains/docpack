/**
 * @typedef {Object} DocpackHooks
 */
var HOOKS = {
  /**
   * Plugin configuration, e.g add extra entry points.
   * Compiler hook, sync.
   *
   * @sync
   * @param {Docpack} plugin
   */
  CONFIGURE: 'docpack-configure',

  /**
   * Process sources after extractor.
   * Compilation hook, async.
   *
   * @async
   * @param {Object} context
   * @param {Array<Source>} context.sources
   * @param {Docpack} context.plugin
   * @param {Function} callback
   */
  PROCESS: 'docpack-process',

  /**
   * Point to generate stuff on emit phase.
   *
   * @async
   * @param {Object} context
   * @param {Array<Source>} context.sources
   * @param {Docpack} context.plugin
   * @param {Function} callback
   */
  EMIT: 'docpack-emit'
};

module.exports = HOOKS;