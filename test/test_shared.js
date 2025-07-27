/**
 * Shared test utilities and mocks for G2T Chrome Extension tests
 * Contains common mocks and utilities used across multiple test files
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

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
 * Mock jQuery object that mimics what markdownify expects
 */
function createMockJQueryElement(htmlContent) {
  // Ensure htmlContent is a string
  const content = htmlContent || '';

  return {
    html: () => content,
    length: content ? 1 : 0,
    text: () => {
      // Parse HTML and extract text content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      return tempDiv.textContent || '';
    },
  };
}

// Mock jQuery for testing
global.$ = (selectorOrElement, context) => {
  // Case 1: $(element) - wrap a DOM element
  if (selectorOrElement && selectorOrElement.nodeType) {
    const element = selectorOrElement;
    return {
      text: () => element.textContent || '',
      html: () => element.innerHTML || '',
      attr: name => element.getAttribute(name) || '',
      prop: name => {
        if (name === 'nodeName') {
          return element.nodeName || element.tagName || '';
        }
        return element[name] || '';
      },
    };
  }

  // Case 2: $(selector, context) - find elements in context
  if (context && context.html) {
    const selector = selectorOrElement;
    const contextContent = context.html();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contextContent;
    const elements = Array.from(tempDiv.querySelectorAll(selector));

    return {
      length: elements.length,
      each: callback => {
        elements.forEach((element, index) => {
          callback(index, element);
        });
      },
    };
  }

  // Default behavior for other cases
  return {
    length: 0,
    each: () => {},
    text: () => '',
    html: () => '',
    attr: () => '',
  };
};

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
 * Helper function to load and setup Utils class for testing
 * @returns {Object} - Object containing utils instance and mockApp
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
    '../chrome_manifest_v3/class_utils.js'
  );
  const utilsCode = fs.readFileSync(utilsPath, 'utf8');

  // Create local reference for eval scope
  var G2T = global.G2T;
  eval(utilsCode);

  // Create mock application for Utils class
  const mockApp = {
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

  // Create Utils instance
  const utils = new global.G2T.Utils({ app: mockApp });

  return { utils, mockApp };
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
    fire: jest.fn(),
    emit: jest.fn()
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
  // Note: $ is not a Jest mock function, so we don't clear it
  // $.mockClear();
  chrome.storage.local.get.mockClear();
  chrome.storage.local.set.mockClear();
  chrome.storage.sync.get.mockClear();
  chrome.storage.sync.set.mockClear();
  chrome.runtime.sendMessage.mockClear();
  console.log.mockClear();
  console.error.mockClear();
  console.warn.mockClear();
  
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
 * Setup JSDOM environment for testing
 * @returns {Object} - Object containing dom, window, document
 */
function setupJSDOM() {
  // Create JSDOM instance with proper configuration
  const dom = new JSDOM(
    '<!DOCTYPE html><html><body></body></html>',
    TEST_CONFIG.jsdomOptions
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

  // Ensure global $ is available for the test environment
  if (!global.$) {
    global.$ = (selectorOrElement, context) => {
      // Case 1: $(element) - wrap a DOM element
      if (selectorOrElement && selectorOrElement.nodeType) {
        const element = selectorOrElement;
        return {
          text: () => element.textContent || '',
          html: () => element.innerHTML || '',
          attr: name => element.getAttribute(name) || '',
          prop: name => {
            if (name === 'nodeName') {
              return element.nodeName || element.tagName || '';
            }
            return element[name] || '';
          },
        };
      }

      // Case 2: $(selector, context) - find elements in context
      if (context && context.html) {
        const selector = selectorOrElement;
        const contextContent = context.html();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = contextContent;
        const elements = Array.from(tempDiv.querySelectorAll(selector));

        return {
          length: elements.length,
          each: callback => {
            elements.forEach((element, index) => {
              callback(index, element);
            });
          },
        };
      }

      // Default behavior for other cases
      return {
        length: 0,
        each: () => {},
        text: () => '',
        html: () => '',
        attr: () => '',
      };
    };
  }

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
  delete global.$;
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
  createG2TNamespace,
  setupJSDOM,
  cleanupJSDOM,
  setupUtilsForTesting,
  createMockJQueryElement,
  TEST_CONFIG
};