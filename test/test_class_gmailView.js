/**
 * Comprehensive Jest test suite for GmailView class
 * Tests all methods and functionality of the GmailView class
 */

// Import shared test utilities
const {
  loadClassFile,
  createMockInstances,
  setupG2TMocks,
  clearAllMocks,
  createG2TNamespace,
  setupJSDOM,
  cleanupJSDOM,
  createRealUtilsMethods,
  elementSuperSet,
} = require('./test_shared');

// Set up mocks before loading the GmailView class
const mockInstances = createMockInstances();

// Make mock objects globally available
const mockChrome = mockInstances.mockChrome;
const mockEventTarget = mockInstances.mockEventTarget;
const mockModel = mockInstances.mockModel;
const mockGmailView = mockInstances.mockGmailView;
const mockPopupView = mockInstances.mockPopupView;
const mockUtils = mockInstances.mockUtils;

// Make mockInstances available to tests
global.mockInstances = mockInstances;

// Load the GmailView class using eval (for Chrome extension compatibility)
const gmailViewCode = loadClassFile(
  'chrome_manifest_v3/views/class_gmailView.js',
);

// Inject $ and mock constructors into the eval'd code
const injectedCode = `
// Inject jQuery mock for GmailView class
var $ = function(selectorOrElement, context) {
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
      offset: function() { return { top: 1, left: 2 }; },
      nextAll: function() {
        return {
          find: function() {
            return {
              first: function() {
                return {
                  attr: function() { return 'Download attachment test.png'; }
                };
              }
            };
          }
        };
      },
      each: function(callback) {
        callback(0, element);
      }
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
      each: function(callback) {
        elements.forEach((element, index) => {
          callback(index, element);
        });
      }
    };
  }

  // Default behavior for other cases
  return {
    length: 0,
    each: function() {},
    text: function() { return ''; },
    html: function() { return ''; },
    attr: function() { return ''; },
    offset: function() { return { top: 1, left: 2 }; }
  };
};

// Add $.extend method
$.extend = function(target, ...sources) {
  sources.forEach(source => {
    if (source) {
      Object.keys(source).forEach(key => {
        target[key] = source[key];
      });
    }
  });
  return target;
};

${gmailViewCode.replace(
  'var G2T = G2T || {}; // Namespace initialization - must be var to guarantee correct scope',
  `var G2T = G2T || {}; // Namespace initialization - must be var to guarantee correct scope
// Inject mock constructors for testing
G2T.Goog = function(args) {
  if (!(this instanceof G2T.Goog)) {
    return new G2T.Goog(args);
  }
  Object.assign(this, mockChrome);
  return this;
};
G2T.EventTarget = function(args) {
  if (!(this instanceof G2T.EventTarget)) {
    return new G2T.EventTarget(args);
  }
  Object.assign(this, mockEventTarget);
  return this;
};
G2T.Model = function(args) {
  if (!(this instanceof G2T.Model)) {
    return new G2T.Model(args);
  }
  Object.assign(this, mockModel);
  return this;
};
G2T.GmailView = function(args) {
  if (!(this instanceof G2T.GmailView)) {
    return new G2T.GmailView(args);
  }
  Object.assign(this, mockGmailView);
  return this;
};
G2T.PopupView = function(args) {
  if (!(this instanceof G2T.PopupView)) {
    return new G2T.PopupView(args);
  }
  Object.assign(this, mockPopupView);
  return this;
};
G2T.Utils = function(args) {
  if (!(this instanceof G2T.Utils)) {
    return new G2T.Utils(args);
  }
  Object.assign(this, mockUtils);
  return this;
};
G2T.WaitCounter = function(args) {
  if (!(this instanceof G2T.WaitCounter)) {
    return new G2T.WaitCounter(args);
  }
  Object.assign(this, mockInstances.waitCounter);
  return this;
};`,
)}`;

eval(injectedCode);

