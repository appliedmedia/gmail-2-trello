/**
 * Shared test utilities and mocks for G2T Chrome Extension tests
 * Contains common mocks and utilities used across multiple test files
 */

const fs = require('fs');
const path = require('path');

// Polyfill TextEncoder/TextDecoder for JSDOM's internal dependencies
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

const { JSDOM } = require('jsdom');

// ⚠️ CONSOLE.LOG IS OVERRIDEN BY JEST! Use debugOut() instead of console.log() ⚠️
// This pattern ensures debug output is visible during test development and troubleshooting
const { log: debugOut } = require('console');

// Set up JSDOM environment at module level
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  runScripts: 'dangerously',
  resources: 'usable',
  url: 'http://localhost',
});

// Make window and document available globally
window = dom.window;
document = dom.window.document;

// Load jQuery into the environment
const jqueryPath = path.join(
  __dirname,
  '../chrome_manifest_v3/lib/jquery-3.7.1.min.js',
);
const jqueryContent = fs.readFileSync(jqueryPath, 'utf8');

// Execute jQuery in the JSDOM context
dom.window.eval(jqueryContent);

// Wait for jQuery to be available
if (!dom.window.$ || !dom.window.jQuery) {
  throw new Error('jQuery failed to load in JSDOM environment');
}

// Make sure jQuery is available on our window reference
window.$ = dom.window.$;
window.jQuery = dom.window.jQuery;

// Set up global mocks
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
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    getURL: jest.fn(),
  },
};

window.Trello = {
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
  del: jest.fn(),
};

class G2T_TestSuite {
  constructor() {
    this.dom = null;
  }

  /**
   * Load a source file using the DOM trick (script injection)
   * @param {string} filePath - Path to the source file
   */
  static loadSourceFile(filePath) {
    // Resolve paths relative to project root (go up one level from test/)
    const fullPath = path.join(__dirname, '..', filePath);

    try {
      const fileContent = fs.readFileSync(fullPath, 'utf8');

      // Create a script element and inject the code
      const script = document.createElement('script');
      script.textContent = fileContent;
      document.head.appendChild(script);
    } catch (error) {
      debugOut(`Error loading source file ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Create a jQuery element from HTML content with properties merged in
   * @param {string|Object} elementData - HTML string or object with html/outerHTML/innerHTML
   * @returns {Object} - jQuery object with all passed properties merged in
   */
  asJQueryElement(elementInput = '') {
    const useElementAsObject =
      typeof elementInput === 'object' && elementInput !== null;

    const div = window.$('<div></div>');

    // Extract HTML content
    const htmlContent =
      (useElementAsObject ? elementInput.html : elementInput) || ''; // Assuming it's a string
    div.html(htmlContent);

    // Merge properties only if elementInput is a valid object
    if (useElementAsObject) {
      // Exclude html property to avoid conflicts with actual DOM properties
      const { html, ...fields } = elementInput;
      void html; // Explicitly acknowledge we're not using html
      Object.assign(div, fields);
    }

    return div;
  }

  /**
   * Create a test element with expected results attached
   * @param {Object} elementData - Element data with html and expected properties
   * @returns {Object} - jQuery element with expected results and common properties
   */
  e(elementInput) {
    // Merge elementData with common defaults, elementData takes precedence
    const commonElementFields = {
      length: 1,
      features: true,
    };
    const merged = { ...commonElementFields, ...elementInput };
    return this.asJQueryElement(merged);
  }

  /**
   * Create real Utils methods for testing
   * @param {Object} [app] - Optional app object to use instead of default
   * @returns {Object} - Real Utils instance
   */
  createRealUtilsMethods(app = null) {
    // Use provided app or create a simple test app for Utils initialization
    const utilsTestApp = app || {
      utils: { log: debugOut },
      persist: { storageHashes: {} },
      temp: {
        log: { debugMode: false, memory: [], count: 0, max: 100 },
      },
    };

    // Utils class is already loaded at module level

    // Create and return the real Utils instance
    return new window.G2T.Utils({ app: utilsTestApp });
  }

  /**
   * Set up JSDOM environment for testing
   * @returns {Object} - Object containing dom and window references
   */
  setupJSDOM() {
    // Create JSDOM instance with script execution enabled
    this.dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'http://localhost',
    });

    this.window = this.dom.window;

    // Set up global mocks on the JSDOM window
    this.window.chrome = {
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

    this.window.Trello = {
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
      del: jest.fn(),
    };

    return { dom: this.dom, window: this.dom.window };
  }

  /**
   * Load all required source files
   */
  loadSources() {
    // Load jQuery into the environment
    this.loadSourceFile('../chrome_manifest_v3/lib/jquery-3.7.1.min.js');

    // Load EventTarget class
    this.loadSourceFile('../chrome_manifest_v3/class_eventTarget.js');
  }

  /**
   * Clean up JSDOM environment after testing
   */
  cleanupJSDOM() {
    if (this.dom && this.dom.window) {
      this.dom.window.close();
    }
  }

  /**
   * Create mock instances for G2T classes
   * @returns {Object} - Object containing mock instances
   */
  createMockInstances() {
    return {
      mockChrome: {
        init: jest.fn(),
        runtimeSendMessage: jest.fn(),
        storageSyncGet: jest.fn(),
        storageSyncSet: jest.fn(),
      },
      mockEventTarget: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        addListener: jest.fn(),
        fire: jest.fn(),
        emit: jest.fn(),
      },
      mockModel: {
        init: jest.fn(),
        trello: { user: { fullName: 'Test User' } },
        gmail: {},
      },
      mockGmailView: {
        init: jest.fn(),
        bindData: jest.fn(),
        parseData: jest.fn(() => ({})),
        forceRedraw: jest.fn(),
        parsingData: false,
      },
      mockPopupView: {
        init: jest.fn(),
        bindData: jest.fn(),
        bindGmailData: jest.fn(),
      },
      mockUtils: {
        init: jest.fn(),
        loadFromChromeStorage: jest.fn(),
        saveToChromeStorage: jest.fn(),
        log: jest.fn(),
        djb2Hash: jest.fn(() => 'mock-hash'),
        escapeRegExp: jest.fn(str =>
          str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
        anchorMarkdownify: jest.fn(),
        markdownify: jest.fn(),
        markdownify_sortByLength: jest.fn(),
        markdownify_featureEnabled: jest.fn(),
      },
      waitCounter: {
        start: jest.fn(),
        stop: jest.fn(),
      },
    };
  }

  /**
   * Clear all Jest mocks
   */
  clearAllMocks() {
    jest.clearAllMocks();
  }
}

// Load the Utils class at module level using static method
G2T_TestSuite.loadSourceFile('chrome_manifest_v3/class_utils.js');

// Create test suite instance
const _ts = new G2T_TestSuite();

// Export the test suite instance and individual functions for backward compatibility
module.exports = {
  _ts,
  loadSourceFile: (...args) => G2T_TestSuite.loadSourceFile(...args),
  setupJSDOM: (...args) => _ts.setupJSDOM(...args),
  cleanupJSDOM: (...args) => _ts.cleanupJSDOM(...args),
  createRealUtilsMethods: (...args) => _ts.createRealUtilsMethods(...args),
  createJQueryElement: (...args) => _ts.asJQueryElement(...args),
  debugOut,
};

// end, test_shared.js
