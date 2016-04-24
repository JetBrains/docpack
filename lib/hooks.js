/**
 * @typedef {Object} DocsPluginHooks
 */
var HOOKS = {
  // Not implemented
  HOOK_CONTEXT: 'docs-plugin-hook-context',

  /**
   * Point to configure plugin. E.g add extra entry points (addEntry plugin method).
   * Compiler hook, sync.
   *
   * @sync
   * @callback
   * @param {DocsPlugin} plugin
   */
  CONFIGURE: 'docs-plugin-configure',

  /**
   * Point to modify/extend source.
   * Compilation hook, async.
   *
   * @async
   * @callback
   * @param {Object} context
   * @param {Source} context.source
   * @param {DocsPlugin} context.plugin
   * @param {Function} callback
   */
  SOURCE_CREATED: 'docs-plugin-source-created',

  // Not implemented
  EXTRACTOR_CONTEXT: 'docs-plugin-extractor-context',

  /**
   * Point to custom filtering extractor result.
   * Callback should be invoked with null to skip result.
   * Callback should be invoked with result to pass it to next step.
   * Compilation hook, async.
   *
   * @async
   * @callback
   * @param {ExtractorResult} result
   * @param {Function} callback
   */
  EXTRACTOR_FILTER_RESULT: 'docs-plugin-extractor-filter-result',

  /**
   * Point to process docs after they was extracted.
   *
   * @async
   * @callback
   * @param {Object} context
   * @param {ExtractorResult} context.result
   * @param {DocsPlugin} context.plugin
   * @param {Function} callback
   */
  EXTRACTOR_DONE: 'docs-plugin-extractor-done'
};

module.exports = HOOKS;