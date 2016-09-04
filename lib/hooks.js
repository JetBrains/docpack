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
   * Filter sources after extractor is done, e.g. skip sources without examples.
   * Callback should be invoked with array of filtered sources.
   * Compilation hook, async.
   *
   * @async
   * @param {Array<Source>} sources
   * @param {Function} callback
   */
  FILTER_EXTRACTED_RESULTS: 'docs-plugin-filter-extracted-results',

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
  PROCESS_EXTRACTED_RESULTS: 'docs-plugin-process-extracted-results',

  /**
   * Point to generate stuff on emit phase.
   *
   * @async
   * @param {Object} context
   * @param {Array<Source>} context.sources
   * @param {DocsPlugin} context.plugin
   * @param {Function} callback
   */
  EMIT_RESULTS: 'docs-plugin-emit-results'
};

module.exports = HOOKS;