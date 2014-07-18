/**
 * Simplify XPath Handling
 *
 * Basic Usage:
 *
 *   var xpath = new XpathWrapper(source,  {atom : 'http://www.w3.org/2005/Atom'});
 *   for (var entry in xpath.evaluate('//atom:entry')) {
 *     console.log(
 *       xpath.evaluate('string(atom:title)', entry)
 *     );
 *   }
 *
 * @param {string|Document|Node} source
 * @param {Object|Function} [xmlns]
 * @constructor
 */
var XpathWrapper = function(source, xmlns) {

  /**
   * @param {XPathResult} result
   * @constructor
   */
  function XpathNodes(result) {
    this.result = result;
    this.items = [];
  }

  /**
   * @returns {Array}
   */
  XpathNodes.prototype.toArray = function() {
    var array = [];
    this.each(
      function() {
        array.push(this);
      }
    );
    return array;
  };

  /**
   * Get the first element in the result list, if here is any.
   *
   * @returns {Node|null}
   */
  XpathNodes.prototype.first = function() {
    if (this.items[0]) {
      return this.items[0];
    } else if (this.result && (item = this.result.iterateNext())) {
      this.items.push(item);
      return item;
    }
    return null;
  };

  /**
   * @param {Function} callback
   */
  XpathNodes.prototype.each = function(callback) {
    var index = 0, item;
    for (var i = 0; i < this.items.length; i++) {
      callback.call(this.items[i], index++);
    }
    if (this.result) {
      while (item = this.result.iterateNext()) {
        callback.call(item, index++);
      }
    }
    this.result = null;
  };

  /**
   * @param {Object|Function} xmlns
   * @constructor
   */
  var NamespaceResolver = function(xmlns) {
    this.reservedNamespaces = {
      "xml": "http://www.w3.org/XML/1998/namespace",
      "xmlns": "http://www.w3.org/2000/xmlns/"
    };
    this.xmlns = xmlns;
  }

  /**
   * Get the full namespace string for an prefix
   *
   * @param {string} prefix
   * @returns {string|null}
   */
  NamespaceResolver.prototype.lookupNamespaceURI = function(prefix) {
    if (prefix == '') {
      return null;
    }
    if (this.reservedNamespaces[prefix]) {
      return this.reservedNamespaces[prefix];
    }
    if (this.xmlns instanceof Function) {
      return this.xmlns(prefix);
    }
    return this.xmlns[prefix] || null;
  }
  /**
   * Evaluate an xpath expression. The return value depends on the
   * expression result. Scalar result types are returned a scalars.
   *
   * List result types return an {XpathNodes} object. It provides
   * an Iterator, each() and toArray().
   *
   * @param {string}  expression
   * @param {Node} [context]
   * @param {int} [resultType]
   * @returns {*}
   */
  this.evaluate = function (expression, context, resultType) {
    var result, that = this;
    resultType = resultType || XPathResult.ANY_TYPE;
    result = this.document.evaluate(
      expression,
      (context instanceof Node) ? context : this.context,
      new NamespaceResolver(this.xmlns),
      resultType || XPathResult.ANY_TYPE,
      null
    );
    switch (result.resultType) {
      case XPathResult.BOOLEAN_TYPE : return result.booleanValue;
      case XPathResult.NUMBER_TYPE : return result.numberValue;
      case XPathResult.STRING_TYPE : return result.stringValue;
      case XPathResult.FIRST_ORDERED_NODE_TYPE : return result.singleNodeValue;
      default :
        return new XpathNodes(result);
    }
  };

  this.xmlns = xmlns;
  var sourceType = typeof source;
  var dom;
  if (sourceType == 'string') {
    var parser = new DOMParser();
    this.document = this.context = dom = parser.parseFromString(source, 'application/xml');
  } else if (source instanceof Document) {
    this.document = this.context = dom = source;
  } else if (source instanceof Node) {
    this.document = dom = source.ownerDocument;
    this.context = source;
  } else {
    this.document = this.context = dom = document;
  }
  if (dom && !dom.evaluate) {
    if (typeof installDOM3XPathSupport != 'undefined') {
      installDOM3XPathSupport(dom, new XPathParser());
    }
  }
};

/**
 * If jQuery exists, add functions to it.
 */
if (typeof jQuery != 'undefined') {

  (function($) {

    /**
     * Return a wrapper object
     *
     * @param {string|Document|Node} source
     * @param {Object|Function} xmlns
     * @returns {XpathWrapper}
     */
    $.xpath = function(source, xmlns) {
      return new XpathWrapper(source, xmlns || jQuery.namespaces);
    };

    /**
     * Return an Xpath instance setting the first found element as
     * the context.
     *
     * If no element is selected, use the use the jQuery context.
     *
     * @param {Object} xmlns
     * @returns {XpathWrapper}
     */
    $.fn.xpath = function(xmlns) {
      return new XpathWrapper(
        (this.length > 0) ? this[0] : this.context,
        xmlns || jQuery.namespaces
      );
    };

    /**
     * Store the namespace on the jQuery object and execute the callback.
     *
     * @param {Object} xmlns
     * @param {Function} callback
     */
    $.xmlns = function(xmlns, callback) {
      $.namespaces = $.namespaces || {};
      xmlns = xmlns || {};
      for (var prefix in xmlns) {
        $.namespaces[prefix] = xmlns[prefix];
      }
      if (callback instanceof Function) {
        callback();
      }
    };

    $.fn.xmlns = $.xmlns;
  }(jQuery));
}