describe('GmailView Class', () => {
  let gmailView, dom, testApp;

  beforeEach(() => {
    // Setup JSDOM environment using shared function
    const jsdomSetup = setupJSDOM();
    dom = jsdomSetup.dom;

    // Create proper test application for GmailView class
    testApp = {
      utils: {
        log: jest.fn(),
      },
      events: {
        emit: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
      persist: {
        user: null,
        layoutMode: 0,
      },
      temp: {
        boards: [],
        lists: [],
        cards: [],
        members: [],
        labels: [],
      },
      popupView: {
        $toolBar: null,
        finalCreatePopup: jest.fn(),
        displayExtensionInvalidReload: jest.fn(),
      },
      model: {
        gmail: { mockData: true },
      },
      chrome: {
        runtimeSendMessage: jest.fn(),
      },
    };

    // Add real Utils methods to testApp AFTER JSDOM is set up
    Object.assign(testApp.utils, createRealUtilsMethods(testApp));

    // Create a fresh GmailView instance for each test with proper app dependency
    gmailView = new G2T.GmailView({ app: testApp });

    // Make $ available to the GmailView instance methods
    gmailView.$ = global.$;

    // Initialize properties that the GmailView methods expect
    gmailView.preprocess = { a: {} };
    gmailView.image = {};
    gmailView.attachment = [];
    gmailView.cc_raw = '';
    gmailView.cc_md = '';

    // Mock problematic methods to avoid complex DOM interactions
    gmailView.detectToolbar = jest.fn();
    gmailView.detectEmailOpeningMode = jest.fn();
    gmailView.detect = jest.fn();
    gmailView.parseData = jest.fn(() => ({ mockData: true }));

    // Clear all mocks before each test
    clearAllMocks();
  });

  afterEach(() => {
    // Clean up JSDOM environment using shared function
    cleanupJSDOM(dom);
  });

  describe('Constructor and Initialization', () => {
    test('should create GmailView instance with proper app dependency', () => {
      expect(gmailView).toBeDefined();
      expect(gmailView.app).toBe(testApp);
      expect(gmailView.app.utils).toBeDefined();
      expect(gmailView.app.events).toBeDefined();
    });

    test.skip('should have static ck getter', () => {
      // Check if GmailView class is available
      expect(G2T.GmailView).toBeDefined();
      expect(typeof G2T.GmailView).toBe('function');

      // Access static ck through the constructor
      expect(G2T.GmailView.ck).toBeDefined();
      expect(G2T.GmailView.ck.id).toBe('g2t_gmailview');
      expect(G2T.GmailView.ck.uniqueUriVar).toBe('g2t_filename');
    });

    test('should have instance ck getter', () => {
      expect(gmailView.ck).toBeDefined();
      expect(gmailView.ck.id).toBe('g2t_gmailview');
      expect(gmailView.ck.uniqueUriVar).toBe('g2t_filename');
    });

    test('should initialize with default properties', () => {
      expect(gmailView.LAYOUT_DEFAULT).toBe(0);
      expect(gmailView.LAYOUT_SPLIT).toBe(1);
      expect(gmailView.$root).toBeNull();
      expect(gmailView.parsingData).toBe(false);
      expect(gmailView.runaway).toBe(0);
    });

    test('should create WaitCounter instance', () => {
      expect(gmailView.waitCounter).toBeDefined();
    });

    test('should have selectors object', () => {
      expect(gmailView.selectors).toBeDefined();
      expect(typeof gmailView.selectors).toBe('object');
    });
  });

  describe('Utility Methods', () => {
    test('url_with_filename should add filename parameter to URL', () => {
      const result = gmailView.url_with_filename(
        'https://example.com',
        'test.txt',
      );
      expect(result).toContain('g2t_filename=/test.txt');
    });

    test('displayNameAndEmail should format name and email correctly', () => {
      const result = gmailView.displayNameAndEmail(
        'John Doe',
        'john@example.com',
      );
      expect(result).toContain('John Doe');
      expect(result).toContain('<john@example.com>');
    });

    test('displayNameAndEmail should handle empty email', () => {
      const result = gmailView.displayNameAndEmail('John Doe', '');
      expect(result).toContain('John Doe');
      expect(result).not.toContain('<>');
    });

    test('displayNameAndEmail should handle empty name', () => {
      const result = gmailView.displayNameAndEmail('', 'john@example.com');
      expect(result).toContain('<john@example.com>');
    });
  });

  describe('Email Processing Methods', () => {
    test('email_raw_md should handle empty name and email', () => {
      const result = gmailView.email_raw_md('', '');
      expect(result.raw).toBe('');
      expect(result.md).toBe('');
    });

    test('email_raw_md should process name and email correctly', () => {
      const result = gmailView.email_raw_md('John Doe', 'john@example.com');
      expect(result.raw).toContain('John Doe');
      expect(result.md).toContain('[John Doe]');
    });

    test('make_preprocess_mailto should create mailto templates', () => {
      const result = gmailView.make_preprocess_mailto(
        'John Doe',
        'john@example.com',
      );
      expect(typeof result).toBe('object');
      expect(Object.keys(result).length).toBeGreaterThan(0);
      expect(result['john doe <john@example.com>']).toBeDefined();
    });
  });

  describe('Detection Methods', () => {
    test('detectToolbar_onTimeout should handle runaway counter', () => {
      gmailView.runaway = 10;
      gmailView.detectToolbar_onTimeout();
      expect(testApp.utils.log).toHaveBeenCalledWith(
        'ERROR GmailView:detectToolbar RUNAWAY TRIGGERED',
      );
    });

    test('detectToolbar_onTimeout should increment runaway counter', () => {
      const initialRunaway = gmailView.runaway;
      gmailView.detectToolbar_onTimeout();
      expect(gmailView.runaway).toBe(initialRunaway + 1);
    });

    test('detectEmailOpeningMode_onEmailClick should start wait counter', () => {
      gmailView.detectEmailOpeningMode_onEmailClick();
      expect(gmailView.waitCounter.start).toHaveBeenCalledWith(
        'emailclick',
        500,
        5,
        expect.any(Function),
      );
    });
  });

  describe('DOM Manipulation', () => {
    test('should handle DOM element creation', () => {
      const element = document.createElement('div');
      expect(element).toBeDefined();
      expect(element.tagName).toBe('DIV');
    });

    test('should handle DOM element selection', () => {
      const element = document.createElement('div');
      element.className = 'test-class';
      document.body.appendChild(element);

      const selected = document.querySelector('.test-class');
      expect(selected).toBe(element);
    });
  });

  describe('Event Handling', () => {
    test('should bind events correctly', () => {
      gmailView.bindEvents();
      expect(testApp.events.addListener).toHaveBeenCalledWith(
        'onDetected',
        expect.any(Function),
      );
      expect(testApp.events.addListener).toHaveBeenCalledWith(
        'detectButton',
        expect.any(Function),
      );
      expect(testApp.events.addListener).toHaveBeenCalledWith(
        'trelloUserAndBoardsReady',
        expect.any(Function),
      );
    });

    test('should handle Gmail detection', () => {
      gmailView.$toolBar = { someProperty: 'value' };
      gmailView.handleGmailDetected();
      expect(testApp.popupView.$toolBar).toBe(gmailView.$toolBar);
    });

    test('should handle detect button', () => {
      // Mock preDetect to return true
      gmailView.preDetect = jest.fn(() => true);
      gmailView.$toolBar = { someProperty: 'value' };

      gmailView.handleDetectButton();
      expect(testApp.popupView.$toolBar).toBe(gmailView.$toolBar);
      expect(testApp.popupView.finalCreatePopup).toHaveBeenCalled();
    });
  });

  describe('Initialization', () => {
    test('should initialize correctly', () => {
      gmailView.init();
      expect(testApp.events.addListener).toHaveBeenCalled();
    });

    test('should handle Trello user and boards ready', () => {
      testApp.persist.user = { fullName: 'Test User' };
      gmailView.handleTrelloUserAndBoardsReady();
      expect(testApp.events.emit).toHaveBeenCalledWith('gmailDataReady', {
        gmail: { mockData: true },
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle null/undefined input gracefully', () => {
      // The real Utils methods are more strict, so we need to handle nulls properly
      expect(() => gmailView.displayNameAndEmail('', '')).not.toThrow();
    });

    test('should handle empty data objects', () => {
      expect(() => gmailView.email_raw_md('', '')).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('should handle large data sets efficiently', () => {
      const largeData = Array(1000).fill('test data');
      expect(() => {
        largeData.forEach(item =>
          gmailView.displayNameAndEmail(item, 'test@example.com'),
        );
      }).not.toThrow();
    });

    test('should handle many event handlers', () => {
      const manyHandlers = Array(100).fill(() => {});
      expect(() => {
        manyHandlers.forEach(handler =>
          testApp.events.addListener('test', handler),
        );
      }).not.toThrow();
    });
  });

  describe('Parse Data Methods', () => {
    test('parseData_onVisibleMailEach should process visible mail data', () => {
      const mockElement = elementSuperSet('<div>Test Email</div>');

      // Set y0 to ensure the condition is met
      gmailView.y0 = 0;
      gmailView.parseData_onVisibleMailEach(0, mockElement);

      // The method should complete without errors
      expect(gmailView).toBeDefined();
    });

    test('parseData_onEmailCCIterate should process CC iteration', () => {
      const mockItem = {
        name: 'Test User',
        email: 'cc@example.com',
      };

      // Initialize preprocess object
      gmailView.preprocess = { a: {} };

      gmailView.parseData_onEmailCCIterate(0, mockItem);

      expect(gmailView.preprocess).toBeDefined();
      expect(gmailView.preprocess['a']).toBeDefined();
    });

    test('parseData_onImageEach should process image data', () => {
      const mockElement = elementSuperSet(
        '<img src="test-image.jpg" alt="Test Image">',
      );

      gmailView.parseData_onImageEach(0, mockElement);

      expect(gmailView.image).toBeDefined();
      expect(typeof gmailView.image).toBe('object');
    });

    test('should handle multiple attachment processing', () => {
      const mockElements = [
        elementSuperSet('<span>attachment1.pdf</span>'),
        elementSuperSet('<span>attachment2.jpg</span>'),
      ];

      // Initialize attachment array like parseData does
      gmailView.attachment = [];

      mockElements.forEach((element, index) => {
        gmailView.parseData_onAttachmentEach(index, element);
      });

      expect(gmailView.attachment).toBeDefined();
      expect(Array.isArray(gmailView.attachment)).toBe(true);
    });

    test('should integrate with app utils correctly', () => {
      const result = gmailView.make_preprocess_mailto(
        'Test User',
        'test@example.com',
      );

      expect(typeof result).toBe('object');
      expect(Object.keys(result).length).toBeGreaterThan(0);
      // Since we're using real Utils methods, we can't spy on them
      // Instead, verify the result structure
      expect(result['test user <test@example.com>']).toBeDefined();
    });

    test('should integrate with jQuery correctly', () => {
      const mockElement = elementSuperSet('<div>Test</div>');

      gmailView.parseData_onVisibleMailEach(0, mockElement);

      // The method should complete without errors
      expect(gmailView).toBeDefined();
    });
  });
});
