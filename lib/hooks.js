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

  /**
   * Point to custom sources filter.
   * Callback should be invoked with null to skip source.
   * Callback should be invoked with source to pass it to next step.
   * Compilation hook, async.
   *
   * @async
   * @param {Array<Source>} sources
   * @param {Function} callback
   */
  FILTER_SOURCES: 'docs-plugin-filter-sources',

  /**
   * Point to custom filtering extractor results.
   * Callback should be invoked with null to skip result.
   * Callback should be invoked with result to pass it to next step.
   * Compilation hook, async.
   *
   * @async
   * @param {Array<ExtractorResult>} results
   * @param {Function} callback
   */
  FILTER_EXTRACTED_RESULTS: 'docs-plugin-filter-extracted-results',

  /**
   * Point to process docs after they was extracted.
   *
   * @async
   * @param {Object} context
   * @param {Array<ExtractorResult>} context.results
   * @param {DocsPlugin} context.plugin
   * @param {Function} callback
   */
  POSTPROCESS_EXTRACTED_RESULTS: 'docs-plugin-postprocess-extracted-results',

  /**
   * Point to generate stuff on emit phase.
   *
   * @async
   * @param {Object} context
   * @param {Array<ExtractorResult>} context.results
   * @param {DocsPlugin} context.plugin
   * @param {Function} callback
   */
  EMIT_RESULTS: 'docs-plugin-emit-results'
};

module.exports = HOOKS;