/**
 * @typedef {Object} DocsPluginHooks
 */
var HOOKS = {
  /**
   * Point to configure plugin. E.g add extra entry points (addEntry plugin method).
   * Compiler hook, sync.
   *
   * @sync
   * @param {DocsPlugin} plugin
   */
  CONFIGURE: 'docs-plugin-configure',

  /**
   * Point to modify/extend source.
   * Compilation hook, async.
   *
   * @async
   * @param {Source} source
   * @param {Function} callback
   */
  SOURCE_CREATED: 'docs-plugin-source-created',

  FILTER_SOURCES: 'docs-plugin-filter-sources',

  FILTER_EXTRACTED_RESULTS: 'docs-plugin-filter-extracted-results',

  POSTPROCESS_EXTRACTED_RESULTS: 'docs-plugin-postprocess-extracted-result',

  EMIT_RESULTS: 'docs-plugin-emit-results',





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
   * @param {ExtractorResult} result
   * @param {Function} callback
   */
  EXTRACTOR_DONE: 'docs-plugin-extractor-done'

};

module.exports = HOOKS;