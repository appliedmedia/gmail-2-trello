/**
 * Shared test utilities and mocks for G2T Chrome Extension tests
 * Contains common mocks and utilities used across multiple test files
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Import console log for debugging
const { log: console_log } = require('console');

// Create shared JSDOM instance for all test elements
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const document = dom.window.document;

// Set up global jQuery mock at module level
global.$ = (selectorOrElement, context) => {
  console_log(
    'DEBUG: global $ called with:',
    typeof selectorOrElement,
    !!selectorOrElement?._domElement,
  );

  // PRIORITY CASE: $(g2t_element) - catch our _element proxy first
  if (
    selectorOrElement &&
    typeof selectorOrElement === 'object' &&
    selectorOrElement.html &&
    typeof selectorOrElement.expected === 'object' // This is unique to our g2t_element objects
  ) {
    console_log('DEBUG: Returning _element proxy directly!');
    return selectorOrElement; // Return the _element proxy directly
  }
  // Case 1: $(element) - wrap a single DOM element
  if (
    selectorOrElement &&
    (selectorOrElement.nodeType || selectorOrElement.textContent !== undefined)
  ) {
    const element = selectorOrElement;
    // Just pass the single element as an array to elementSuperSet - let it handle everything
    return elementSuperSet(element.innerHTML || element.outerHTML || '', [
      element,
    ]);
  }

  // Case 3: $(g2t_element) - element with html property (fallback)
  if (selectorOrElement && selectorOrElement.html) {
    const htmlContent = selectorOrElement.html;
    try {
      // Create real DOM elements using JSDOM
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const elements = Array.from(tempDiv.children);

      // If no child elements, use the tempDiv itself
      const domElements = elements.length > 0 ? elements : [tempDiv];

      // Return simple jQuery-like object with real DOM elements
      return {
        length: domElements.length,
        html: jest.fn(() => domElements[0]?.innerHTML || ''),
        text: jest.fn(() => domElements[0]?.textContent || ''),
        attr: jest.fn(name => domElements[0]?.getAttribute(name) || ''),
        prop: jest.fn(name => {
          if (name === 'href') {
            return domElements[0]?.getAttribute('href') || '';
          }
          return domElements[0]?.[name] || '';
        }),
      };
    } catch (e) {
      // Fallback to empty jQuery-like object
      return {
        length: 0,
        html: jest.fn(() => ''),
        text: jest.fn(() => ''),
        attr: jest.fn(() => ''),
        prop: jest.fn(() => ''),
      };
    }
  }

  // Case 2: $(selector, context) - find elements in context
  if (
    context &&
    (typeof context.html === 'function' || context.length !== undefined)
  ) {
    const selector = selectorOrElement;
    let contextContent = '';

    // Get the HTML content from the context
    if (typeof context.html === 'function') {
      contextContent = context.html();
    } else if (context.innerHTML) {
      contextContent = context.innerHTML;
    } else if (context.length !== undefined && context.length > 0) {
      // If context is a jQuery collection, try to get HTML from first element
      contextContent = context[0]?.innerHTML || context.html?.() || '';
    }

    // Create a temporary DOM element for parsing
    let elements = [];

    try {
      // Use JSDOM's document if available, otherwise use regex fallback
      if (typeof document !== 'undefined' && document.createElement) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = contextContent;
        elements = Array.from(tempDiv.querySelectorAll(selector));
      } else {
        // Fallback: simple regex-based element matching
        const tagMatch = selector.match(/^([a-zA-Z]+)$/);
        if (tagMatch) {
          const tag = tagMatch[1];

          const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 'gi');
          let match;
          while ((match = regex.exec(contextContent)) !== null) {
            // Capture the match for this specific element to avoid closure issues
            const currentMatch = match;

            elements.push({
              tagName: tag.toUpperCase(),
              textContent: currentMatch[1].replace(/<[^>]*>/g, ''), // Strip inner HTML tags
              innerHTML: currentMatch[1],
              outerHTML: currentMatch[0],
              getAttribute: attr => {
                if (attr === 'href') {
                  const hrefMatch = currentMatch[0].match(
                    /href=['"]([^'"]*)['"]/,
                  );
                  return hrefMatch ? hrefMatch[1] : '';
                }
                return '';
              },
            });
          }
        }
      }
    } catch (e) {
      // If DOM operations fail, use regex fallback
      const tagMatch = selector.match(/^([a-zA-Z]+)$/);
      if (tagMatch) {
        const tag = tagMatch[1];
        const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 'gi');
        let match;
        while ((match = regex.exec(contextContent)) !== null) {
          elements.push({
            tagName: tag.toUpperCase(),
            textContent: match[1].replace(/<[^>]*>/g, ''), // Strip inner HTML tags
            innerHTML: match[1],
            outerHTML: match[0],
            getAttribute: attr => {
              if (attr === 'href') {
                const hrefMatch = match[0].match(/href=['"]([^'"]*)['"]/);
                return hrefMatch ? hrefMatch[1] : '';
              }
              return '';
            },
          });
        }
      }
    }

    // Return a simple jQuery-like object using real JSDOM elements
    return {
      length: elements.length,
      each: jest.fn(callback => {
        elements.forEach((element, index) => {
          // Create a comprehensive jQuery-like wrapper for each element
          const elementWrapper = {
            attr: jest.fn(name => {
              const result = element.getAttribute(name) || '';
              console_log(`DEBUG: elementWrapper.attr(${name}) = ${result}`);
              return result;
            }),
            prop: jest.fn(name => {
              if (name === 'href') {
                // Check both attribute and property
                const attrResult = element.getAttribute('href') || '';
                const propResult = element[name] || '';
                console_log(
                  `DEBUG: elementWrapper.prop(href) - getAttribute: ${attrResult}, element.href: ${propResult}`,
                );
                return attrResult; // Use getAttribute to avoid URL normalization
              }
              const result = element[name] || '';
              console_log(`DEBUG: elementWrapper.prop(${name}) = ${result}`);
              return result;
            }),
            text: jest.fn(() => {
              const result = element.textContent;
              console_log(`DEBUG: elementWrapper.text() = ${result}`);
              return result;
            }),
            html: jest.fn(() => element.innerHTML),
            length: 1,
            outerHTML: element.outerHTML,
            tagName: element.tagName,
          };
          callback(index, elementWrapper);
        });
      }),
      first: jest.fn(() => {
        if (elements.length > 0) {
          const element = elements[0];
          return {
            attr: jest.fn(name => element.getAttribute(name) || ''),
            prop: jest.fn(name => {
              if (name === 'href') {
                return element.getAttribute('href') || '';
              }
              return element[name] || '';
            }),
            text: jest.fn(() => element.textContent),
            html: jest.fn(() => element.innerHTML),
          };
        }
        return {
          attr: jest.fn(() => ''),
          prop: jest.fn(() => ''),
          text: jest.fn(() => ''),
          html: jest.fn(() => ''),
        };
      }),
    };
  }

  // Case 3: $(selector) - find elements by selector (most common case)
  if (typeof selectorOrElement === 'string') {
    // Return empty jQuery-like object for string selectors
    return {
      length: 0,
      each: jest.fn(),
      attr: jest.fn(() => ''),
      prop: jest.fn(() => ''),
      text: jest.fn(() => ''),
      html: jest.fn(() => ''),
    };
  }

  // Default behavior for other cases - return empty jQuery-like object
  return {
    length: 0,
    each: jest.fn(),
    attr: jest.fn(() => ''),
    prop: jest.fn(() => ''),
    text: jest.fn(() => ''),
    html: jest.fn(() => ''),
  };
};

// Add $.extend method
global.$.extend = jest.fn((target, ...sources) => {
  // Simple extend implementation
  sources.forEach(source => {
    if (source) {
      Object.keys(source).forEach(key => {
        target[key] = source[key];
      });
    }
  });
  return target;
});

// Test configuration following modern best practices
const TEST_CONFIG = {
  timeout: 10000, // Increased timeout for complex tests
  jsdomOptions: {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable',
    runScripts: 'dangerously',
  },
};

/**
 * Standardized function to inject jQuery and mock constructors into eval'd class code
 * This ensures all classes have access to jQuery ($) regardless of whether they use it
 * @param {string} classCode - The original class code to inject into
 * @param {string} mockConstructorsCode - The mock constructors code to inject
 * @returns {string} - The injected code ready for eval()
 */
