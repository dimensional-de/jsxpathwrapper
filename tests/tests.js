QUnit.test(
  "Create Xpath Wrapper",
  function( assert ) {
    var xpath = new XpathWrapper('<foo/>');
    assert.ok(xpath instanceof XpathWrapper);
  }
);

QUnit.test(
  "Select document element name, created from string",
  function( assert ) {
    var xpath = new XpathWrapper('<success/>');
    assert.equal(
      xpath.evaluate('string(name(*))'),
      'success'
    );
  }
);

QUnit.test(
  "Select document element name, created from document",
  function( assert ) {
    var parser = new DOMParser();
    var dom = parser.parseFromString(
      '<success/>', 'application/xml'
    );
    var xpath = new XpathWrapper(dom);
    assert.equal(
      xpath.evaluate('string(name(*))'),
      'success'
    );
  }
);

QUnit.test(
  "Select document element name, created from node",
  function( assert ) {
    var parser = new DOMParser();
    var dom = parser.parseFromString(
      '<root><success/></root>', 'application/xml'
    );
    var xpath = new XpathWrapper(dom.documentElement.firstChild);
    assert.equal(
      xpath.evaluate('string(name(.))'),
      'success'
    );
  }
);

QUnit.test(
  "Select string",
  function( assert ) {
    var xpath = new XpathWrapper('<string>success</string>');
    assert.strictEqual(
      xpath.evaluate('string(/string)'),
      'success'
    );
  }
);

QUnit.test(
  "Select number",
  function( assert ) {
    var xpath = new XpathWrapper('<number>42</number>');
    assert.strictEqual(
      xpath.evaluate('number(/number)'),
      42
    );
  }
);

QUnit.test(
  "Select number",
  function( assert ) {
    var xpath = new XpathWrapper('<boolean>42</boolean>');
    assert.strictEqual(
      xpath.evaluate('(/boolean = 42)'),
      true
    );
  }
);

QUnit.test(
  "Select single node",
  function( assert ) {
    var parser = new DOMParser();
    var dom = parser.parseFromString(
      '<node/>', 'application/xml'
    );
    var xpath = new XpathWrapper(dom);
    assert.strictEqual(
      xpath.evaluate('/node', null, XPathResult.FIRST_ORDERED_NODE_TYPE),
      dom.documentElement
    );
  }
);

QUnit.test(
  "Select node list as array, read .toArray().length",
  function( assert ) {
    var xpath = new XpathWrapper('<items><one/><two/></items>');
    assert.equal(
      xpath.evaluate('/items/*').toArray().length,
      2
    );
  }
);

QUnit.test(
  "Select node list, iterate with each()",
  function( assert ) {
    var xpath = new XpathWrapper('<items><one/><two/></items>');
    var actual = '';
    xpath.evaluate('/items/*').each(
      function (node) {
        actual += ',' + node.nodeName;
      }
    );
    assert.equal(
      actual,
      ',one,two'
    );
  }
);

QUnit.test(
  "Namespaces: default element namespace",
  function( assert ) {
    var xpath = new XpathWrapper(
      '<items xmlns="urn:foo"><one/><two/></items>',
      {
        'foo' : 'urn:foo'
      }
    );
    assert.equal(
      xpath.evaluate('name(/foo:items/foo:*[1])'),
      'one'
    );
  }
);

QUnit.test(
  "Namespaces: default element namespace, select node list",
  function( assert ) {
    var xpath = new XpathWrapper(
      '<items xmlns="urn:foo"><one/><two/></items>',
      {
        'foo' : 'urn:foo'
      }
    );
    var actual = '';
    xpath.evaluate('/foo:items/foo:*').each(
      function (node) {
        actual += ',' + node.nodeName;
      }
    );
    assert.equal(
      actual,
      ',one,two'
    );
  }
);

QUnit.test(
  "Namespaces: wrong default element namespace",
  function( assert ) {
    var xpath = new XpathWrapper(
      '<items xmlns="urn-bar"><one/><two/></items>',
      {
        'foo' : 'urn-foo'
      }
    );
    assert.notEqual(
      xpath.evaluate('name(/foo:items/foo:*[1])'),
      'one'
    );
  }
);

QUnit.test(
  "Namespaces: matching element namespace prefix",
  function( assert ) {
    var xpath = new XpathWrapper(
      '<foo:items xmlns:foo="urn:foo"><foo:one/><foo:two/></foo:items>',
      {
        'foo' : 'urn:foo'
      }
    );
    assert.equal(
      xpath.evaluate('name(/foo:items/foo:*[2])'),
      'foo:two'
    );
  }
);

QUnit.test(
  "Namespaces: different element namespace prefix",
  function( assert ) {
    var xpath = new XpathWrapper(
      '<foo:items xmlns:foo="urn:foo"><foo:one/><foo:two/></foo:items>',
      {
        'bar' : 'urn:foo'
      }
    );
    assert.equal(
      xpath.evaluate('name(/bar:items/bar:*[2])'),
      'foo:two'
    );
  }
);

QUnit.test(
  "Namespaces: reserved namespace prefix",
  function( assert ) {
    var xpath = new XpathWrapper(
      '<items><one xml:id="first"/><two xml:id="second"/></items>',
      {
        'bar' : 'urn:foo'
      }
    );
    assert.equal(
      xpath.evaluate('name(//*[@xml:id = "second"])'),
      'two'
    );
  }
);

QUnit.test(
  "Namespaces: resolved using callback",
  function( assert ) {
    var xpath = new XpathWrapper(
      '<items xmlns="urn:foo"><one/><two/></items>',
      function (prefix) {
        assert.equal(prefix, 'foo');
        return 'urn:foo';
      }
    );
    assert.equal(
      xpath.evaluate('name(/foo:items/foo:*[1])'),
      'one'
    );
  }
);

QUnit.test(
  "Namespaces: ignoring namespaces using *",
  function( assert ) {
    var xpath = new XpathWrapper(
      '<items xmlns="urn:foo"><one/><two/></items>',
      function (prefix) {
        console.log(prefix);
        assert.equal(prefix, 'foo');
        return 'urn:foo';
      }
    );
    assert.equal(
      xpath.evaluate('name(/*/*[1])'),
      'one'
    );
  }
);