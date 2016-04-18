function prefix() {
  return 'docs-plugin-';
}

/**
 * @typedef {Object} DocsPluginHooks
 */
var HOOKS = {
  CONFIGURE: prefix('configure'),
  SOURCE_CREATED: prefix('source-created'),

  EXTRACTOR_CONTEXT: prefix('extractor-context'),
  EXTRACTOR_DONE: prefix('docs-extracted'),

  TEMPLATE_CONTEXT: prefix('template-context'),
  TEMPLATE_RENDERED: prefix('template-rendered')
};

module.exports = HOOKS;