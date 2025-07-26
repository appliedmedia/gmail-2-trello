/**
 * Shared test utilities and mocks for G2T Chrome Extension tests
 * Contains common mocks and utilities used across multiple test files
 */

// Mock jQuery for testing
global.$ = jest.fn((selector, context) => {
  if (typeof selector === 'string' && context) {
    // Handle $(selector, context) pattern used in markdownify
    return createMockJQuery(context.html ? context.html() : '');
  }
  return createMockJQuery('');
});

// Mock chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  runtime: {
    sendMessage: jest.fn()
  }
};

// Mock console for testing
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Initialize G2T global object
global.G2T = global.G2T || {};

// Mock document object
global.document = {
  createElement: jest.fn((tagName) => {
    if (tagName === 'textarea') {
      let innerHTML = '';
      let value = '';
      return {
        get innerHTML() { return innerHTML; },
        set innerHTML(val) { 
          innerHTML = val; 
          // Simulate how textarea.innerHTML affects value
          value = val.replace(/<[^>]*>/g, '');
        },
        get value() { return value; },
        set value(val) { value = val; },
        style: {
          cssText: ''
        },
        setAttribute: jest.fn(),
        getAttribute: jest.fn(),
        appendChild: jest.fn(),
        removeChild: jest.fn()
      };
    }
    return {
      innerHTML: '',
      textContent: '',
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
      appendChild: jest.fn(),
      removeChild: jest.fn()
    };
  }),
  createTextNode: jest.fn((text) => ({ textContent: text })),
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock window object
global.window = {
  location: {
    hash: '#test-hash'
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  console: global.console,
  document: global.document
};

// Mock analytics
global.analytics = {
  track: jest.fn(),
  getService: jest.fn(() => ({
    getTracker: jest.fn(() => ({
      sendAppView: jest.fn()
    }))
  }))
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
 * Helper function to create mock instances for G2T classes
 * @returns {Object} - Object containing mock instances
 */
function createMockInstances() {
  const mockChrome = {
    init: jest.fn(),
    runtimeSendMessage: jest.fn(),
    storageSyncGet: jest.fn(),
    storageSyncSet: jest.fn()
  };

  const mockEventTarget = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    addListener: jest.fn(),
    fire: jest.fn()
  };

  const mockModel = {
    init: jest.fn(),
    trello: {
      user: { fullName: 'Test User' }
    },
    gmail: {}
  };

  const mockGmailView = {
    init: jest.fn(),
    bindData: jest.fn(),
    parseData: jest.fn(() => ({})),
    forceRedraw: jest.fn(),
    parsingData: false
  };

  const mockPopupView = {
    init: jest.fn(),
    bindData: jest.fn(),
    bindGmailData: jest.fn()
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
    markdownify_featureEnabled: jest.fn()
  };

  return {
    mockChrome,
    mockEventTarget,
    mockModel,
    mockGmailView,
    mockPopupView,
    mockUtils
  };
}

/**
 * Helper function to create a constructor function for a G2T class
 * @param {Object} mockInstance - Mock instance object
 * @param {string} className - Name of the class
 * @returns {Function} - Constructor function
 */
function createG2TConstructor(mockInstance, className) {
  return function(args) {
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
    mockUtils
  } = mockInstances;

  // Create actual constructor functions that can be called with 'new'
  G2T.Chrome = createG2TConstructor(mockChrome, 'Chrome');
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
  $.mockClear();
  chrome.storage.local.get.mockClear();
  chrome.storage.local.set.mockClear();
  chrome.storage.sync.get.mockClear();
  chrome.storage.sync.set.mockClear();
  chrome.runtime.sendMessage.mockClear();
  console.log.mockClear();
  console.error.mockClear();
  console.warn.mockClear();
  window.addEventListener.mockClear();
  window.removeEventListener.mockClear();
  if (global.analytics) {
    global.analytics.track.mockClear();
    global.analytics.getService.mockClear();
  }
}

/**
 * Default HTML element structure for common test scenarios
 */
const DEFAULT_HTML_ELEMENTS = [
  { tagName: 'P', textContent: 'Test paragraph', attributes: {} },
  { tagName: 'DIV', textContent: 'Test div', attributes: {} },
  { tagName: 'BR', textContent: '', attributes: {} },
  { tagName: 'HR', textContent: '', attributes: {} },
  { tagName: 'STRONG', textContent: 'Bold text', attributes: {} },
  { tagName: 'EM', textContent: 'Italic text', attributes: {} },
  { tagName: 'U', textContent: 'Underlined text', attributes: {} },
  { tagName: 'STRIKE', textContent: 'Strikethrough text', attributes: {} },
  { tagName: 'H1', textContent: 'Heading 1', attributes: {} },
  { tagName: 'H2', textContent: 'Heading 2', attributes: {} },
  { tagName: 'H3', textContent: 'Heading 3', attributes: {} },
  { tagName: 'A', textContent: 'Link text', attributes: { href: '#' } }
];

/**
 * Helper function to extract HTML content from various input types
 * @param {any} input - Input that might contain HTML content
 * @returns {string} - HTML content string
 */
function extractHtmlContent(input) {
  if (typeof input === 'string') {
    return input;
  }
  
  if (input && typeof input === 'object') {
    // Handle objects with html() method (like jQuery objects or test mocks)
    if (typeof input.html === 'function') {
      return input.html();
    }
    
    // Handle objects with html property
    if (input.html !== undefined) {
      return input.html;
    }
    
    // Handle objects with innerHTML property
    if (input.innerHTML !== undefined) {
      return input.innerHTML;
    }
  }
  
  return '';
}

/**
 * Helper function to create a mock jQuery object
 * @param {string|Array} htmlOrElements - HTML content string or array of element objects
 * @param {Array} customElements - Optional custom elements to add or replace defaults
 * @returns {Object} - Mock jQuery object
 */
function createMockJQuery(htmlOrElements = '', customElements = []) {
  // For simple cases (which is what the tests are using), just return the HTML content directly
  if (typeof htmlOrElements === 'string') {
    const mockJQuery = {
      html: () => htmlOrElements,
      length: 1,
      find: jest.fn(() => createMockJQuery()),
      each: jest.fn((callback) => {
        const element = { tagName: 'DIV', textContent: htmlOrElements };
        callback.call({ text: () => element.textContent }, 0, element);
        return mockJQuery;
      }),
      text: jest.fn(() => htmlOrElements.replace(/<[^>]*>/g, '')),
      attr: jest.fn(() => undefined),
      addClass: jest.fn(),
      removeClass: jest.fn(),
      val: jest.fn(),
      prop: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
      append: jest.fn(),
      prepend: jest.fn(),
      empty: jest.fn(),
      remove: jest.fn()
    };
    return mockJQuery;
  }
  
  // For objects with html() method (like the test mocks)
  if (htmlOrElements && typeof htmlOrElements === 'object' && typeof htmlOrElements.html === 'function') {
    const content = htmlOrElements.html();
    const mockJQuery = {
      html: () => content,
      length: 1,
      find: jest.fn(() => createMockJQuery()),
      each: jest.fn((callback) => {
        const element = { tagName: 'DIV', textContent: content };
        callback.call({ text: () => element.textContent }, 0, element);
        return mockJQuery;
      }),
      text: jest.fn(() => content.replace(/<[^>]*>/g, '')),
      attr: jest.fn(() => undefined),
      addClass: jest.fn(),
      removeClass: jest.fn(),
      val: jest.fn(),
      prop: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
      append: jest.fn(),
      prepend: jest.fn(),
      empty: jest.fn(),
      remove: jest.fn()
    };
    return mockJQuery;
  }
  
  // For arrays of elements (more complex cases)
  if (Array.isArray(htmlOrElements)) {
    const elements = [...htmlOrElements, ...customElements];
    const htmlContent = elements.map(el => `<${el.tagName.toLowerCase()}>${el.textContent}</${el.tagName.toLowerCase()}>`).join('');
    
    const mockJQuery = {
      html: () => htmlContent,
      length: elements.length,
      find: jest.fn(() => createMockJQuery()),
      each: jest.fn((callback) => {
        elements.forEach((element, index) => {
          const $element = createMockJQuery([element]);
          $element.text = jest.fn(() => element.textContent);
          $element.attr = jest.fn((attr) => element.attributes[attr]);
          callback.call($element, index, element);
        });
        return mockJQuery;
      }),
      text: jest.fn(() => elements.map(el => el.textContent).join('')),
      attr: jest.fn((attr) => {
        if (elements.length === 1) return elements[0].attributes[attr];
        return undefined;
      }),
      addClass: jest.fn(),
      removeClass: jest.fn(),
      val: jest.fn(),
      prop: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
      append: jest.fn(),
      prepend: jest.fn(),
      empty: jest.fn(),
      remove: jest.fn()
    };
    return mockJQuery;
  }
  
  // Default fallback
  const mockJQuery = {
    html: () => '',
    length: 0,
    find: jest.fn(() => createMockJQuery()),
    each: jest.fn(() => mockJQuery),
    text: jest.fn(() => ''),
    attr: jest.fn(() => undefined),
    addClass: jest.fn(),
    removeClass: jest.fn(),
    val: jest.fn(),
    prop: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    append: jest.fn(),
    prepend: jest.fn(),
    empty: jest.fn(),
    remove: jest.fn()
  };
  return mockJQuery;
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
    mockUtils
  } = mockInstances;

  // Create actual constructor functions that can be called with 'new'
  const G2T = {
    Chrome: createG2TConstructor(mockChrome, 'Chrome'),
    EventTarget: createG2TConstructor(mockEventTarget, 'EventTarget'),
    Model: createG2TConstructor(mockModel, 'Model'),
    GmailView: createG2TConstructor(mockGmailView, 'GmailView'),
    PopupView: createG2TConstructor(mockPopupView, 'PopupView'),
    Utils: createG2TConstructor(mockUtils, 'Utils')
  };

  return G2T;
}

module.exports = {
  loadClassFile,
  createMockInstances,
  setupG2TMocks,
  clearAllMocks,
  createMockJQuery,
  createG2TNamespace
};