function injectJQueryAndMocks(classCode, mockConstructorsCode) {
  return `
// Use the same jQuery mock that's defined globally (with all methods already attached)
var $ = global.$;
${classCode.replace(
  'var G2T = G2T || {}; // must be var to guarantee correct scope - do not alter this line',
  `var G2T = G2T || {}; // must be var to guarantee correct scope - do not alter this line
${mockConstructorsCode}`,
)}`;
}

/**
 * Create a comprehensive mock element with all functionality any test might need
 * Supports both single elements and collections of elements
 * @param {string} htmlContent - HTML content to mock for the primary element
 * @param {Array} elementsArray - Optional array of DOM elements for collection behavior
 * @returns {Object} - Complete mock element with all jQuery methods and proper length
 */
function elementSuperSet(htmlContent = '', elementsArray = []) {
  // DISABLED: Force everything to use _element proxy instead
  throw new Error(
    'elementSuperSet disabled - use _element proxy with JSDOM instead',
  );

  // Ensure htmlContent is a string
  const content = htmlContent || '';

  // If we have an elements array, use its length, otherwise default to 1
  const actualLength = elementsArray.length > 0 ? elementsArray.length : 1;

  // Parse the HTML content to extract tag name, attributes, and text content
  let parsedTagName = 'DIV';
  let parsedAttributes = {};
  let parsedTextContent = 'mock text';

  // Debug logging for content parsing

  if (content) {
    // Extract tag name from HTML content
    const tagMatch = content.match(/^<([a-zA-Z][a-zA-Z0-9]*)/);
    if (tagMatch) {
      parsedTagName = tagMatch[1].toUpperCase();
    }

    // Extract attributes from HTML content
    const attrRegex = /(\w+)=['"]([^'"]*)['"]/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(content)) !== null) {
      parsedAttributes[attrMatch[1]] = attrMatch[2];
    }

    // Extract text content using JSDOM parsing
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      parsedTextContent = tempDiv.textContent || '';
    } catch (e) {
      // Fallback: simple regex to extract text between tags
      const textMatch = content.match(/>([^<]*)</);
      parsedTextContent = textMatch ? textMatch[1] : '';
    }
  }

  return {
    // Basic properties - always have at least length 1
    length: actualLength,
    textContent:
      elementsArray.length > 0
        ? elementsArray[0].textContent || ''
        : parsedTextContent,
    innerHTML: content || '<div>mock html</div>',
    nodeType: 1,
    tagName:
      elementsArray.length > 0
        ? elementsArray[0].tagName || elementsArray[0].nodeName || ''
        : parsedTagName,

    // Make parsed data available as properties so they survive Object.assign
    parsedAttributes: parsedAttributes,
    parsedTagName: parsedTagName,
    parsedTextContent: parsedTextContent,

    // jQuery methods
    html: jest.fn(function () {
      if (elementsArray.length > 0) {
        return elementsArray[0].innerHTML || '';
      }
      return content;
    }),
    text: jest.fn(function () {
      if (elementsArray.length > 0) {
        return elementsArray[0].textContent || '';
      }
      // Return the already-parsed text content
      return parsedTextContent;
    }),
    attr: jest.fn(name => {
      if (elementsArray.length > 0 && elementsArray[0].getAttribute) {
        return elementsArray[0].getAttribute(name) || '';
      }
      // First check parsed attributes from HTML content
      if (parsedAttributes[name]) {
        return parsedAttributes[name];
      }
      // Fallback to default attributes
      const attrs = {
        name: 'Test User',
        email: 'test@example.com',
        download_url: 'text/plain:test.txt:https://example.com/test.txt',
        title: '2024-01-01 12:00:00',
        'data-thread-id': 'thread-123',
        'aria-label': 'Download attachment test.png',
      };
      return attrs[name] || 'mock-attr';
    }),
    prop: jest.fn(function (name) {
      // If we have actual DOM elements, use the first one's properties
      if (elementsArray.length > 0) {
        const element = elementsArray[0];

        if (name === 'nodeName') {
          return element.nodeName || element.tagName || '';
        }
        if (name === 'href') {
          // Safely get href from real DOM elements
          try {
            const href =
              element.href ||
              (element.getAttribute && element.getAttribute('href')) ||
              '';
            return href;
          } catch (e) {
            return element.href || '';
          }
        }
        // Fall back to element properties
        return element[name] || '';
      } else if (this.parsedAttributes && this.parsedAttributes[name]) {
        return this.parsedAttributes[name];
      }

      // Fallback to default properties
      const props = {
        src: 'https://example.com/image.png',
        alt: 'Test Image',
        type: 'image/png',
        nodeName: this.parsedTagName || 'DIV',
        href: 'https://example.com',
      };
      return props[name] || 'mock-prop';
    }),
    offset: jest.fn(() => ({ top: 1, left: 2 })),
    getAttribute: jest.fn(function (name) {
      // If we have actual DOM elements, use the first one's getAttribute
      if (elementsArray.length > 0) {
        const element = elementsArray[0];
        if (
          element.getAttribute &&
          typeof element.getAttribute === 'function'
        ) {
          return element.getAttribute(name);
        }
      }

      // Check static parsed attributes (these survive Object.assign)
      if (this.parsedAttributes && this.parsedAttributes[name]) {
        return this.parsedAttributes[name];
      }
      // Fallback to default attributes
      const attrs = {
        name: 'Test User',
        email: 'test@example.com',
        download_url: 'text/plain:test.txt:https://example.com/test.txt',
        title: '2024-01-01 12:00:00',
        'data-thread-id': 'thread-123',
        'aria-label': 'Download attachment test.png',
      };
      return attrs[name] || 'mock-attr';
    }),

    // DOM traversal methods
    find: jest.fn(() => elementSuperSet()),
    first: jest.fn(() => elementSuperSet()),
    nextAll: jest.fn(() => ({
      find: jest.fn(() => ({
        first: jest.fn(() => ({
          attr: jest.fn(() => 'Download attachment test.png'),
        })),
      })),
    })),
    children: jest.fn(() => ({
      length: 2,
      each: jest.fn(callback => {
        callback(0, elementSuperSet('child1'));
        callback(1, elementSuperSet('child2'));
      }),
    })),

    // Iteration methods
    each: jest.fn(function (callback) {
      if (elementsArray.length > 0) {
        // Use the actual elements if provided
        elementsArray.forEach((element, index) => {
          // Just use THIS object (the working elementSuperSet) with element-specific properties
          // Since parsedAttributes is now a static property, Object.assign preserves it automatically
          const elementForCallback = Object.assign({}, this, {
            textContent: element.textContent || '',
            innerHTML: element.innerHTML || '',
            outerHTML: element.outerHTML || '',
            tagName: element.tagName || '',
            nodeType: 1,
          });

          callback(index, elementForCallback);
        });
      } else {
        // Default single element behavior - just use this object
        callback(0, this);
      }
    }),

    // Utility methods
    addClass: jest.fn(),
    removeClass: jest.fn(),
    val: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    append: jest.fn(),
    prepend: jest.fn(),
    empty: jest.fn(),
    remove: jest.fn(),
  };
}

