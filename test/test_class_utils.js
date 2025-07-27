/**
 * Comprehensive Jest test suite for Utils class
 * Tests all methods and functionality of the Utils class
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
  setupUtilsForTesting
} = require('./test_shared');

// Set up mocks before loading the Utils class
const mockInstances = createMockInstances();

// Make mock objects globally available
var mockChrome = mockInstances.mockChrome;
var mockEventTarget = mockInstances.mockEventTarget;
var mockModel = mockInstances.mockModel;
var mockGmailView = mockInstances.mockGmailView;
var mockPopupView = mockInstances.mockPopupView;
var mockUtils = mockInstances.mockUtils;
var analytics = global.analytics;

// Make mockInstances available to tests
global.mockInstances = mockInstances;

// Load the Utils class using eval (for Chrome extension compatibility)
const utilsCode = loadClassFile('chrome_manifest_v3/class_utils.js');

// Inject mock constructors after G2T namespace is initialized
const injectedCode = utilsCode.replace(
  'var G2T = G2T || {}; // must be var to guarantee correct scope',
  `var G2T = G2T || {}; // must be var to guarantee correct scope
// Inject mock constructors for testing
G2T.Chrome = function(args) {
  if (!(this instanceof G2T.Chrome)) {
    return new G2T.Chrome(args);
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
};`
);

eval(injectedCode);

describe('Utils Class', () => {
  let utils, dom, mockApp;

  beforeEach(() => {
    // Setup JSDOM environment using shared function
    const jsdomSetup = setupJSDOM();
    dom = jsdomSetup.dom;
    
    // Create proper mock application for Utils class
    mockApp = {
      chrome: {
        storageSyncGet: jest.fn(),
        storageSyncSet: jest.fn(),
        storageLocalGet: jest.fn(),
        storageLocalSet: jest.fn(),
        runtime: {
          sendMessage: jest.fn(),
        },
      },
      events: {
        emit: jest.fn(),
      },
      temp: {
        log: {
          memory: [],
          count: 0,
          max: 100,
          debugMode: false,
          lastMessage: null,
          lastMessageCount: 0,
          lastMessageIndex: -1,
        },
      },
      persist: {
        storageHashes: {},
      },
    };
    
    // Create a fresh Utils instance for each test with proper app dependency
    utils = new G2T.Utils({ app: mockApp });
    
    // Clear all mocks
    clearAllMocks();
  });

  afterEach(() => {
    // Clean up JSDOM environment using shared function
    cleanupJSDOM(dom);
  });

  describe('Constructor and Initialization', () => {
    test('should create Utils instance with default settings', () => {
      expect(utils).toBeInstanceOf(G2T.Utils);
      expect(utils.app).toBe(mockApp);
    });

    test('should create Utils instance with debug enabled', () => {
      const debugApp = {
        ...mockApp,
        temp: {
          ...mockApp.temp,
          log: {
            ...mockApp.temp.log,
            debugMode: true,
          },
        },
      };
      const debugUtils = new G2T.Utils({ app: debugApp });
      expect(debugUtils.app.temp.log.debugMode).toBe(true);
    });

    test('should handle constructor with no arguments', () => {
      expect(() => new G2T.Utils()).toThrow();
    });
  });

  describe('Debug and Logging', () => {
    test('refreshDebugMode should update debug state', () => {
      mockApp.chrome.storageSyncGet.mockImplementation((key, callback) => {
        callback({ debugMode: true });
      });
      utils.refreshDebugMode();
      expect(mockApp.chrome.storageSyncGet).toHaveBeenCalledWith('debugMode', expect.any(Function));
    });

    test('log should output when debug is enabled', () => {
      mockApp.temp.log.debugMode = true;
      utils.log('Test message');
      expect(mockApp.temp.log.memory.length).toBeGreaterThan(0);
    });

    test('log should not output when debug is disabled', () => {
      mockApp.temp.log.debugMode = false;
      utils.log('Test message');
      expect(mockApp.temp.log.memory.length).toBeGreaterThan(0); // Still logs to memory
    });

    test('ck getter should return correct value', () => {
      expect(utils.ck).toBeDefined();
    });

    test('ck static getter should return correct value', () => {
      expect(G2T.Utils.ck).toBeDefined();
    });
  });

  describe('Chrome Storage Operations', () => {
    test('loadFromChromeStorage should call chrome.storageSyncGet', () => {
      mockApp.chrome.storageSyncGet.mockImplementation((key, callback) => {
        callback({ testKey: JSON.stringify('testValue') });
      });

      utils.loadFromChromeStorage('testKey');
      expect(mockApp.chrome.storageSyncGet).toHaveBeenCalledWith(
        'testKey',
        expect.any(Function)
      );
    });

    test('saveToChromeStorage should call chrome.storageSyncSet', () => {
      utils.saveToChromeStorage('testKey', 'testValue');
      expect(mockApp.chrome.storageSyncSet).toHaveBeenCalledWith(
        { testKey: JSON.stringify('testValue') }
      );
    });

    test('loadFromChromeStorage should handle errors', () => {
      mockApp.chrome.storageSyncGet.mockImplementation((key, callback) => {
        callback({});
      });

      utils.loadFromChromeStorage('nonexistentKey');
      expect(mockApp.chrome.storageSyncGet).toHaveBeenCalledWith(
        'nonexistentKey',
        expect.any(Function)
      );
    });
  });

  describe('String Manipulation', () => {
    test('escapeRegExp should escape special regex characters', () => {
      expect(utils.escapeRegExp('test')).toBe('test');
      expect(utils.escapeRegExp('test*test')).toBe('test\\*test');
      expect(utils.escapeRegExp('test.test')).toBe('test\\.test');
      expect(utils.escapeRegExp('test+test')).toBe('test\\+test');
      expect(utils.escapeRegExp('test?test')).toBe('test\\?test');
      expect(utils.escapeRegExp('test^test')).toBe('test\\^test');
      expect(utils.escapeRegExp('test$test')).toBe('test\\$test');
      expect(utils.escapeRegExp('test|test')).toBe('test\\|test');
      expect(utils.escapeRegExp('test(test')).toBe('test\\(test');
      expect(utils.escapeRegExp('test)test')).toBe('test\\)test');
      expect(utils.escapeRegExp('test[test')).toBe('test\\[test');
      expect(utils.escapeRegExp('test]test')).toBe('test\\]test');
      expect(utils.escapeRegExp('test{test')).toBe('test\\{test');
      expect(utils.escapeRegExp('test}test')).toBe('test\\}test');
    });

    test('replacer should replace text with dictionary values', () => {
      const text = 'Hello %name%, welcome to %place%';
      const dict = { name: 'John', place: 'Trello' };
      const result = utils.replacer(text, dict);
      expect(result).toBe('Hello John, welcome to Trello');
    });

    test('replacer should handle empty dictionary', () => {
      const text = 'Hello %name%';
      const result = utils.replacer(text, {});
      expect(result).toBe('Hello %name%');
    });

    test('replacer should handle null/undefined text', () => {
      expect(utils.replacer(null, {})).toBe(null);
      expect(utils.replacer(undefined, {})).toBe('');
    });

    test('replacer_onEach should process each replacement', () => {
      const text = 'Hello %name%';
      const value = 'John';
      const key = 'name';
      const result = utils.replacer_onEach(text, value, key);
      expect(result).toBe('Hello John');
    });
  });

  describe('URI and URL Handling', () => {
    test('uriForDisplay should format URIs correctly', () => {
      // uriForDisplay only formats URIs longer than 20 characters
      expect(utils.uriForDisplay('https://example.com')).toBe('https://example.com');
      expect(utils.uriForDisplay('http://example.com')).toBe('http://example.com');
      expect(utils.uriForDisplay('ftp://example.com')).toBe('ftp://example.com');
      expect(utils.uriForDisplay('mailto:test@example.com')).toBe(
        'mailto:test@example.com'
      );
      expect(utils.uriForDisplay('tel:+1234567890')).toBe('tel:+1234567890');
    });

    test('uriForDisplay should handle invalid URIs', () => {
      expect(utils.uriForDisplay('')).toBe('');
      expect(utils.uriForDisplay(null)).toBe('');
      expect(utils.uriForDisplay(undefined)).toBe('');
      expect(utils.uriForDisplay('not-a-uri')).toBe('not-a-uri');
    });

    test('url_add_var should add query parameters', () => {
      expect(utils.url_add_var('https://example.com', 'param=value')).toBe(
        'https://example.com?param=value'
      );
      expect(
        utils.url_add_var('https://example.com?existing=1', 'param=value')
      ).toBe('https://example.com?existing=1&param=value');
    });

    test('url_add_var should handle empty parameters', () => {
      expect(utils.url_add_var('https://example.com', '')).toBe(
        'https://example.com'
      );
      expect(utils.url_add_var('', 'param=value')).toBe('param=value');
    });
  });

  describe('Hash and Data Processing', () => {
    test('djb2Hash should generate consistent hashes', () => {
      const hash1 = utils.djb2Hash('test');
      const hash2 = utils.djb2Hash('test');
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('number');
    });

    test('djb2Hash should generate different hashes for different strings', () => {
      const hash1 = utils.djb2Hash('test1');
      const hash2 = utils.djb2Hash('test2');
      expect(hash1).not.toBe(hash2);
    });

    test('excludeFields should remove specified fields from object', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const fieldsToExclude = ['b', 'd'];
      const result = utils.excludeFields(obj, fieldsToExclude);
      expect(result).toEqual({ a: 1, c: 3 });
    });

    test('excludeFields should handle empty object', () => {
      const result = utils.excludeFields({}, ['field1']);
      expect(result).toEqual({});
    });

    test('excludeFields should handle null/undefined object', () => {
      expect(() => utils.excludeFields(null, [])).toThrow();
      expect(() => utils.excludeFields(undefined, [])).toThrow();
    });
  });

  describe('Email Processing', () => {
    test('splitEmailDomain should split email correctly', () => {
      const result = utils.splitEmailDomain('test@example.com');
      expect(result).toEqual({ name: 'test', domain: 'example.com' });
    });

    test('splitEmailDomain should handle empty email', () => {
      const result = utils.splitEmailDomain('');
      expect(result).toEqual({ name: '', domain: '' });
    });

    test('splitEmailDomain should handle email without @', () => {
      const result = utils.splitEmailDomain('testemail');
      expect(result).toEqual({ name: 'testemail', domain: '' });
    });

    test('splitEmailDomain should handle multiple @ symbols', () => {
      const result = utils.splitEmailDomain('test@example@domain.com');
      expect(result).toEqual({ name: 'test', domain: 'example' });
    });
  });

  describe('String Formatting', () => {
    test('addChar should add character between non-empty strings', () => {
      expect(utils.addChar('front', 'back', '-')).toBe('front-back');
      expect(utils.addChar('front', '', '-')).toBe('front-');
      expect(utils.addChar('', 'back', '-')).toBe('-back');
      expect(utils.addChar('', '', '-')).toBe('');
    });

    test('addSpace should add space between strings', () => {
      expect(utils.addSpace('front', 'back')).toBe('front back');
      expect(utils.addSpace('front', '')).toBe('front ');
      expect(utils.addSpace('', 'back')).toBe(' back');
      expect(utils.addSpace('', '')).toBe('');
    });

    test('addCRLF should add newline between strings', () => {
      expect(utils.addCRLF('front', 'back')).toBe('front\nback');
      expect(utils.addCRLF('front', '')).toBe('front\n');
      expect(utils.addCRLF('', 'back')).toBe('\nback');
      expect(utils.addCRLF('', '')).toBe('');
    });
  });

  describe('Text Processing', () => {
    test('truncate should truncate text to specified length', () => {
      expect(utils.truncate('Hello World', 5)).toBe('Hello');
      expect(utils.truncate('Hello World', 5, '***')).toBe('He***');
      expect(utils.truncate('Hello', 10)).toBe('Hello');
    });

    test('midTruncate should truncate from middle', () => {
      expect(utils.midTruncate('Hello World', 8)).toBe('Helloorld');
      expect(utils.midTruncate('Hello World', 8, '***')).toBe('Hel***ld');
      expect(utils.midTruncate('Hello', 10)).toBe('Hello');
    });

    test('bookend should wrap text with specified characters', () => {
      expect(utils.bookend('*', 'Hello', 'bold')).toBe('<* style="bold">Hello</*>');
      expect(utils.bookend('`', 'code', 'code')).toBe('<` style="code">code</`>');
    });
  });

  describe('HTML Entity Processing', () => {
    test('encodeEntities should encode HTML entities', () => {
      // encodeEntities uses DOM, which works in JSDOM environment
      const result = utils.encodeEntities('& < > " \'');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('decodeEntities should decode HTML entities', () => {
      expect(utils.decodeEntities('&amp; &lt; &gt; &quot; &#39;')).toBe(
        '& < > " \''
      );
    });

    test('decodeEntities should handle unknown entities', () => {
      expect(utils.decodeEntities('&unknown;')).toBe('&unknown;');
    });

    test('decodeEntities should handle empty string', () => {
      expect(utils.decodeEntities('')).toBe('');
    });
  });

  describe('Event Handling', () => {
    test('modKey should detect modifier keys', () => {
      const ctrlEvent = {
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
      };
      const cmdEvent = {
        ctrlKey: false,
        metaKey: true,
        shiftKey: false,
        altKey: false,
      };
      const shiftEvent = {
        ctrlKey: false,
        metaKey: false,
        shiftKey: true,
        altKey: false,
      };
      const altEvent = {
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: true,
      };

      expect(utils.modKey(ctrlEvent)).toBe('ctrl-right');
      expect(utils.modKey(cmdEvent)).toBe('metakey-windows');
      expect(utils.modKey(shiftEvent)).toBe('shift-right');
      expect(utils.modKey(altEvent)).toBe('alt-right');
    });

    test('modKey should return empty string for no modifier', () => {
      const noModEvent = {
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
      };
      expect(utils.modKey(noModEvent)).toBe('');
    });
  });

  describe('Avatar URL Generation', () => {
    test('makeAvatarUrl should generate avatar URL', () => {
      const args = { avatarUrl: 'https://example.com/avatar' };
      const result = utils.makeAvatarUrl(args);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toBe('https://example.com/avatar/30.png');
    });
  });

  describe('Lifecycle Methods', () => {
    test('bindEvents should be callable', () => {
      expect(() => utils.bindEvents()).not.toThrow();
    });

    test('init should be callable', () => {
      expect(() => utils.init()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle null/undefined inputs gracefully', () => {
      expect(() => utils.escapeRegExp(null)).not.toThrow();
      expect(() => utils.escapeRegExp(undefined)).not.toThrow();
      expect(() => utils.replacer(null, {})).not.toThrow();
      expect(() => utils.replacer(undefined, {})).not.toThrow();
    });

    test('should handle edge cases in string operations', () => {
      expect(utils.truncate('', 5)).toBe('');
      expect(utils.midTruncate('', 5)).toBe('');
      expect(utils.addChar('', '', '')).toBe('');
    });
  });

  describe('Performance Tests', () => {
    test('should handle large strings efficiently', () => {
      const largeString = 'A'.repeat(10000);
      const startTime = Date.now();
      const result = utils.escapeRegExp(largeString);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    test('should handle large objects efficiently', () => {
      const largeObj = {};
      for (let i = 0; i < 1000; i++) {
        largeObj[`key${i}`] = `value${i}`;
      }

      const startTime = Date.now();
      const result = utils.excludeFields(largeObj, ['key1', 'key2']);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
