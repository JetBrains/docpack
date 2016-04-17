function prefix() {
  return 'docs-plugin-';
}

/**
 * @typedef {Object} DocsPluginHooks
 */
var HOOKS = {
  CONFIGURE: prefix('configure'),

  EXTRACTOR_CONTEXT: prefix('extractor-context'),

  TEMPLATE_CONTEXT: prefix('template-context')
};

module.exports = HOOKS;