/**
 * Mock jQuery object that mimics what markdownify expects
 */
function createMockJQueryElement(htmlContent) {
  // Ensure htmlContent is a string
  const content = htmlContent || '';

  // Create a real DOM element for proper HTML parsing
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;

  // Return a jQuery-like object that wraps the real DOM element
  return {
    html: () => content,
    length: content ? 1 : 0,
    text: () => {
      return tempDiv.textContent || '';
    },
    // Add methods that markdownify might need
    find: selector => {
      const elements = Array.from(tempDiv.querySelectorAll(selector));
      return {
        length: elements.length,
        each: callback => {
          elements.forEach((element, index) => {
            callback(index, createMockJQueryElement(element.outerHTML));
          });
        },
        first: () =>
          elements.length > 0
            ? createMockJQueryElement(elements[0].outerHTML)
            : createMockJQueryElement(''),
        attr: attrName =>
          elements.length > 0 ? elements[0].getAttribute(attrName) || '' : '',
        prop: propName =>
          elements.length > 0 ? elements[0][propName] || '' : '',
        text: () => (elements.length > 0 ? elements[0].textContent || '' : ''),
        html: () => (elements.length > 0 ? elements[0].innerHTML || '' : ''),
      };
    },
    children: () => {
      const children = Array.from(tempDiv.children);
      return {
        length: children.length,
        each: callback => {
          children.forEach((child, index) => {
            callback(index, createMockJQueryElement(child.outerHTML));
          });
        },
        first: () =>
          children.length > 0
            ? createMockJQueryElement(children[0].outerHTML)
            : createMockJQueryElement(''),
      };
    },
    each: callback => {
      // If we have content, call the callback with the element
      if (content) {
        callback(0, createMockJQueryElement(content));
      }
    },
    first: () => createMockJQueryElement(content),
    attr: attrName => tempDiv.getAttribute(attrName) || '',
    prop: propName => tempDiv[propName] || '',
    // Add support for traversing the DOM tree
    parent: () => createMockJQueryElement(''),
    next: () => createMockJQueryElement(''),
    prev: () => createMockJQueryElement(''),
    siblings: () => createMockJQueryElement(''),
    // Add support for element creation
    append: content => {
      tempDiv.innerHTML += content;
      return createMockJQueryElement(tempDiv.innerHTML);
    },
    prepend: content => {
      tempDiv.innerHTML = content + tempDiv.innerHTML;
      return createMockJQueryElement(tempDiv.innerHTML);
    },
    // Add support for element manipulation
    remove: () => {},
    empty: () => {
      tempDiv.innerHTML = '';
      return createMockJQueryElement('');
    },
    // Add support for CSS classes
    addClass: className => {
      tempDiv.classList.add(className);
      return createMockJQueryElement(tempDiv.outerHTML);
    },
    removeClass: className => {
      tempDiv.classList.remove(className);
      return createMockJQueryElement(tempDiv.outerHTML);
    },
    hasClass: className => tempDiv.classList.contains(className),
    // Add support for element visibility
    show: () => createMockJQueryElement(tempDiv.outerHTML),
    hide: () => createMockJQueryElement(tempDiv.outerHTML),
    is: selector => {
      // Simple selector matching
      if (selector === ':visible') return true;
      if (selector === ':hidden') return false;
      return tempDiv.matches ? tempDiv.matches(selector) : false;
    },
    // Add support for element dimensions
    width: () => 100,
    height: () => 100,
    offset: () => ({ top: 1, left: 2 }),
    position: () => ({ top: 0, left: 0 }),
    // Add support for element data
    data: (key, value) => {
      if (value !== undefined) {
        tempDiv.dataset[key] = value;
        return createMockJQueryElement(tempDiv.outerHTML);
      }
      return tempDiv.dataset[key] || '';
    },
    // Add support for element events (stubs)
    on: () => createMockJQueryElement(tempDiv.outerHTML),
    off: () => createMockJQueryElement(tempDiv.outerHTML),
    trigger: () => createMockJQueryElement(tempDiv.outerHTML),
    // Add support for element cloning
    clone: () => createMockJQueryElement(tempDiv.outerHTML),
    // Add support for element replacement
    replaceWith: content => createMockJQueryElement(content),
    replaceAll: content => createMockJQueryElement(content),
    // Add support for element wrapping
    wrap: content => createMockJQueryElement(content),
    wrapAll: (/* content */) => createMockJQueryElement(tempDiv.outerHTML),
    wrapInner: (/* content */) => createMockJQueryElement(tempDiv.outerHTML),
    // Add support for element unwrapping
    unwrap: () => createMockJQueryElement(tempDiv.innerHTML),
    // Add support for element insertion
    insertAfter: (/* content */) => createMockJQueryElement(tempDiv.outerHTML),
    insertBefore: (/* content */) => createMockJQueryElement(tempDiv.outerHTML),
    after: (/* content */) => createMockJQueryElement(tempDiv.outerHTML),
    before: (/* content */) => createMockJQueryElement(tempDiv.outerHTML),
    // Add support for element filtering
    filter: (/* selector */) => createMockJQueryElement(tempDiv.outerHTML),
    not: (/* selector */) => createMockJQueryElement(tempDiv.outerHTML),
    // Add support for element indexing
    index: () => 0,
    eq: (/* index */) => createMockJQueryElement(tempDiv.outerHTML),
    // Add support for element content
    contents: () => createMockJQueryElement(tempDiv.innerHTML),
    // Add support for element attributes
    removeAttr: attrName => {
      tempDiv.removeAttribute(attrName);
      return createMockJQueryElement(tempDiv.outerHTML);
    },
    // Add support for element properties
    removeProp: (/* propName */) => createMockJQueryElement(tempDiv.outerHTML),
    // Add support for element values
    val: value => {
      if (value !== undefined) {
        tempDiv.value = value;
        return createMockJQueryElement(tempDiv.outerHTML);
      }
      return tempDiv.value || '';
    },
    // Add support for element scrolling
    scrollTop: value => {
      if (value !== undefined) {
        tempDiv.scrollTop = value;
        return createMockJQueryElement(tempDiv.outerHTML);
      }
      return tempDiv.scrollTop || 0;
    },
    scrollLeft: value => {
      if (value !== undefined) {
        tempDiv.scrollLeft = value;
        return createMockJQueryElement(tempDiv.outerHTML);
      }
      return tempDiv.scrollLeft || 0;
    },
  };
}

// Mock chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
    onChanged: {
      addListener: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    getURL: jest.fn(),
  },
};

