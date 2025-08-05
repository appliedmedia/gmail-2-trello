/**
 * Shared test utilities and mocks for G2T Chrome Extension tests
 * Contains common mocks and utilities used across multiple test files
 */

const fs = require('fs');
const path = require('path');

// Bridge Node.js and JSDOM environments properly
// Step 1: Global polyfills for JSDOM's initial loading
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

const { JSDOM } = require('jsdom');

// ⚠️ CONSOLE.LOG IS OVERRIDEN BY JEST! Use debugOut() instead of console.log() ⚠️
// This pattern ensures debug output is visible during test development and troubleshooting
const debugOut = jest.fn(require('console').log);

// Step 2: Set up JSDOM environment with proper Node.js connection
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  runScripts: 'dangerously',
  resources: 'usable',
  url: 'http://localhost',
  beforeParse(window) {
    // Properly connect Node.js globals to JSDOM window environment
    // This ensures any code running in the JSDOM context has access to these
    window.TextEncoder = require('util').TextEncoder;
    window.TextDecoder = require('util').TextDecoder;
  },
});

// Make window and document available globally
// eslint-disable-next-line no-global-assign
window = dom.window;
// eslint-disable-next-line no-global-assign
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
  rest: jest.fn(),
};

// Mock window.location.reload to prevent JSDOM errors
window.location.reload = jest.fn();

// Mock window.confirm
window.confirm = jest.fn();

// Mock window.console.log
window.console.log = jest.fn();

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
   * Instance version of loadSourceFile
   */
  loadSourceFile(filePath) {
    G2T_TestSuite.loadSourceFile(filePath);
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
      duration_max_ms: 300,
    };
    const merged = { ...commonElementFields, ...elementInput };
    return this.asJQueryElement(merged);
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
   * Create a complete App instance with nested mock classes for testing
   * Uses real Utils instance with mocked dependencies
   * @returns {Object} - Complete App instance ready for testing
   */
  createApp() {
    // Define all mock classes using let to allow reassignment
    let Goog = class {
      constructor({ app }) {
        this.app = app;
        this.init = jest.fn();
        this.runtimeSendMessage = jest.fn();
        this.storageSyncGet = jest.fn();
        this.storageSyncSet = jest.fn();
      }
    };

    let EventTarget = class {
      constructor({ app }) {
        this.app = app;
        this.addEventListener = jest.fn();
        this.removeEventListener = jest.fn();
        this.dispatchEvent = jest.fn();
        this.addListener = jest.fn();
        this.fire = jest.fn();
        this.emit = jest.fn();
      }
    };

    let Model = class {
      constructor({ app }) {
        this.app = app;
        this.init = jest.fn();
        this.trello = { user: { fullName: 'Test User' } };
        this.gmail = {};
      }
    };

    let GmailView = class {
      constructor({ app }) {
        this.app = app;
        this.init = jest.fn();
        this.bindData = jest.fn();
        this.parseData = jest.fn(() => ({}));
        this.forceRedraw = jest.fn();
        this.parsingData = false;
      }
    };

    let PopupForm = class {
      constructor({ app }) {
        this.app = app;
        this.init = jest.fn();
        this.bindEvents = jest.fn();
        this.bindData = jest.fn();
        this.bindGmailData = jest.fn();
        this.validateData = jest.fn();
        this.reset = jest.fn();
        this.submit = jest.fn();
      }
    };

    let PopupView = class {
      constructor({ app }) {
        this.app = app;
        this.$toolBar = null;
        this.finalCreatePopup = jest.fn();
        this.displayExtensionInvalidReload = jest.fn();
        this.init = jest.fn();
        this.bindData = jest.fn();
        this.bindGmailData = jest.fn();
        this.forceRedraw = jest.fn();
      }

      static get ck() {
        return { id: 'g2t_popupview' };
      }

      get ck() {
        return PopupView.ck;
      }
    };

    let MenuControl = class {
      constructor({ app }) {
        this.app = app;
        this.reset = jest.fn();
        this.bindEvents = jest.fn();
        this.items = [];
        this.nonexclusive = false;
      }

      static get ck() {
        return { id: 'g2t_menuControl' };
      }

      get ck() {
        return MenuControl.ck;
      }
    };

    // Use the real Utils class directly - much simpler!

    let WaitCounter = class {
      constructor({ app }) {
        this.app = app;
        this.start = jest.fn();
        this.stop = jest.fn();
      }
    };

    let App = class {
      constructor() {
        // Create instances exactly like real App constructor
        this.trelloApiKey = '21b411b1b5b549c54bd32f0e90738b41';
        this.goog = new Goog({ app: this });
        this.events = new EventTarget({ app: this });
        this.model = new Model({ app: this });
        this.gmailView = new GmailView({ app: this });
        this.popupView = new PopupView({ app: this });
        // Use real Utils class and override only the log method for testing
        this.utils = new G2T.Utils({ app: this });
        this.utils.log = debugOut;

        // Set up default persistent state (matches App class defaults)
        this.persist = {
          layoutMode: 0,
          trelloAuthorized: false,
          user: null,
          emailBoardListCardMap: [],
          popupWidth: 700,
          popupHeight: 464,
          storageHashes: {},
          boardId: null,
          listId: null,
          cardId: null,
          useBackLink: true,
          addCC: false,
          labelsId: '',
          membersId: '',
        };

        // Set up default temporary state (matches App class defaults)
        this.temp = {
          lastHash: '',
          updatesPending: [],
          comboInitialized: false,
          pendingMessage: null,
          description: '',
          title: '',
          attachment: [],
          image: [],
          boards: [],
          lists: [],
          cards: [],
          members: [],
          labels: [],
          log: {
            memory: [],
            count: 0,
            max: 100,
            debugMode: false,
          },
        };

        // Initialize flag
        this.initialized = false;
      }

      // Add the static and instance ck getters
      static get ck() {
        return { id: 'g2t_app' };
      }

      get ck() {
        return App.ck;
      }
    };

    // Set up window.G2T namespace with all classes using iteration
    if (!window.G2T) {
      window.G2T = {};
    }

    // Set up all mock classes in window.G2T namespace
    const classes = {
      App,
      EventTarget,
      GmailView,
      Goog,
      MenuControl,
      Model,
      PopupForm,
      PopupView,
      WaitCounter,
    };

    // Note: Utils is NOT included here because we use the real G2T.Utils class
    Object.entries(classes).forEach(([className, ClassConstructor]) => {
      if (!window.G2T[className]) {
        window.G2T[className] = ClassConstructor;
      }
    });

    return new window.G2T.App();
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

// Create actual Utils instance for use across all tests
const utils = new G2T.Utils({ app: null });

// Create test suite instance
const _ts = new G2T_TestSuite();

// Set up ALL mock classes immediately at module level
// This creates the base mock environment that individual test files can override
const testApp = _ts.createApp();

// Export the test suite instance and class for direct access
module.exports = {
  G2T_TestSuite,
  _ts,
  utils,
  debugOut,
  testApp, // Pre-created mock app with all dependencies
};

// end, test_shared.js
