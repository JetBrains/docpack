/**
 * @typedef {Object} DocsPluginHooks
 */
var HOOKS = {
  // Not implemented
  HOOK_CONTEXT: 'docs-plugin-hook-context',

  CONFIGURE: 'docs-plugin-configure', // Sync
  SOURCE_CREATED: 'docs-plugin-source-created',

  // Not implemented
  EXTRACTOR_CONTEXT: 'docs-plugin-extractor-context',
  EXTRACTOR_FILTER_RESULT: 'docs-plugin-extractor-filter-result',
  EXTRACTOR_DONE: 'docs-plugin-extractor-done'
};

module.exports = HOOKS;