// Mock Trello API
global.Trello = {
  key: jest.fn(() => 'test-key'),
  token: jest.fn(() => 'test-token'),
  setKey: jest.fn(),
  setToken: jest.fn(),
  authorize: jest.fn(),
  deauthorize: jest.fn(),
  authorized: jest.fn(() => false),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  rest: jest.fn(),
};

// Mock EventTarget
global.EventTarget = class EventTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, listener /* options */) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(listener);
  }

  removeEventListener(type, listener) {
    if (this.listeners.has(type)) {
      const listeners = this.listeners.get(type);
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  dispatchEvent(event) {
    if (this.listeners.has(event.type)) {
      this.listeners.get(event.type).forEach(listener => {
        listener(event);
      });
    }
  }
};

// Mock console for testing
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Initialize G2T global object
global.G2T = global.G2T || {};

// Mock document object
global.document = {
  createElement: jest.fn(tagName => {
    if (tagName === 'textarea') {
      return {
        innerHTML: '',
        value: '',
        style: {
          cssText: '',
        },
        setAttribute: jest.fn(),
        getAttribute: jest.fn(),
        appendChild: jest.fn(),
        removeChild: jest.fn(),
      };
    }
    return {
      innerHTML: '',
      textContent: '',
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
      appendChild: jest.fn(),
      removeChild: jest.fn(),
    };
  }),
  createTextNode: jest.fn(text => ({ textContent: text })),
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock window object
global.window = {
  location: {
    hash: '#test-hash',
    reload: jest.fn(),
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  console: global.console,
  document: global.document,
};

// Mock confirm function
global.confirm = jest.fn();

// Mock analytics
global.analytics = {
  track: jest.fn(),
  getService: jest.fn(() => ({
    getTracker: jest.fn(() => ({
      sendAppView: jest.fn(),
    })),
  })),
};

/**
 * Helper function to load a class file using eval (for Chrome extension compatibility)
 * @param {string} filePath - Path to the class file
 * @returns {string} - The file content to be evaluated
 */
function loadClassFile(filePath) {
  const fs = require('fs');
  const path = require('path');
  const fullPath = path.join(__dirname, '..', filePath);
  return fs.readFileSync(fullPath, 'utf8');
}

/**
 * Helper function to load and setup Utils class for testing
 * @returns {Object} - Object containing utils instance and testApp
 */
function setupUtilsForTesting() {
  // Initialize G2T namespace for Utils class
  global.G2T = {};

  // Ensure global $ is available for the Utils class
  if (!global.$) {
    // global.$ should already be defined at the module level
    throw new Error('Global $ mock not initialized');
  }

  // Load and evaluate the Utils class
  const utilsPath = path.join(
    __dirname,
    '../chrome_manifest_v3/class_utils.js',
  );
  const utilsCode = fs.readFileSync(utilsPath, 'utf8');

  // Create local reference for eval scope
  var G2T = global.G2T;
  eval(utilsCode);

  // Make sure G2T.Utils is available globally for instanceof checks
  global.G2T = G2T;

  // Create test application for Utils class
  const testApp = {
    utils: {
      log: jest.fn(),
    },
    persist: {
      storageHashes: {},
    },
    temp: {
      log: {
        debugMode: false,
        memory: [],
        count: 0,
        max: 100,
      },
    },
    goog: {
      storageSyncGet: jest.fn(),
      storageSyncSet: jest.fn(),
    },
  };

  // Create Utils instance
  const utils = new global.G2T.Utils({ app: testApp });

  return { utils, testApp };
}

/**
 * Helper function to create real Utils methods for testing
 * This provides actual Utils implementations for string processing methods
 * instead of mocked versions, making tests more realistic
 * @returns {Object} - Object with real Utils methods bound to the test app
 */
function createRealUtilsMethods() {
  // Create a simple test app for Utils initialization
  const utilsTestApp = {
    utils: {
      log: jest.fn(),
    },
    persist: {
      storageHashes: {},
    },
    temp: {
      log: {
        debugMode: false,
        memory: [],
        count: 0,
        max: 100,
      },
    },
  };

  // Load and evaluate the Utils class directly
  const utilsPath = path.join(
    __dirname,
    '../chrome_manifest_v3/class_utils.js',
  );
  const utilsCode = fs.readFileSync(utilsPath, 'utf8');

  // Create local reference for eval scope
  var G2T = global.G2T || {};
  eval(utilsCode);

  // Create Utils instance
  const realUtils = new G2T.Utils({ app: utilsTestApp });

  // Return an object with real Utils methods bound to the instance
  return {
    // String processing methods - use real implementations
    anchorMarkdownify: realUtils.anchorMarkdownify.bind(realUtils),
    replacer: realUtils.replacer.bind(realUtils),
    replacer_onEach: realUtils.replacer_onEach.bind(realUtils),
    escapeRegExp: realUtils.escapeRegExp.bind(realUtils),
    uriForDisplay: realUtils.uriForDisplay.bind(realUtils),
    djb2Hash: realUtils.djb2Hash.bind(realUtils),
    excludeFields: realUtils.excludeFields.bind(realUtils),
    splitEmailDomain: realUtils.splitEmailDomain.bind(realUtils),
    addChar: realUtils.addChar.bind(realUtils),
    addSpace: realUtils.addSpace.bind(realUtils),
    addCRLF: realUtils.addCRLF.bind(realUtils),
    truncate: realUtils.truncate.bind(realUtils),
    midTruncate: realUtils.midTruncate.bind(realUtils),
    encodeEntities: realUtils.encodeEntities.bind(realUtils),
    decodeEntities: realUtils.decodeEntities.bind(realUtils),
    decodeEntities_onEach: realUtils.decodeEntities_onEach.bind(realUtils),
    modKey: realUtils.modKey.bind(realUtils),
    url_add_var: realUtils.url_add_var.bind(realUtils),
    makeAvatarUrl: realUtils.makeAvatarUrl.bind(realUtils),
    bookend: realUtils.bookend.bind(realUtils),
    getSelectedText: realUtils.getSelectedText.bind(realUtils),
    luminance: realUtils.luminance.bind(realUtils),

    // Markdown processing methods - use real implementations
    markdownify: realUtils.markdownify.bind(realUtils),
    markdownify_sortByLength:
      realUtils.markdownify_sortByLength.bind(realUtils),
    markdownify_onSortEach: realUtils.markdownify_onSortEach.bind(realUtils),
    markdownify_onElementEach:
      realUtils.markdownify_onElementEach.bind(realUtils),
    markdownify_onHeaderEach:
      realUtils.markdownify_onHeaderEach.bind(realUtils),
    markdownify_onLinkEach: realUtils.markdownify_onLinkEach.bind(realUtils),
    markdownify_featureEnabled:
      realUtils.markdownify_featureEnabled.bind(realUtils),
    markdownify_sortAndPlaceholderize:
      realUtils.markdownify_sortAndPlaceholderize.bind(realUtils),
    markdownify_processMarkdown:
      realUtils.markdownify_processMarkdown.bind(realUtils),
    markdownify_repeatReplace:
      realUtils.markdownify_repeatReplace.bind(realUtils),

    // Storage and lifecycle methods - these can be mocked as they have side effects
    loadFromChromeStorage: jest.fn(),
    saveToChromeStorage: jest.fn(),
    refreshDebugMode: jest.fn(),
    bindEvents: jest.fn(),
    init: jest.fn(),

    // Logging - can be mocked as it has side effects
    log: jest.fn(),
  };
}

/**
 * Helper function to create mock instances for G2T classes
 * @returns {Object} - Object containing mock instances
 */
function createMockInstances() {
  const mockChrome = {
    init: jest.fn(),
    runtimeSendMessage: jest.fn(),
    storageSyncGet: jest.fn(),
    storageSyncSet: jest.fn(),
  };

  const mockEventTarget = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    addListener: jest.fn(),
    fire: jest.fn(),
    emit: jest.fn(),
  };

  const mockModel = {
    init: jest.fn(),
    trello: {
      user: { fullName: 'Test User' },
    },
    gmail: {},
  };

  const mockGmailView = {
    init: jest.fn(),
    bindData: jest.fn(),
    parseData: jest.fn(() => ({})),
    forceRedraw: jest.fn(),
    parsingData: false,
  };

  const mockPopupView = {
    init: jest.fn(),
    bindData: jest.fn(),
    bindGmailData: jest.fn(),
  };

  const mockUtils = {
    init: jest.fn(),
    loadFromChromeStorage: jest.fn(),
    saveToChromeStorage: jest.fn(),
    log: jest.fn(),
    djb2Hash: jest.fn(() => 'mock-hash'),
    escapeRegExp: jest.fn(str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    anchorMarkdownify: jest.fn(),
    markdownify: jest.fn(),
    markdownify_sortByLength: jest.fn(),
    markdownify_featureEnabled: jest.fn(),
  };

  const waitCounter = {
    start: jest.fn(),
    stop: jest.fn(),
  };

  return {
    mockChrome,
    mockEventTarget,
    mockModel,
    mockGmailView,
    mockPopupView,
    mockUtils,
    waitCounter,
  };
}

/**
 * Helper function to create a constructor function for a G2T class
 * @param {Object} mockInstance - Mock instance object
 * @param {string} className - Name of the class
 * @returns {Function} - Constructor function
 */
function createG2TConstructor(mockInstance, className) {
  return function (args) {
    if (!(this instanceof G2T[className])) {
      return new G2T[className](args);
    }
    Object.assign(this, mockInstance);
    return this;
  };
}

/**
 * Helper function to setup G2T class mocks
 * @param {Object} mockInstances - Object containing mock instances
 */
function setupG2TMocks(mockInstances) {
  const {
    mockChrome,
    mockEventTarget,
    mockModel,
    mockGmailView,
    mockPopupView,
    mockUtils,
  } = mockInstances;

  // Create actual constructor functions that can be called with 'new'
  G2T.ChromeAPI = createG2TConstructor(mockChrome, 'ChromeAPI');
  G2T.EventTarget = createG2TConstructor(mockEventTarget, 'EventTarget');
  G2T.Model = createG2TConstructor(mockModel, 'Model');
  G2T.GmailView = createG2TConstructor(mockGmailView, 'GmailView');
  G2T.PopupView = createG2TConstructor(mockPopupView, 'PopupView');
  G2T.Utils = createG2TConstructor(mockUtils, 'Utils');
}

/**
 * Helper function to clear all mocks
 */
function clearAllMocks() {
  // Note: $ is not a Jest mock function, so we don't clear it
  // $.mockClear();

  // Clear global chrome mocks
  if (chrome && chrome.storage) {
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
    chrome.storage.sync.get.mockClear();
    chrome.storage.sync.set.mockClear();
    chrome.storage.onChanged.addListener.mockClear();
  }
  if (chrome && chrome.runtime) {
    chrome.runtime.sendMessage.mockClear();
    chrome.runtime.getURL.mockClear();
  }

  // Clear window-specific mocks (from JSDOM setup)
  if (
    typeof window !== 'undefined' &&
    window &&
    window.chrome &&
    window.chrome.storage
  ) {
    window.chrome.storage.local.get.mockClear();
    window.chrome.storage.local.set.mockClear();
    window.chrome.storage.sync.get.mockClear();
    window.chrome.storage.sync.set.mockClear();
    window.chrome.storage.onChanged.addListener.mockClear();
    if (window.chrome.storage.onChanged.removeListener) {
      window.chrome.storage.onChanged.removeListener.mockClear();
    }
  }
  if (
    typeof window !== 'undefined' &&
    window &&
    window.chrome &&
    window.chrome.runtime
  ) {
    window.chrome.runtime.sendMessage.mockClear();
    window.chrome.runtime.getURL.mockClear();
  }
  if (typeof window !== 'undefined' && window && window.console) {
    window.console.log.mockClear();
    window.console.error.mockClear();
    window.console.warn.mockClear();
  }
  if (
    typeof window !== 'undefined' &&
    window &&
    window.location &&
    window.location.reload &&
    typeof window.location.reload.mockClear === 'function'
  ) {
    window.location.reload.mockClear();
  }
  if (
    typeof window !== 'undefined' &&
    window &&
    window.confirm &&
    typeof window.confirm.mockClear === 'function'
  ) {
    window.confirm.mockClear();
  }

  // Only clear global window.location.reload if it's a mock function
  if (
    typeof window !== 'undefined' &&
    window.location.reload &&
    typeof window.location.reload.mockClear === 'function'
  ) {
    window.location.reload.mockClear();
  }

  // Only clear global confirm if it's a mock function
  if (
    typeof confirm !== 'undefined' &&
    confirm &&
    typeof confirm.mockClear === 'function'
  ) {
    confirm.mockClear();
  }

  // Note: window event listeners are real DOM methods when using JSDOM, not mocks
  // window.addEventListener.mockClear();
  // window.removeEventListener.mockClear();

  if (global.analytics) {
    global.analytics.track.mockClear();
    global.analytics.getService.mockClear();
  }
}

/**
 * Helper function to create a mock jQuery object
 * @param {string} html - HTML content
 * @returns {Object} - Mock jQuery object
 */
function createMockJQuery(html = '') {
  const mockJQuery = {
    html: () => html,
    length: html ? 1 : 0,
    find: jest.fn((/* selector */) => {
      // Handle complex CSS selectors by returning a mock that can handle the chain
      const mockResult = createMockJQuery();

      // Add methods that might be called on the result
      mockResult.first = jest.fn(() => mockResult);
      mockResult.attr = jest.fn(attr => {
        // Return appropriate mock values based on the attribute
        if (attr === 'aria-label') return 'Download attachment test-file.png';
        if (attr === 'name') return 'Test User';
        if (attr === 'email') return 'test@example.com';
        if (attr === 'title') return 'Test Title';
        if (attr === 'alt') return 'Test Alt';
        return '';
      });
      mockResult.prop = jest.fn(prop => {
        if (prop === 'src') return 'test-image.jpg';
        if (prop === 'alt') return 'Test Image';
        if (prop === 'type') return 'text/link';
        return '';
      });
      mockResult.nextAll = jest.fn(() => mockResult);

      return mockResult;
    }),
    each: jest.fn(callback => {
      // Simulate jQuery each behavior
      if (html && html.includes('<')) {
        // If there's HTML content, simulate finding elements
        const elements = [];
        if (html.includes('<p>')) elements.push({ tagName: 'P' });
        if (html.includes('<div>')) elements.push({ tagName: 'DIV' });
        if (html.includes('<br')) elements.push({ tagName: 'BR' });
        if (html.includes('<hr')) elements.push({ tagName: 'HR' });
        if (html.includes('<strong>')) elements.push({ tagName: 'STRONG' });
        if (html.includes('<em>')) elements.push({ tagName: 'EM' });
        if (html.includes('<u>')) elements.push({ tagName: 'U' });
        if (html.includes('<strike>')) elements.push({ tagName: 'STRIKE' });
        if (html.includes('<h1>')) elements.push({ tagName: 'H1' });
        if (html.includes('<h2>')) elements.push({ tagName: 'H2' });
        if (html.includes('<h3>')) elements.push({ tagName: 'H3' });
        if (html.includes('<a ')) elements.push({ tagName: 'A' });

        elements.forEach((element, index) => {
          const $element = createMockJQuery(html);
          $element.text = jest.fn(() => {
            // Extract text content based on tag
            const tagName = element.tagName.toLowerCase();
            const regex = new RegExp(
              `<${tagName}[^>]*>(.*?)</${tagName}>`,
              'i',
            );
            const match = html.match(regex);
            return match ? match[1] : '';
          });
          callback.call($element, index, element);
        });
      }
      return mockJQuery;
    }),
    addClass: jest.fn(),
    removeClass: jest.fn(),
    text: jest.fn(() => html),
    val: jest.fn(),
    attr: jest.fn(attr => {
      // Return appropriate mock values based on the attribute
      if (attr === 'aria-label') return 'Download attachment test-file.png';
      if (attr === 'name') return 'Test User';
      if (attr === 'email') return 'test@example.com';
      if (attr === 'title') return 'Test Title';
      if (attr === 'alt') return 'Test Alt';
      return '';
    }),
    prop: jest.fn(prop => {
      if (prop === 'src') return 'test-image.jpg';
      if (prop === 'alt') return 'Test Image';
      if (prop === 'type') return 'text/link';
      return '';
    }),
    show: jest.fn(),
    hide: jest.fn(),
    append: jest.fn(),
    prepend: jest.fn(),
    empty: jest.fn(),
    remove: jest.fn(),
    nextAll: jest.fn(() => createMockJQuery()),
    first: jest.fn(() => createMockJQuery()),
  };

  return mockJQuery;
}

/**
 * Setup JSDOM environment for testing
 * @returns {Object} - Object containing dom, window, document
 */
function setupJSDOM() {
  // Create JSDOM instance with proper configuration
  const dom = new JSDOM(
    '<!DOCTYPE html><html><body></body></html>',
    TEST_CONFIG.jsdomOptions,
  );
  const window = dom.window;

  // Set up globals for the test environment
  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;

  // Mock window event listeners for testing
  window.addEventListener = jest.fn();
  window.removeEventListener = jest.fn();

  // Set window.location.hash for App class initialization
  window.location.hash = '#test-hash';

  // Mock window.location.reload for Chrome class testing
  window.location.reload = jest.fn();

  // Mock window.console for Chrome class testing
  window.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  // Mock confirm function for Chrome class testing
  window.confirm = jest.fn();

  // Mock chrome API for Chrome class testing
  window.chrome = {
    storage: {
      local: {
        get: jest.fn(),
        set: jest.fn(),
      },
      sync: {
        get: jest.fn(),
        set: jest.fn(),
      },
      onChanged: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
    },
    runtime: {
      sendMessage: jest.fn(),
      getURL: jest.fn(),
    },
  };

  // Also set global chrome for Chrome class compatibility
  global.chrome = window.chrome;

  // Make global reference available in window context for eval'd code
  global.window = window;

  return { dom, window, document: window.document };
}

/**
 * Clean up JSDOM environment after testing
 * @param {Object} dom - JSDOM instance
 */
function cleanupJSDOM(dom) {
  // Close JSDOM
  if (dom && dom.window) {
    dom.window.close();
  }

  // Clean up globals
  delete global.window;
  delete global.document;
  delete global.navigator;
  // Note: Don't delete global.$ as it's needed across tests
  delete global.G2T;
}

/**
 * Helper function to create a G2T namespace with proper constructors
 * @param {Object} mockInstances - Mock instances object
 * @returns {Object} - G2T namespace object
 */
function createG2TNamespace(mockInstances) {
  const {
    mockChrome,
    mockEventTarget,
    mockModel,
    mockGmailView,
    mockPopupView,
    mockUtils,
  } = mockInstances;

  // Create actual constructor functions that can be called with 'new'
  const G2T = {
    Chrome: createG2TConstructor(mockChrome, 'Chrome'),
    EventTarget: createG2TConstructor(mockEventTarget, 'EventTarget'),
    Model: createG2TConstructor(mockModel, 'Model'),
    GmailView: createG2TConstructor(mockGmailView, 'GmailView'),
    PopupView: createG2TConstructor(mockPopupView, 'PopupView'),
    Utils: createG2TConstructor(mockUtils, 'Utils'),
  };

  return G2T;
}

/**
 * Setup Model class for testing with proper mock application
 * @returns {Object} - Object containing model instance and mock app
 */
function setupModelForTesting() {
  const testApp = {
    utils: {
      log: jest.fn(),
    },
    events: {
      emit: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    persist: {
      trelloAuthorized: false,
      trelloData: null,
      user: null,
      emailBoardListCardMap: [],
    },
    temp: {
      boards: [],
      lists: [],
      cards: [],
      members: [],
      labels: [],
    },
    trelloApiKey: 'test-api-key',
    chrome: {
      runtimeSendMessage: jest.fn(),
    },
  };

  // Load and evaluate Trel class first (Model depends on it)
  const trelCode = loadClassFile('chrome_manifest_v3/class_trel.js');
  eval(trelCode);

  // Load and evaluate Model class with mock app
  const modelCode = loadClassFile('chrome_manifest_v3/class_model.js');
  eval(modelCode);

  // Create a mock parent object
  const mockParent = {
    id: 'test-parent',
  };

  const model = new G2T.Model({ parent: mockParent, app: testApp });

  // Initialize model properties to match expected state
  model.trelloAuthorized = false;
  model.trelloDataReady = false;
  model.boards = [];
  model.lists = [];
  model.cards = [];
  model.members = [];
  model.labels = [];

  return { model, testApp };
}

/**
 * Internal element creator using Proxy pattern for property inheritance
 * Creates JSDOM element upfront for realistic DOM testing
 */
function _element(elementData, parentName = 'common') {
  // Create real DOM element upfront if we have outerHTML
  let domElement = null;
  if (elementData.outerHTML) {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = elementData.outerHTML;
      domElement = tempDiv.firstElementChild || tempDiv;
    } catch (e) {
      domElement = null;
    }
  }

  return new Proxy(elementData, {
    get(target, prop) {
      // 1. Check specific element first
      if (prop in target) {
        return target[prop];
      }

      // 2. Check parent (g2t_element) for inheritance
      const parent = g2t_element[parentName];
      if (parent && prop in parent) {
        return parent[prop];
      }

      // 3. Provide jQuery methods directly
      if (prop === 'html') {
        return jest.fn(() => {
          if (domElement) {
            console_log(
              'DEBUG: _element html() using domElement.innerHTML:',
              domElement.innerHTML,
            );
            return domElement.innerHTML;
          }
          const fallback =
            target.outerHTML || (parent && parent.outerHTML) || '';
          console_log('DEBUG: _element html() using fallback:', fallback);
          return fallback;
        });
      }

      if (prop === 'length') {
        return 1; // Default length for jQuery objects
      }

      if (prop === 'find') {
        return jest.fn(selector => {
          if (domElement) {
            console_log(
              'DEBUG: _element find() using domElement.querySelectorAll for:',
              selector,
            );
            const foundElements = Array.from(
              domElement.querySelectorAll(selector),
            );
            return {
              length: foundElements.length,
              each: jest.fn(callback => {
                foundElements.forEach((element, index) => {
                  console_log(
                    'DEBUG: _element find() callback with element href:',
                    element.getAttribute('href'),
                  );
                  // Return a simple jQuery-like wrapper for each found element
                  const elementWrapper = {
                    attr: jest.fn(name => element.getAttribute(name) || ''),
                    prop: jest.fn(name => {
                      if (name === 'href') {
                        return element.getAttribute('href') || '';
                      }
                      return element[name] || '';
                    }),
                    text: jest.fn(() => element.textContent),
                    html: jest.fn(() => element.innerHTML),
                  };
                  callback(index, elementWrapper);
                });
              }),
            };
          }
          return { length: 0, each: jest.fn() };
        });
      }

      // 4. Expose the DOM element so global $ can use it
      if (prop === '_domElement') {
        return domElement;
      }

      // 5. Let other properties return undefined
      return undefined;
    },
  });
}

/**
 * Static test element definitions for clean, predictable testing
 * Each element type has pre-defined properties and expected test results
 * Usage: g2t_element.p, g2t_element.a, etc.
 */
const g2t_element = {
  // Common defaults that all elements inherit
  length: 1,
  features: true,

  p: _element({
    textContent: 'Paragraph content',
    innerHTML: '<p>Paragraph content</p>',
    expected: {
      markdownify: 'Paragraph content',
    },
  }),

  a: _element({
    href: 'https://example.com',
    textContent: 'Example',
    innerHTML: '<a href="https://example.com">Example</a>',
    expected: {
      markdownify: '[Example](<https://example.com>)',
    },
  }),

  h1: _element({
    textContent: 'h1 title',
    innerHTML: '<h1>h1 title</h1>',
    expected: {
      markdownify: '# h1 title',
    },
  }),

  mailto: _element({
    href: 'mailto:test@example.com',
    textContent: 'Contact us',
    innerHTML: '<a href="mailto:test@example.com">Contact us</a>',
    expected: {
      markdownify: '[Contact us](<mailto:test@example.com>)',
    },
  }),

  strong: _element({
    textContent: 'bold',
    innerHTML: '<strong>bold</strong>',
    expected: {
      markdownify: '**bold**',
    },
  }),

  em: _element({
    textContent: 'italic',
    innerHTML: '<em>italic</em>',
    expected: {
      markdownify: '*italic*',
    },
  }),

  h2: _element({
    textContent: 'h2 title',
    innerHTML: '<h2>h2 title</h2>',
    expected: {
      markdownify: '## h2 title',
    },
  }),

  h3: _element({
    textContent: 'h3 title',
    innerHTML: '<h3>h3 title</h3>',
    expected: {
      markdownify: '### h3 title',
    },
  }),

  h4: _element({
    textContent: 'h4 title',
    innerHTML: '<h4>h4 title</h4>',
    expected: {
      markdownify: '#### h4 title',
    },
  }),

  h5: _element({
    textContent: 'h5 title',
    innerHTML: '<h5>h5 title</h5>',
    expected: {
      markdownify: '##### h5 title',
    },
  }),

  h6: _element({
    textContent: 'h6 title',
    innerHTML: '<h6>h6 title</h6>',
    expected: {
      markdownify: '###### h6 title',
    },
  }),

  p2: _element({
    textContent: 'First paragraphSecond paragraph',
    innerHTML: '<p>First paragraph</p><p>Second paragraph</p>',
    expected: {
      markdownify: 'First paragraph\n\nSecond paragraph',
    },
  }),

  div2: _element({
    textContent: 'First divSecond div',
    innerHTML: '<div>First div</div><div>Second div</div>',
    expected: {
      markdownify: 'First div\n\nSecond div',
    },
  }),

  hr: _element({
    textContent: 'Text beforeText after',
    innerHTML: '<p>Text before</p><hr><p>Text after</p>',
    expected: {
      markdownify: 'Text before\n\n---\n\nText after',
    },
  }),

  hr2: _element({
    textContent: 'BeforeAfter',
    innerHTML: '<p>Before</p>----<p>After</p>',
    expected: {
      markdownify: 'Before\n\n---\n\nAfter',
    },
  }),

  br: _element({
    textContent: 'Line 1Line 2',
    innerHTML: '<p>Line 1<br>Line 2</p>',
    expected: {
      markdownify: 'Line 1\nLine 2',
    },
  }),

  br_attr: _element({
    textContent: 'Line 1Line 2',
    innerHTML: '<p>Line 1<br class="test">Line 2</p>',
    expected: {
      markdownify: 'Line 1\nLine 2',
    },
  }),

  i: _element({
    textContent: 'This is italic text',
    innerHTML: '<p>This is <i>italic</i> text</p>',
    expected: {
      markdownify: 'This is *italic* text',
    },
  }),

  u: _element({
    textContent: 'This is underlined text',
    innerHTML: '<p>This is <u>underlined</u> text</p>',
    expected: {
      markdownify: 'This is __underlined__ text',
    },
  }),

  del: _element({
    textContent: 'This is deleted text',
    innerHTML: '<p>This is <del>deleted</del> text</p>',
    expected: {
      markdownify: 'This is ~~deleted~~ text',
    },
  }),

  s: _element({
    textContent: 'This is strikethrough text',
    innerHTML: '<p>This is <s>strikethrough</s> text</p>',
    expected: {
      markdownify: 'This is ~~strikethrough~~ text',
    },
  }),

  strike: _element({
    textContent: 'This is strikethrough text',
    innerHTML: '<p>This is <strike>strikethrough</strike> text</p>',
    expected: {
      markdownify: 'This is ~~strikethrough~~ text',
    },
  }),

  strong_em: _element({
    textContent: 'This is bold italic text',
    innerHTML: '<p>This is <strong><em>bold italic</em></strong> text</p>',
    expected: {
      markdownify: 'This is *bold italic* text',
    },
  }),

  a_title: _element({
    textContent: 'Visit Example',
    innerHTML:
      '<p>Visit <a href="https://example.com" title="Example Site">Example</a></p>',
    expected: {
      markdownify: 'Visit [Example](<https://example.com>)',
    },
  }),

  a_long: _element({
    textContent: 'Visit This is a very long link text that should be converted',
    innerHTML:
      '<p>Visit <a href="https://example.com">This is a very long link text that should be converted</a></p>',
    expected: {
      markdownify:
        'Visit [This is a very long link text that should be converted](<https://example.com>)',
    },
  }),

  a_short: _element({
    textContent: 'Visit Hi for more info',
    innerHTML:
      '<p>Visit <a href="https://example.com">Hi</a> for more info</p>',
    expected: {
      markdownify: 'Visit Hi for more info',
    },
  }),

  a_multiple: _element({
    html: '<p>Visit <a href="https://example1.com">Example 1</a> and <a href="https://example2.com">Example 2</a></p>',
    expected: {
      markdownify:
        'Visit [Example 1](<https://example1.com>) and [Example 2](<https://example2.com>)',
    },
  }),

  a_same: _element({
    textContent: 'Visit https://example.com',
    innerHTML:
      '<p>Visit <a href="https://example.com">https://example.com</a></p>',
    expected: {
      markdownify: 'Visit <https://example.com>',
    },
  }),

  bullet: _element({
    textContent: '• Item 1• Item 2• Item 3',
    innerHTML: '<p>• Item 1<br>• Item 2<br>• Item 3</p>',
    expected: {
      markdownify: '• Item 1\n• Item 2\n• Item 3',
    },
  }),

  spaces: _element({
    textContent: 'This    has    multiple    spaces',
    innerHTML: '<p>This    has    multiple    spaces</p>',
    expected: {
      markdownify: 'This has multiple spaces',
    },
  }),

  linebreaks: _element({
    textContent: 'First lineSecond line',
    innerHTML: '<p>First line</p>\n\n\n<p>Second line</p>',
    expected: {
      markdownify: 'First line\n\nSecond line',
    },
  }),

  trim: _element({
    textContent: 'Content',
    innerHTML: '   <p>Content</p>   ',
    expected: {
      markdownify: 'Content',
    },
  }),

  strong_simple: _element({
    textContent: 'This is bold text',
    innerHTML: '<p>This is <strong>bold</strong> text</p>',
    expected: {
      markdownify: 'This is **bold** text',
    },
  }),

  empty_content: _element({
    textContent: 'Content',
    innerHTML: '<div><p></p><p>Content</p></div>',
    expected: {
      markdownify: 'Content',
    },
  }),

  b: _element({
    textContent: 'This is bold text',
    innerHTML: '<p>This is <b>bold</b> text</p>',
    expected: {
      markdownify: 'This is **bold** text',
    },
  }),

  em_text: _element({
    textContent: 'This is italic text',
    innerHTML: '<p>This is <em>italic</em> text</p>',
    expected: {
      markdownify: 'This is *italic* text',
    },
  }),

  empty_input: _element({
    textContent: '',
    innerHTML: '',
    expected: {
      markdownify: '',
    },
  }),

  whitespace_input: _element({
    textContent: '   \n\t   ',
    innerHTML: '   \n\t   ',
    expected: {
      markdownify: '',
    },
  }),

  strong_em_both: _element({
    textContent: 'This is bold and italic text',
    innerHTML: '<p>This is <strong>bold</strong> and <em>italic</em> text</p>',
    expected: {
      markdownify: 'This is **bold** and *italic* text',
    },
  }),

  headers_spacing: _element({
    textContent: 'TitleContentSubtitle',
    innerHTML: '<h1>Title</h1><p>Content</p><h2>Subtitle</h2>',
    expected: {
      markdownify: '# Title\n\nContent\n\n## Subtitle',
    },
  }),

  html_entities: _element({
    textContent: 'This & that < > " \'',
    innerHTML: '<p>This &amp; that &lt; &gt; &quot; &#39;</p>',
    expected: {
      markdownify: 'This & that < > " \'',
    },
  }),

  numeric_entities: _element({
    textContent: 'Copyright © 2023',
    innerHTML: '<p>Copyright &#169; 2023</p>',
    expected: {
      markdownify: 'Copyright © 2023',
    },
  }),

  bullet_chars: _element({
    textContent: '• First item• Second item',
    innerHTML: '<p>• First item<br>• Second item</p>',
    expected: {
      markdownify: '• First item\n• Second item',
    },
  }),

  space_normalize: _element({
    textContent: 'Text   with   multiple   spaces',
    innerHTML: '<p>Text   with   multiple   spaces</p>',
    expected: {
      markdownify: 'Text with multiple spaces',
    },
  }),

  features_disabled: _element({
    textContent: 'This is bold and italic text',
    innerHTML: '<p>This is <strong>bold</strong> and <em>italic</em> text</p>',
    features: false,
    expected: {
      markdownify: 'This is bold and italic text', // When features=false, formatting is stripped
    },
  }),

  title_bold_italic_link: _element({
    textContent: 'TitleThis is bold and italic text with link.',
    innerHTML:
      '<h1>Title</h1><p>This is <strong>bold</strong> and <em>italic</em> text with a <a href="https://example.com">link</a>.</p>',
    expected: {
      markdownify:
        '# Title\n\nThis is **bold** and *italic* text with a [link](<https://example.com>) .',
    },
  }),

  long_text: _element({
    textContent: 'A'.repeat(10000),
    innerHTML: 'A'.repeat(10000),
    expected: {
      markdownify: 'A'.repeat(10000),
    },
  }),

  special_chars: _element({
    textContent: 'Special chars: © ™ ® € £',
    innerHTML: '<p>Special chars: &copy; &trade; &reg; &euro; &pound;</p>',
    expected: {
      markdownify: 'Special chars: © ™ ® € £',
    },
  }),

  malformed_html: _element({
    textContent: 'Unclosed tagBold textAnother paragraph',
    innerHTML: '<p>Unclosed tag<strong>Bold text<p>Another paragraph',
    expected: {
      markdownify: 'Unclosed tagBold text\n\n**Another paragraph**',
    },
  }),

  email_content: _element({
    textContent:
      "Meeting SummaryHello team,Here's what we discussed:• Project timeline• Budget concernsBest regards,John",
    innerHTML:
      "<div><h1>Meeting Summary</h1><p>Hello team,</p><p>Here's what we discussed:</p><ul><li>• Project timeline</li><li>• Budget concerns</li></ul><p>Best regards,<br>John</p></div>",
    expected: {
      markdownify:
        "# Meeting Summary\n\nHello team,\n\nHere's what we discussed:\n\n• Project timeline• Budget concerns\n\nBest regards,\nJohn",
    },
  }),

  features_strong_off_italic_on: _element({
    textContent: 'This is bold and italic text',
    innerHTML: '<p>This is <strong>bold</strong> and <em>italic</em> text</p>',
    features: { strong: false, em: true },
    expected: {
      markdownify: 'This is bold and *italic* text',
    },
  }),

  tabs_whitespace: _element({
    textContent: 'Line 1\twith\ttabsLine 2',
    innerHTML: '<p>Line 1\twith\ttabs</p><p>Line 2</p>',
    expected: {
      markdownify: 'Line 1 with tabs\n\nLine 2',
    },
  }),

  nested_html: _element({
    textContent: 'Outer bold italic text',
    innerHTML:
      '<div><p>Outer <strong>bold <em>italic</em></strong> text</p></div>',
    expected: {
      markdownify: 'Outer **bold italic** text',
    },
  }),

  consistent_test: _element({
    textContent: 'Test bold content',
    innerHTML: '<p>Test <strong>bold</strong> content</p>',
    expected: {
      markdownify: 'Test **bold** content',
    },
  }),

  // Add specific variants only when common doesn't work
  // (to be added as needed during testing)
};

module.exports = {
  loadClassFile,
  createMockInstances,
  setupG2TMocks,
  clearAllMocks,
  createMockJQuery,
  createG2TNamespace,
  setupJSDOM,
  cleanupJSDOM,
  setupUtilsForTesting,
  createRealUtilsMethods,
  setupModelForTesting,
  createMockJQueryElement,
  elementSuperSet,
  g2t_element,
  injectJQueryAndMocks,
  console_log,
  TEST_CONFIG,
};
