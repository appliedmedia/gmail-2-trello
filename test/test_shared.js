/**
 * Shared test utilities and mocks for G2T Chrome Extension tests
 * Contains common mocks and utilities used across multiple test files
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Set up global jQuery mock at module level
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
      offset: jest.fn(() => ({ top: 1, left: 2 })),
      nextAll: jest.fn(() => ({
        find: jest.fn(() => ({
          first: jest.fn(() => ({
            attr: jest.fn(() => 'Download attachment test.png'),
          })),
        })),
      })),
      each: jest.fn(callback => {
        callback(0, element);
      }),
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
    offset: jest.fn(() => ({ top: 1, left: 2 })),
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
 * Create a comprehensive mock element with all functionality any test might need
 * @param {string} htmlContent - HTML content to mock
 * @returns {Object} - Complete mock element with all jQuery methods
 */
function elementSuperSet(htmlContent = '') {
  // Ensure htmlContent is a string
  const content = htmlContent || '';

  return {
    // Basic properties
    length: content ? 1 : 0,
    textContent: 'mock text',
    innerHTML: content || '<div>mock html</div>',
    nodeType: 1,
    tagName: 'DIV',

    // jQuery methods
    html: () => content,
    text: () => {
      // Parse HTML and extract text content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      return tempDiv.textContent || '';
    },
    attr: jest.fn(name => {
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
    prop: jest.fn(name => {
      const props = {
        src: 'https://example.com/image.png',
        alt: 'Test Image',
        type: 'image/png',
        nodeName: 'DIV',
      };
      return props[name] || 'mock-prop';
    }),
    offset: jest.fn(() => ({ top: 1, left: 2 })),
    getAttribute: jest.fn(name => {
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
    each: jest.fn(callback => {
      callback(0, elementSuperSet());
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

// Mock jQuery for testing using elementSuperSet for consistent behavior
global.$ = (selectorOrElement, context) => {
  // Case 1: $(element) - wrap a DOM element
  if (
    selectorOrElement &&
    (selectorOrElement.nodeType || selectorOrElement.getAttribute)
  ) {
    const element = selectorOrElement;
    // Use elementSuperSet for consistent element wrapping
    return elementSuperSet(element.innerHTML || element.textContent || '');
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
          callback(
            index,
            elementSuperSet(element.innerHTML || element.textContent || ''),
          );
        });
      },
      first: () => elementSuperSet(),
      offset: () => ({ top: 1, left: 2 }),
      find: () => elementSuperSet(),
      nextAll: () => elementSuperSet(),
      children: () => elementSuperSet(),
    };
  }

  // Case 3: $(selector) - find elements by selector (most common case)
  if (typeof selectorOrElement === 'string') {
    // Use elementSuperSet for consistent mock element behavior
    return elementSuperSet();
  }

  // Default behavior for other cases
  return elementSuperSet();
};

// Add $.extend as a static method
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

  addEventListener(type, listener, options) {
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
    '../chrome_manifest_v3/class_utils.js',
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
 * Helper function to create real Utils methods for testing
 * This provides actual Utils implementations for string processing methods
 * instead of mocked versions, making tests more realistic
 * @param {Object} mockApp - Mock application object
 * @returns {Object} - Object with real Utils methods bound to the mock app
 */
function createRealUtilsMethods(mockApp) {
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

  // Clear global console mocks
  console.log.mockClear();
  console.error.mockClear();
  console.warn.mockClear();

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
    find: jest.fn(() => createMockJQuery()),
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
    attr: jest.fn(),
    prop: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    append: jest.fn(),
    prepend: jest.fn(),
    empty: jest.fn(),
    remove: jest.fn(),
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

  // Global $ is already set up at module level, no need to check

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
  const mockApp = {
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

  const model = new G2T.Model({ parent: mockParent, app: mockApp });

  // Initialize model properties to match expected state
  model.trelloAuthorized = false;
  model.trelloDataReady = false;
  model.boards = [];
  model.lists = [];
  model.cards = [];
  model.members = [];
  model.labels = [];

  return { model, mockApp };
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
  createRealUtilsMethods,
  setupModelForTesting,
  createMockJQueryElement,
  elementSuperSet,
  TEST_CONFIG,
};
