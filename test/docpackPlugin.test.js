var DocpackPlugin = require('../lib/docpackPlugin');
var create = DocpackPlugin.create;

describe('Docpack Plugin', () => {
  it('should throw when required fields not specified', function () {
    (() => create()).should.throw();
    (() => create('qwe')).should.not.throw();
    (() => create('qwe', {})).should.not.throw();
    (() => create('qwe', () => {})).should.not.throw();
    (() => create('qwe', {}, () => {})).should.not.throw();
  });

  it('should be a factory to create plugins', function () {
    var name = 'tralala';
    var defaultConfig = {foo: 'bar'};

    var plugin = create(name, defaultConfig, () => {
    });
    var instance = plugin();

    instance.should.have.property('getName').that.is.a('function');
    instance.getName().should.equal(name);

    instance.should.have.property('config').and.be.eql(defaultConfig);
    instance.apply.should.be.a('function');
  });

  it('should allow to create instance via new operator & with function call', function () {
    var Plugin = create('qwe');

    new Plugin().should.be.instanceof(Plugin).and.instanceOf(DocpackPlugin);
    Plugin().should.be.instanceof(Plugin).and.instanceOf(DocpackPlugin);
  });
});