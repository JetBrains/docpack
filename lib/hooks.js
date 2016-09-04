/**
 * @typedef {Object} DocsPluginHooks
 */
var HOOKS = {
  /**
   * Plugin configuration, e.g add extra entry points.
   * Compiler hook, sync.
   *
   * @sync
   * @param {DocsPlugin} plugin
   */
  CONFIGURE: 'docs-plugin-configure',

  /**
   * Process sources after extractor.
   * Compilation hook, async.
   *
   * @async
   * @param {Object} context
   * @param {Array<Source>} context.sources
   * @param {DocsPlugin} context.plugin
   * @param {Function} callback
   */
  PROCESS: 'docs-plugin-process-extracted-results',

  /**
   * Point to generate stuff on emit phase.
   *
   * @async
   * @param {Object} context
   * @param {Array<Source>} context.sources
   * @param {DocsPlugin} context.plugin
   * @param {Function} callback
   */
  EMIT: 'docs-plugin-emit-results'
};

module.exports = HOOKS;