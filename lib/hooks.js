/**
 * @typedef {Object} DocsPluginHooks
 */
var HOOKS = {
  HOOK_CONTEXT: 'docs-plugin-hook-context',

  CONFIGURE: 'docs-plugin-configure',
  SOURCE_CREATED: 'docs-plugin-source-created',

  EXTRACTOR_CONTEXT: 'docs-plugin-extractor-context',
  EXTRACTOR_DONE: 'docs-plugin-extractor-done',

  SEPARATE_COMPILER_CREATED: 'docs-plugin-separate-compiler-created',
  SEPARATE_COMPILER_DONE: 'docs-plugin-separate-compiler-done',

  TEMPLATE_CONTEXT: 'docs-plugin-template-context',
  TEMPLATE_RENDERED: 'docs-plugin-template-rendered'
};

module.exports = HOOKS;