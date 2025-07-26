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
      return {
        innerHTML: '',
        value: '',
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
 * Helper function to create a mock jQuery object
 * @param {string} html - HTML content
 * @returns {Object} - Mock jQuery object
 */
function createMockJQuery(html = '') {
  const mockJQuery = {
    html: () => html,
    length: html ? 1 : 0,
    find: jest.fn(() => createMockJQuery()),
    each: jest.fn((callback) => {
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
            const regex = new RegExp(`<${tagName}[^>]*>(.*?)</${tagName}>`, 'i');
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
    attr: jest.fn(),
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