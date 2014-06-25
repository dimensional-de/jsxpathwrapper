describe(
  "XpathWrapper",
  function() {
    it(
      "Create Xpath Wrapper",
      function(){
        var xpath = new XpathWrapper('<foo/>');
        expect(xpath instanceof XpathWrapper).toBeTruthy();
      }
    );
    it(
      "Select document element name, created from string",
      function(){
        var xpath = new XpathWrapper('<success/>');
        expect(xpath.evaluate('string(name(*))')).toEqual('success');
      }
    );
    it(
      "Select document element name, created from document",
      function(){
        var parser = new DOMParser();
        var dom = parser.parseFromString(
          '<success/>', 'application/xml'
        );
        var xpath = new XpathWrapper(dom);
        expect(xpath.evaluate('string(name(*))')).toEqual('success');
      }
    );
    it(
      "Select document element name, created from node",
      function(){
        var parser = new DOMParser();
        var dom = parser.parseFromString(
          '<root><success/></root>', 'application/xml'
        );
        var xpath = new XpathWrapper(dom.documentElement.firstChild);
        expect(xpath.evaluate('string(name(/*/*))')).toEqual('success');
      }
    );
    it(
      "Select string",
      function(){
        var xpath = new XpathWrapper('<string>success</string>');
        expect(xpath.evaluate('string(/string)')).toEqual('success');
      }
    );
    it(
      "Select number",
      function(){
        var xpath = new XpathWrapper('<number>42</number>');
        expect(xpath.evaluate('number(/number)')).toEqual(42);
      }
    );
    it(
      "Select boolean",
      function(){
        var xpath = new XpathWrapper('<boolean>42</boolean>');
        expect(xpath.evaluate('(/boolean = 42)')).toBeTruthy();
      }
    );
    it(
      "Select single node",
      function(){
        var parser = new DOMParser();
        var dom = parser.parseFromString(
          '<node/>', 'application/xml'
        );
        var xpath = new XpathWrapper(dom);
        expect(xpath.evaluate('/node', null, XPathResult.FIRST_ORDERED_NODE_TYPE))
          .toBe(dom.documentElement);
      }
    );
    it(
      "Select node list as array, read .toArray().length",
      function(){
        var xpath = new XpathWrapper('<items><one/><two/></items>');
        expect(xpath.evaluate('/items/*').toArray().length).toEqual(2);
      }
    );
    it(
      "Select node list, iterate with each()",
      function(){
        var xpath = new XpathWrapper('<items><one/><two/></items>');
        var actual = '';
        xpath.evaluate('/items/*').each(
          function (node) {
            actual += ',' + node.nodeName;
          }
        );
        expect(actual).toEqual(',one,two');
      }
    );
    it(
      "Namespaces: default element namespace",
      function(){
        var xpath = new XpathWrapper(
          '<items xmlns="urn:foo"><one/><two/></items>',
          {
            'foo' : 'urn:foo'
          }
        );
        expect(xpath.evaluate('name(/foo:items/foo:*[1])')).toEqual('one');
      }
    );
    it(
      "Namespaces: default element namespace, select node list",
      function(){
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
        expect(actual).toEqual(',one,two');
      }
    );
    it(
      "Namespaces: wrong default element namespace",
      function(){
        var xpath = new XpathWrapper(
          '<items xmlns="urn:foo"><one/><two/></items>',
          {
            'foo' : 'urn:bar'
          }
        );
        var actual = '';
        xpath.evaluate('/foo:items/foo:*').each(
          function (node) {
            actual += ',' + node.nodeName;
          }
        );
        expect(xpath.evaluate('name(/foo:items/foo:*[1])')).not.toEqual('one');
      }
    );
    it(
      "Namespaces: matching element namespace prefix",
      function(){
        var xpath = new XpathWrapper(
          '<foo:items xmlns:foo="urn:foo"><foo:one/><foo:two/></foo:items>',
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
        expect(xpath.evaluate('name(/foo:items/foo:*[2])')).toEqual('foo:two');
      }
    );
    it(
      "Namespaces: different element namespace prefix",
      function(){
        var xpath = new XpathWrapper(
          '<foo:items xmlns:foo="urn:foo"><foo:one/><foo:two/></foo:items>',
          {
            'bar' : 'urn:foo'
          }
        );
        expect(xpath.evaluate('name(/bar:items/bar:*[2])')).toEqual('foo:two');
      }
    );
    it(
      "Namespaces: reserved namespace prefix",
      function(){
        var xpath = new XpathWrapper(
          '<items><one xml:id="first"/><two xml:id="second"/></items>',
          {
            'bar' : 'urn:foo'
          }
        );
        expect(xpath.evaluate('name(//*[@xml:id = "second"])')).toEqual('two');
      }
    );
    it(
      "Namespaces:  resolved using callback",
      function(){
        var xpath = new XpathWrapper(
          '<items xmlns="urn:foo"><one/><two/></items>',
          function (prefix) {
            expect(prefix).toEqual('foo');
            return 'urn:foo';
          }
        );
        expect(xpath.evaluate('name(/foo:items/foo:*[1])')).toEqual('one');
      }
    );
    it(
      "Namespaces: ignoring namespaces using *",
      function(){
        var xpath = new XpathWrapper(
          '<items xmlns="urn:foo"><one/><two/></items>'
        );
        expect(xpath.evaluate('name(/*)')).toEqual('items');
      }
    );
    it(
      "Namespaces: name of first element from namespace 'urn:bar'",
      function(){
        var xpath = new XpathWrapper(
          '<items xmlns="urn:foo"><one xmlns="urn:bar"/><two/></items>',
          {
            foo: 'urn:foo',
            bar: 'urn:bar'
          }
        );
        expect(xpath.evaluate('name(//bar:*)')).toEqual('one');
      }
    );
  }
);