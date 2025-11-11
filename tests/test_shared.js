/**
 * Shared test utilities and mocks for G2T Chrome Extension tests
 * Contains common mocks and utilities used across multiple test files
 */

const _DEBUG = false; // Set to true to see debug output

const fs = require('fs');
const path = require('path');

var window = window || {};
var document = document || {};
var G2T = G2T || {}; // must be var to guarantee correct scope - do not alter this line

// Bridge Node.js and JSDOM environments properly
// Step 1: Global polyfills for JSDOM's initial loading
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

const { JSDOM } = require('jsdom');

// ⚠️ CONSOLE.LOG IS OVERRIDEN BY JEST! Use debugOut() instead of console.log() ⚠️
// This pattern ensures debug output is visible during test development and troubleshooting
const debugOut = jest.fn((...args) => {
  if (_DEBUG) {
    require('console').log(...args);
  }
});

// Step 2: Set up JSDOM environment with proper Node.js connection
// Load the entire HTML file directly into JSDOM
const gmailTestHTMLPath = path.join(__dirname, 'test_jsdom.html');
const gmailTestHTML = fs.readFileSync(gmailTestHTMLPath, 'utf8');

let dom;
try {
  dom = new JSDOM(gmailTestHTML, {
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
  // JSDOM created successfully
} catch (error) {
  throw new Error(`JSDOM creation failed: ${error.message}`);
}

// Make JSDOM window and document the global window and document
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
window.eval(jqueryContent);

// Load the class files into the JSDOM environment
const utilsPath = path.join(__dirname, '../chrome_manifest_v3/class_utils.js');
const utilsContent = fs.readFileSync(utilsPath, 'utf8');
window.eval(utilsContent);

// Now make G2T namespace and classes available in the Node.js context
if (window.G2T) {
  G2T = window.G2T;
} else {
  throw new Error('window.G2T not found after loading class_utils.js');
}

// Also load the GmailView class into the JSDOM environment
const gmailViewPath = path.join(
  __dirname,
  '../chrome_manifest_v3/views/class_gmailView.js',
);
const gmailViewContent = fs.readFileSync(gmailViewPath, 'utf8');
window.eval(gmailViewContent);

// Debug: Check if GmailView class is available
debugOut(
  'After loading class_gmailView.js - window.G2T.GmailView exists:',
  !!(window.G2T && window.G2T.GmailView),
);

// Spy on detectToolbar to prevent runaway errors during tests
if (window.G2T && window.G2T.GmailView) {
  window.G2T.GmailView.prototype.detectToolbar = jest.fn(() => true);
}

// Debug: Check if G2T is available in Node.js context
debugOut('G2T variable in Node.js context:', typeof G2T);
debugOut('G2T.GmailView in Node.js context:', !!(G2T && G2T.GmailView));

// Export G2T namespace so other test files can access it
module.exports.G2T = G2T;

// Wait for jQuery to be available
if (!window.$ || !window.jQuery) {
  throw new Error('jQuery failed to load in JSDOM environment');
}

// Make jQuery available on Node global for modules that reference free `jQuery`
global.$ = window.$;
global.jQuery = window.jQuery;

// Set up mocks on the global window
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
    getURL: jest.fn(path => `chrome-extension://test-id/${path}`),
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

// Mock window functions
window.location.reload = jest.fn();
window.confirm = jest.fn(() => false);

// Mock console to use debugOut for test visibility
window.console.log = debugOut;

// Mock analytics
window.analytics = {
  getService: jest.fn().mockReturnValue({
    getTracker: jest.fn().mockReturnValue({
      sendAppView: jest.fn(),
      sendEvent: jest.fn(),
    }),
  }),
};

// Mock Trello API
window.Trello = {
  rest: jest.fn(),
  authorize: jest.fn(),
  deauthorize: jest.fn(),
  authorized: jest.fn(() => false),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

// Mock Chrome Extension APIs
window.chrome = {
  storage: {
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
    getURL: jest.fn(path => `chrome-extension://mock-id/${path}`),
  },
  // Method to simulate "Extension context invalidated" error
  simulateContextInvalidation: function () {
    const error = new Error('Extension context invalidated');
    error.message = 'Extension context invalidated';
    return error;
  },
};

// Mock other common browser APIs
window.localStorage = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

window.sessionStorage = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock fetch API
window.fetch = jest.fn(() => {
  return Promise.resolve({
    ok: true,
    status: 200,
    text: () => Promise.resolve('<div>Mock HTML Content</div>'),
  });
});

// Mock XMLHttpRequest
window.XMLHttpRequest = jest.fn(() => ({
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  readyState: 4,
  status: 200,
  responseText: '',
  response: {},
}));

// Mock setTimeout and setInterval
window.setTimeout = jest.fn((callback /* , delay */) => {
  if (typeof callback === 'function') {
    callback();
  }
  return 1;
});
window.setInterval = jest.fn((callback /* , delay */) => {
  if (typeof callback === 'function') {
    callback();
  }
  return 1;
});
window.clearTimeout = jest.fn();
window.clearInterval = jest.fn();

// Mock addEventListener and removeEventListener
window.addEventListener = jest.fn();
window.removeEventListener = jest.fn();

// Mock confirm function
window.confirm = jest.fn(() => false);

// Also expose on Node global for any modules/tests that reference free `analytics`
global.analytics = window.analytics;

// Also expose Chrome API globally for any modules/tests that reference free `chrome`
global.chrome = window.chrome;

// Gmail DOM elements are now defined in test_jsdom.html

// Fetch mock is now set up above with the other global mocks

// Note: no $.get override; tests use Utils.loadFile() backed by fetch stub

// No $.get override needed; Utils.loadFile uses fetch stub above

class G2T_TestSuite {
  constructor() {
    // No need to store dom reference since window and document are now global
  }

  /**
   * Load a source file and optionally inject it into the DOM
   * @param {string} filePath - Path to the source file relative to project root
   * @param {boolean} scriptInject - Whether to inject as script (default: true)
   * @returns {string} - File content (always returned)
   */
  static loadSourceFile(filePath, scriptInject = true) {
    let fileContent = '';

    // Resolve paths relative to project root (go up one level from tests/)
    const fullPath = path.join(__dirname, '..', filePath);

    try {
      fileContent = fs.readFileSync(fullPath, 'utf8');

      if (scriptInject) {
        // Create a script element and inject the code
        const script = document.createElement('script');
        script.textContent = fileContent;
        document.head.appendChild(script);
      }
    } catch (error) {
      debugOut(`Error loading source file ${filePath}:`, error.message);
    }

    return fileContent;
  }

  /**
   * Instance version of loadSourceFile
   */
  loadSourceFile(filePath, scriptInject = true) {
    return G2T_TestSuite.loadSourceFile(filePath, scriptInject);
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

  // JSDOM environment is now set up at module level in test_jsdom.html

  /**
   * Load all required source files
   */
  loadSources() {
    // Load jQuery into the environment
    this.loadSourceFile('chrome_manifest_v3/lib/jquery-3.7.1.min.js');

    // Load jQuery UI (provides $.widget)
    this.loadSourceFile('chrome_manifest_v3/lib/jquery-ui-1.14.1.min.js');

    // Load the real combobox implementation
    this.loadSourceFile('chrome_manifest_v3/lib/combo.js');

    // Mock other jQuery plugins that tests might need
    if (window.$ && window.$.fn) {
      window.$.fn.button = jest.fn();
      window.$.fn.tooltip = jest.fn();
      window.$.fn.popover = jest.fn();

      // Mock the g2t_combobox widget for tests
      window.$.fn.g2t_combobox = jest.fn(function (method, ...args) {
        if (method === 'setInputValue') {
          // Handle setInputValue method
          return this;
        }
        // Default behavior - just return the jQuery object for chaining
        return this;
      });
    }

    // EventTarget class will be loaded by individual test files as needed

    // Redirect console.log to debugOut for cleaner test output
    if (window.console) {
      window.console.log = debugOut;
    }
  }

  // JSDOM cleanup is handled automatically by Jest

  // Mock instances are created in createApp() method and global mocks

  /**
   * Create a complete App instance with nested mock classes for testing
   * Uses real Utils instance with mocked dependencies
   * @returns {Object} - Complete App instance ready for testing
   */
  createApp() {
    // Load sources and set up jQuery plugin mocks
    this.loadSources();

    // Define all mock classes using let to allow reassignment
    let Goog = class {
      constructor({ app }) {
        this.app = app;
        this.init = jest.fn();
        this.runtimeSendMessage = jest.fn();
        this.storageSyncGet = jest.fn();
        this.storageSyncSet = jest.fn();
        this.runtimeGetURL = jest.fn(
          path => `chrome-extension://test-id/${path}`,
        );
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
        this.preDetect = jest.fn(() => true);
      }
    };

    let PopupForm = class {
      constructor({ app, parent }) {
        this.app = app;
        this.parent = parent;
        this.isInitialized = false;
        this.init = jest.fn();
        this.bindEvents = jest.fn();
        this.bindData = jest.fn();
        this.bindGmailData = jest.fn();
        this.reset = jest.fn();
        this.submit = jest.fn();
        this.showMessage = (target, message) =>
          debugOut('PopupForm showMessage:', { target, message });
        this.hideMessage = () => debugOut('PopupForm hideMessage called');
      }

      static get ck() {
        return { id: 'g2t_popupform' };
      }

      get ck() {
        return PopupForm.ck;
      }
    };

    let Observer = class {
      constructor({ app }) {
        this.app = app;
      }
      init() {}
      observeToolbar() {}
    };

    let PopupView = class {
      constructor({ app }) {
        this.app = app;
        this.$toolBar = null;
        this.isInitialized = false;
        this.dataDirty = true;
        this.posDirty = false;
        this.MAX_BODY_SIZE = 16384;
        this.mouseDownTracker = {};
        this.lastError = '';
        this.intervalId = 0;
        this.updatesPending = [];
        this.comboInitialized = false;
        this.size_k = {
          width: { min: 700, max: window.innerWidth - 16 },
          height: { min: 464, max: 1400 },
          text: { min: 111 },
        };
        this.form = new PopupForm({ app, parent: this });
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

    // Minimal WaitCounter placeholder for constructing the mock app tree; real class will override
    let WaitCounter = class {
      constructor({ app }) {
        this.app = app;
      }
      start() {}
      stop() {}
    };

    let Trel = class {
      constructor({ app }) {
        this.app = app;
        this.authorized = false;
        this.user = null;
        this.boards = [];
        this.lists = [];
        this.cards = [];
        this.members = [];
        this.labels = [];
      }
      getMembers(boardId) {
        return Promise.resolve([]);
      }
      getLabels(boardId) {
        return Promise.resolve([]);
      }
      createCard(cardData) {
        return Promise.resolve({ id: 'test-card-id' });
      }
      getUser() {
        return Promise.resolve({ id: 'test-user-id', fullName: 'Test User' });
      }
      deauthorize() {
        this.authorized = false;
        this.user = null;
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
        this.obs = new Observer({ app: this });
        this.trel = new Trel({ app: this });
        // Use real Utils class and override only the log method for testing
        this.utils = new G2T.Utils({ app: this });
        this.utils.log = debugOut;

        // No separate chrome alias; source now calls app.goog.* directly

        // Set up default persistent state (matches App class defaults)
        this.persist = {
          layoutMode: 0,
          trelloAuthorized: false,
          user: null,
          eblcmArray: [],
          popupWidth: 700,
          popupHeight: 464,
          storageHashes: {},
          boardId: null,
          listId: null,
          cardId: null,
          useBackLink: true,
          addCC: false,
          markdown: true,
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

    // Set up all mock classes in the G2T namespace
    const classes = {
      App,
      EventTarget,
      GmailView,
      Goog,
      Observer,
      MenuControl,
      Model,
      PopupForm,
      PopupView,
      Trel,
      WaitCounter,
    };

    // Assign all classes to G2T namespace
    Object.entries(classes).forEach(([className, ClassConstructor]) => {
      G2T[className] = ClassConstructor;
    });

    return new App();
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

// Set up ALL mock classes immediately at module level
// This creates the base mock environment that individual test files can override
const testApp = _ts.createApp();

// Export the test suite instance and class for direct access
module.exports = {
  G2T_TestSuite,
  _ts,
  debugOut,
  testApp, // Pre-created mock app with all dependencies
  G2T, // Export the G2T namespace so other test files can access it
  window, // Export the JSDOM window so other test files can access it
  document, // Export the JSDOM document so other test files can access it
};

// end, test_shared.js
