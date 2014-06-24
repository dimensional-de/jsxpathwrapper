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
 * @param {Object|Function} xmlns
 * @constructor
 */
var XpathWrapper = function(source, xmlns) {

  this.reservedNamespaces = {
    "xml": "http://www.w3.org/XML/1998/namespace",
    "xmlns": "http://www.w3.org/2000/xmlns/"
  };

  /**
   * @param {XPathResult} result
   * @constructor
   */
  function XpathNodesIterator(result) {
    this.result = result;
    this.current = null;
  }

  /**
   * Iterator next method
   * @returns {Node}
   */
  XpathNodesIterator.prototype.next = function() {
    this.current = this.result.iterateNext();
    if (this.current) {
      return this.current;
    } else {
      throw StopIteration;
    }
  };

  /**
   * @param {XPathResult} result
   * @constructor
   */
  function XpathNodes(result) {
    this.result = result;
  }
  XpathNodes.prototype.__iterator__ = function() {
    return new XpathNodesIterator(this.result);
  };

  /**
   * @returns {Array}
   */
  XpathNodes.prototype.toArray = function() {
    var array = [];
    this.each(
      function(item) {
        array.push(item);
      }
    );
    return array;
  };

  /**
   * @param {Function} callback
   */
  XpathNodes.prototype.each = function(callback) {
    var index = 0, item;
    try {
      var iterator = this.__iterator__();
      while (item = iterator.next()) {
        callback(item, index++);
      }
    } catch (StopIteration) {
    }
  };

  /**
   * Get the full namespace string for an prefix
   *
   * @param {string} prefix
   * @returns {string|null}
   */
  this.resolveNamespace = function(prefix) {
    if (this.reservedNamespaces[prefix]) {
      return this.reservedNamespaces[prefix];
    }
    if (this.xmlns instanceof Function) {
      return this.xmlns(prefix);
    }
    return this.xmlns[prefix] || null;
  };

  /**
   * Evaluate an xpath expression. The return value depends on the
   * expression result. Scalar result types are returned a scalars.
   *
   * List result types return an {XpathNodes} object. It provides
   * an Iterator, each() and toArray().
   *
   * @param {string}  expression
   * @param {Node} context
   * @param {int} resultType
   * @returns {*}
   */
  this.evaluate = function (expression, context, resultType) {
    var result, that = this;
    resultType = resultType || XPathResult.ANY_TYPE;
    result = this.document.evaluate(
      expression,
      (context instanceof Node) ? context : this.context,
      function (prefix) {
        return that.resolveNamespace(prefix)
      },
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
  if (sourceType == 'string') {
    var parser = new DOMParser();
    this.document = parser.parseFromString(source, 'application/xml');
    this.context = this.document;
  } else if (source instanceof Document) {
    this.document = source;
    this.context = source;
  } else if (source instanceof Node) {
    this.document = source.ownerDocument;
    this.context = source;
  }
};

/**
 * If jQuery exists, add functions to it.
 */
if (typeof jQuery == 'object') {

  /**
   * Return a wrapper object
   *
   * @param {string|Document|Node} source
   * @param {Object|Function} xmlns
   * @returns {XpathWrapper}
   */
  jQuery.xpath = function(source, xmlns) {
    return new XpathWrapper(source, xmlns);
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
  jQuery.fn.xpath = function(xmlns) {
    return new XpathWrapper(
      (this.length > 0) ? this[0] : this.context,
      xmlns
    );
  }
}