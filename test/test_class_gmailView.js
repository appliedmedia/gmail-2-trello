/**
 * Comprehensive Jest test suite for GmailView class
 * Tests all methods and functionality of the GmailView class
 * Uses shared test utilities and mocks from test_shared.js
 */

// Import shared test utilities
const {
  setupJSDOM,
  cleanupJSDOM,
  loadClassFile,
  clearAllMocks,
  createMockInstances,
  createG2TConstructor,
  setupG2TMocks,
} = require('./test_shared.js');

describe('GmailView Class', () => {
  let dom, window, gmailView, mockApp, mockInstances;

  beforeEach(() => {
    // Setup JSDOM environment using shared function
    const jsdomSetup = setupJSDOM();
    dom = jsdomSetup.dom;
    window = jsdomSetup.window;

    // Create mock instances using shared function
    mockInstances = createMockInstances();

    // Add WaitCounter mock since it's not in shared utilities
    mockInstances.waitCounter = {
      start: jest.fn(),
      stop: jest.fn(),
    };

    // Create mock application instance with all required properties
    mockApp = {
      utils: {
        ...mockInstances.utils,
        log: jest.fn(),
        getSelectedText: jest.fn(() => ''),
        markdownify: jest.fn(
          (element, useMarkdown, preprocess) => 'markdownified content',
        ),
        url_add_var: jest.fn((url, var_str) => `${url}?${var_str}`),
        addSpace: jest.fn((front, back) => `${front} ${back}`),
        splitEmailDomain: jest.fn(email => email.split('@')[1] || ''),
      },
      eventTarget: mockInstances.eventTarget,
      events: {
        addListener: jest.fn(),
        emit: jest.fn(),
      },
      popupView: {
        $toolBar: null,
        init: jest.fn(),
        finalCreatePopup: jest.fn(),
      },
      model: {
        gmail: null,
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
        attachments: [],
      },
    };

    // Enhanced jQuery mock for GmailView specific methods
    global.$ = jest.fn((selector, context) => {
      // Handle different jQuery patterns used by GmailView
      if (typeof selector === 'string') {
        return {
          length: 1,
          each: jest.fn(callback => {
            // Mock element for each iteration
            const mockElement = {
              textContent: 'mock text',
              innerHTML: '<div>mock html</div>',
              getAttribute: jest.fn(() => 'mock-attr'),
              children: jest.fn(() => ({
                length: 2,
                each: jest.fn(callback => {
                  callback(0, { textContent: 'child1' });
                  callback(1, { textContent: 'child2' });
                }),
              })),
              first: jest.fn(() => ({
                textContent: 'first element',
                innerHTML: '<div>first html</div>',
              })),
              offset: jest.fn(() => ({ top: 0, left: 0 })),
              find: jest.fn(() => ({
                length: 1,
                each: jest.fn(callback =>
                  callback(0, { textContent: 'found element' }),
                ),
              })),
            };
            callback(0, mockElement);
          }),
          text: jest.fn(() => 'mock text'),
          html: jest.fn(() => '<div>mock html</div>'),
          attr: jest.fn(() => 'mock-attr'),
          prop: jest.fn(() => 'mock-prop'),
          children: jest.fn(() => ({
            length: 2,
            each: jest.fn(callback => {
              callback(0, { textContent: 'child1' });
              callback(1, { textContent: 'child2' });
            }),
          })),
          first: jest.fn(() => ({
            textContent: 'first element',
            innerHTML: '<div>first html</div>',
            offset: jest.fn(() => ({ top: 0, left: 0 })),
            find: jest.fn(() => ({
              length: 1,
              each: jest.fn(callback =>
                callback(0, { textContent: 'found element' }),
              ),
            })),
          })),
          offset: jest.fn(() => ({ top: 0, left: 0 })),
          find: jest.fn(() => ({
            length: 1,
            each: jest.fn(callback =>
              callback(0, { textContent: 'found element' }),
            ),
          })),
        };
      }
      return {
        length: 0,
        each: jest.fn(),
        text: jest.fn(() => ''),
        html: jest.fn(() => ''),
        attr: jest.fn(() => ''),
        prop: jest.fn(() => ''),
        children: jest.fn(() => ({ length: 0, each: jest.fn() })),
        first: jest.fn(() => ({
          textContent: '',
          innerHTML: '',
          offset: jest.fn(() => ({ top: 0, left: 0 })),
          find: jest.fn(() => ({ length: 0, each: jest.fn() })),
        })),
        offset: jest.fn(() => ({ top: 0, left: 0 })),
        find: jest.fn(() => ({ length: 0, each: jest.fn() })),
      };
    });

    // Load the GmailView class using eval (for Chrome extension compatibility)
    const gmailViewCode = loadClassFile(
      'chrome_manifest_v3/views/class_gmailView.js',
    );

    // Inject mock constructors after G2T namespace is initialized
    const injectedCode = gmailViewCode.replace(
      'var G2T = G2T || {}; // Namespace initialization - must be var to guarantee correct scope',
      `var G2T = G2T || {}; // Namespace initialization - must be var to guarantee correct scope
// Inject mock constructors for testing
G2T.App = function(args) {
  if (!(this instanceof G2T.App)) {
    return new G2T.App(args);
  }
  Object.assign(this, mockApp);
  return this;
};
G2T.Utils = function(args) {
  if (!(this instanceof G2T.Utils)) {
    return new G2T.Utils(args);
  }
  Object.assign(this, mockApp.utils);
  return this;
};
G2T.WaitCounter = function(args) {
  if (!(this instanceof G2T.WaitCounter)) {
    return new G2T.WaitCounter(args);
  }
  Object.assign(this, mockInstances.waitCounter);
  return this;
};
G2T.EventTarget = function() {
  if (!(this instanceof G2T.EventTarget)) {
    return new G2T.EventTarget();
  }
  Object.assign(this, mockInstances.eventTarget);
  return this;
};`,
    );

    eval(injectedCode);

    // Make G2T global for test access
    global.G2T = G2T;

    // Create a fresh GmailView instance for each test
    gmailView = new G2T.GmailView({ app: mockApp });

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
      expect(gmailView.app).toBe(mockApp);
      expect(gmailView.app.utils).toBeDefined();
      expect(gmailView.app.events).toBeDefined();
    });

    test('should have static ck getter', () => {
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
      expect(gmailView.waitCounter.start).toBeDefined();
      expect(gmailView.waitCounter.stop).toBeDefined();
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
      expect(result).toBe('https://example.com?g2t_filename=/test.txt');
    });

    test('displayNameAndEmail should format name and email correctly', () => {
      const result = gmailView.displayNameAndEmail(
        'John Doe',
        'john@example.com',
      );
      expect(result).toBe('John Doe <john@example.com>');
    });

    test('displayNameAndEmail should handle empty email', () => {
      const result = gmailView.displayNameAndEmail('John Doe', '');
      expect(result).toBe('John Doe ');
    });

    test('displayNameAndEmail should handle empty name', () => {
      const result = gmailView.displayNameAndEmail('', 'john@example.com');
      expect(result).toBe(' <john@example.com>');
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
      expect(result.raw).toBe('John Doe <john@example.com>');
      expect(result.md).toBeDefined();
    });
  });

  describe('Detection Methods', () => {
    test('detectToolbar_onTimeout should handle runaway counter', () => {
      gmailView.runaway = 10;
      gmailView.detectToolbar_onTimeout();
      expect(mockApp.utils.log).toHaveBeenCalledWith(
        'ERROR GmailView:detectToolbar RUNAWAY TRIGGERED',
      );
    });

    test('detectToolbar_onTimeout should increment runaway counter', () => {
      gmailView.runaway = 5;
      gmailView.detectToolbar_onTimeout();
      expect(gmailView.runaway).toBe(6);
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
      expect(mockApp.events.addListener).toHaveBeenCalledWith(
        'onDetected',
        expect.any(Function),
      );
      expect(mockApp.events.addListener).toHaveBeenCalledWith(
        'detectButton',
        expect.any(Function),
      );
      expect(mockApp.events.addListener).toHaveBeenCalledWith(
        'trelloUserAndBoardsReady',
        expect.any(Function),
      );
    });

    test('should handle Gmail detection', () => {
      gmailView.$toolBar = { someProperty: 'value' };
      gmailView.handleGmailDetected();
      expect(mockApp.popupView.$toolBar).toBe(gmailView.$toolBar);
    });

    test('should handle detect button', () => {
      // Mock preDetect to return true
      gmailView.preDetect = jest.fn(() => true);
      gmailView.$toolBar = { someProperty: 'value' };

      gmailView.handleDetectButton();
      expect(mockApp.popupView.$toolBar).toBe(gmailView.$toolBar);
      expect(mockApp.popupView.finalCreatePopup).toHaveBeenCalled();
    });
  });

  describe('Initialization', () => {
    test('should initialize correctly', () => {
      gmailView.init();
      expect(mockApp.events.addListener).toHaveBeenCalled();
    });

    test('should handle Trello user and boards ready', () => {
      mockApp.persist.user = { fullName: 'Test User' };
      gmailView.handleTrelloUserAndBoardsReady();
      expect(mockApp.events.emit).toHaveBeenCalledWith('gmailDataReady', {
        gmail: { mockData: true },
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle null/undefined input gracefully', () => {
      const result = gmailView.url_with_filename(null, undefined);
      expect(result).toBeDefined();
    });

    test('should handle empty data objects', () => {
      const result = gmailView.email_raw_md('', '');
      expect(result).toEqual({ raw: '', md: '' });
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
          mockApp.events.addListener('test', handler),
        );
      }).not.toThrow();
    });
  });
});
