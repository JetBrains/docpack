var DocpackPlugin = require('../../lib/utils/DocpackPlugin');
var create = DocpackPlugin.create;

var UNNAMED = 'UNNAMED';

describe('Docpack Plugin', () => {
  it('should allow to create without any arguments', () => {
    create()().should.instanceOf(DocpackPlugin);
  });

  it('should throw when invalid type passed', () => {
    (() => create('qwe')).should.throw(TypeError);
    (() => create(1)).should.throw(TypeError);
    (() => create([])).should.throw(TypeError);
    (() => create(null)).should.throw(TypeError);

    (() => create()).should.not.throw();
    (() => create(function() {})).should.not.throw();
    (() => create({})).should.not.throw();
  });

  it('should allow to create instance via function call or in classic manner', () => {
    var Plugin = create();

    new Plugin().should.be.instanceOf(DocpackPlugin);
    create()().should.be.instanceOf(DocpackPlugin);
  });

  describe('Plugin name', () => {
    it('should set unnamed if no name passed', () => {
      create()()._name.should.be.equals(UNNAMED);
      create()().getName().should.be.equals(UNNAMED);
      create(function () {})()._name.should.be.equals(UNNAMED);
      create(function () {})().getName().should.be.equals(UNNAMED);
    });

    it('should properly set plugin name', () => {
      var pluginName = 'qwe';
      var plugin = create({name: pluginName})();
      plugin._name.should.be.equal(pluginName);
      plugin.getName().should.be.equal(pluginName);
    });
  });

  describe('Plugin config', () => {
    it('should use default config', () => {
      var defaultConfig = {foo: 'bar'};
      var plugin = create({defaultConfig: defaultConfig})();
      plugin.config.should.be.eql(defaultConfig);
    });

    it('should allow to override default config', () => {
      var defaultConfig = {foo: 'bar'};
      var plugin = create({defaultConfig: defaultConfig});
      plugin({foo: 'zzz'}).config['foo'].should.be.equal('zzz');
    });
  });

  describe('Plugin initialization', () => {
    it('should call `init` after constructor call', () => {
      var c = 1;
      create({init: (i) => c += i})(10);
      c.should.be.equal(11);
    });

    it('should pass proper context in init', () => {
      var config = {foo: 'bar'};

      create({init: function(cfg) {
        this.should.be.instanceOf(DocpackPlugin);
        this.config.should.be.eql(config);
      }})(config);
    });
  });

  describe('Plugin apply', () => {
    it('should allow to create instance via function arg or with object prop', () => {
      var pluginBody = function () {};
      var plugin;

      plugin = create(pluginBody);
      plugin().apply.should.be.a('function').and.equal(pluginBody);

      plugin = create({apply: pluginBody});
      plugin().apply.should.be.a('function').and.equal(pluginBody)
    });
  });
});