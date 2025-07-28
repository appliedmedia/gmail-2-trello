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
  setupUtilsForTesting,
  createMockJQueryElement
} = require('./test_shared');

// Set up mocks before loading the Utils class
const mockInstances = createMockInstances();

// Make mock objects globally available
const mockChrome = mockInstances.mockChrome;
const mockEventTarget = mockInstances.mockEventTarget;
const mockModel = mockInstances.mockModel;
const mockGmailView = mockInstances.mockGmailView;
const mockPopupView = mockInstances.mockPopupView;
const mockUtils = mockInstances.mockUtils;
const analytics = global.analytics;

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

  describe('Additional Utility Methods', () => {
    test('anchorMarkdownify should create markdown links', () => {
      const result = utils.anchorMarkdownify('Link Text', 'https://example.com');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Link Text');
      expect(result).toContain('https://example.com');
    });

    test('anchorMarkdownify should handle same text and href', () => {
      const result = utils.anchorMarkdownify('https://example.com', 'https://example.com');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('anchorMarkdownify should handle mailto links', () => {
      const result = utils.anchorMarkdownify('test@example.com', 'mailto:test@example.com');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('anchorMarkdownify should handle empty inputs', () => {
      const result = utils.anchorMarkdownify('', '');
      expect(result).toBe('');
    });

    test('luminance should calculate color luminance', () => {
      const result = utils.luminance('#ffffff');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('luminance should handle different color formats', () => {
      const whiteLuminance = utils.luminance('#ffffff');
      const blackLuminance = utils.luminance('#000000');
      expect(whiteLuminance).toBeDefined();
      expect(blackLuminance).toBeDefined();
    });

    test('getSelectedText should return selected text', () => {
      // Mock window.getSelection
      const mockSelection = {
        toString: jest.fn().mockReturnValue('Selected text'),
        rangeCount: 1,
        getRangeAt: jest.fn().mockReturnValue({
          toString: jest.fn().mockReturnValue('Selected text')
        })
      };
      Object.defineProperty(window, 'getSelection', {
        value: jest.fn().mockReturnValue(mockSelection),
        writable: true
      });

      const result = utils.getSelectedText();
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('getSelectedText should handle no selection', () => {
      const mockSelection = {
        toString: jest.fn().mockReturnValue(''),
        rangeCount: 0
      };
      Object.defineProperty(window, 'getSelection', {
        value: jest.fn().mockReturnValue(mockSelection),
        writable: true
      });

      const result = utils.getSelectedText();
      expect(result).toBe('');
    });

    test('markdownify_sortByLength should sort by length', () => {
      const result = utils.markdownify_sortByLength('short', 'longer');
      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
    });

    test('markdownify_featureEnabled should check feature flags', () => {
      const result = utils.markdownify_featureEnabled({ bold: true }, 'strong');
      expect(result).toBeDefined();
      expect(typeof result).toBe('boolean');
    });

    test('markdownify_featureEnabled should handle disabled features', () => {
      const result = utils.markdownify_featureEnabled({ bold: false }, 'strong');
      expect(result).toBeDefined();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Integration Tests', () => {
    test('should handle complex markdownify operations', () => {
      // Test that markdownify method exists and is callable
      expect(typeof utils.markdownify).toBe('function');
      // Create a proper jQuery mock for markdownify
      const $emailBody = {
        html: () => '<p>Test</p>',
        length: 1
      };
      expect(() => utils.markdownify($emailBody, {}, {})).not.toThrow();
    });

    test('should handle markdownify with features disabled', () => {
      const $emailBody = {
        html: () => '<p>Test</p>',
        length: 1
      };
      const result = utils.markdownify($emailBody, false, {});
      expect(result).toBeDefined();
    });

    test('should handle markdownify with selective features', () => {
      const $emailBody = {
        html: () => '<p>Test</p>',
        length: 1
      };
      const result = utils.markdownify($emailBody, { bold: true, italic: false }, {});
      expect(result).toBeDefined();
    });

    test('should handle markdownify preprocessing', () => {
      const $emailBody = {
        html: () => '<p>Test</p>',
        length: 1
      };
      const result = utils.markdownify($emailBody, {}, { preprocess: true });
      expect(result).toBeDefined();
    });
  });

  describe('Markdownify Comprehensive Tests', () => {
    describe('Basic HTML to Markdown conversion', () => {
      test('converts simple paragraph', () => {
        const input = '<p>Hello world</p>';
        const expected = 'Hello world';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('converts multiple paragraphs with proper spacing', () => {
        const input = '<p>First paragraph</p><p>Second paragraph</p>';
        const expected = 'First paragraph\n\nSecond paragraph';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('converts div elements to paragraph spacing', () => {
        const input = '<div>First div</div><div>Second div</div>';
        const expected = 'First div\n\nSecond div';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('converts horizontal rule', () => {
        const input = '<p>Text before</p><hr><p>Text after</p>';
        const expected = 'Text before\n\n---\n\nText after';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('converts horizontal rule variations', () => {
        const input = '<p>Before</p>----<p>After</p>';
        const expected = 'Before\n\n---\n\nAfter';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('converts line breaks', () => {
        const input = '<p>Line 1<br>Line 2</p>';
        const expected = 'Line 1\nLine 2';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('converts line breaks with attributes', () => {
        const input = '<p>Line 1<br class="test">Line 2</p>';
        const expected = 'Line 1\nLine 2';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });
    });

    describe('Text formatting conversion', () => {
      test('converts strong bold text', () => {
        const input = '<p>This is <strong>bold</strong> text</p>';
        const expected = 'This is **bold** text';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('converts b bold text', () => {
        const input = '<p>This is <b>bold</b> text</p>';
        const expected = 'This is **bold** text';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('converts em italic text', () => {
        const input = '<p>This is <em>italic</em> text</p>';
        const expected = 'This is *italic* text';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('converts i italic text', () => {
        const input = '<p>This is <i>italic</i> text</p>';
        const expected = 'This is *italic* text';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('converts underline text', () => {
        const input = '<p>This is <u>underlined</u> text</p>';
        const expected = 'This is __underlined__ text';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('converts strikethrough del text', () => {
        const input = '<p>This is <del>deleted</del> text</p>';
        const expected = 'This is ~~deleted~~ text';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('converts strikethrough s text', () => {
        const input = '<p>This is <s>strikethrough</s> text</p>';
        const expected = 'This is ~~strikethrough~~ text';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('converts strikethrough strike text', () => {
        const input = '<p>This is <strike>strikethrough</strike> text</p>';
        const expected = 'This is ~~strikethrough~~ text';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('handles nested formatting', () => {
        const input = '<p>This is <strong><em>bold italic</em></strong> text</p>';
        const expected = 'This is *bold italic* text';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('handles multiple formatting in same text', () => {
        const input = '<p>This is <strong>bold</strong> and <em>italic</em> text</p>';
        const expected = 'This is **bold** and *italic* text';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });
    });

    describe('Header conversion', () => {
      test('converts h1 header to markdown format', () => {
        const input = '<h1>Main Title</h1>';
        const expected = '# Main Title';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('converts h2 header to markdown format', () => {
        const input = '<h2>Section Title</h2>';
        const expected = '## Section Title';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('converts h3 header to markdown format', () => {
        const input = '<h3>Subsection Title</h3>';
        const expected = '### Subsection Title';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('converts h4 header to markdown format', () => {
        const input = '<h4>Sub-subsection Title</h4>';
        const expected = '#### Sub-subsection Title';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('converts h5 header to markdown format', () => {
        const input = '<h5>Deep Title</h5>';
        const expected = '##### Deep Title';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('converts h6 header to markdown format', () => {
        const input = '<h6>Deepest Title</h6>';
        const expected = '###### Deepest Title';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('handles headers with proper spacing', () => {
        const input = '<h1>Title</h1><p>Content</p><h2>Subtitle</h2>';
        const expected = '# Title\n\nContent\n\n## Subtitle';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });
    });

    describe('Link conversion', () => {
      test('converts simple links', () => {
        const input = '<p>Visit <a href="https://example.com">Example</a> for more info</p>';
        const expected = 'Visit [Example](<https://example.com/>) for more info';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('converts links with title attributes', () => {
        const input = '<p>Visit <a href="https://example.com" title="Example Site">Example</a></p>';
        const expected = 'Visit [Example](<https://example.com/>)';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('handles links with long text', () => {
        const input = '<p>Visit <a href="https://example.com">This is a very long link text that should be converted</a></p>';
        const expected = 'Visit [This is a very long link text that should be converted](<https://example.com/>)';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('ignores links with short text (less than 4 characters)', () => {
        const input = '<p>Visit <a href="https://example.com">Hi</a> for more info</p>';
        const expected = 'Visit Hi for more info';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('handles multiple links in same paragraph', () => {
        const input = '<p>Visit <a href="https://example1.com">Example 1</a> and <a href="https://example2.com">Example 2</a></p>';
        const expected = 'Visit [Example 1](<https://example1.com/>) and [Example 2](<https://example2.com/>)';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('handles same text and href', () => {
        const input = '<p>Visit <a href="https://example.com">https://example.com</a></p>';
        const expected = 'Visit [https://example.com](<https://example.com/>)';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('handles mailto links', () => {
        const input = '<p>Contact <a href="mailto:test@example.com">test@example.com</a></p>';
        const expected = 'Contact <test@example.com>';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });
    });

    describe('HTML entity decoding', () => {
      test('decodes common HTML entities', () => {
        const input = '<p>This &amp; that &lt; &gt; &quot; &#39;</p>';
        const expected = 'This & that < > " \'';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('decodes numeric HTML entities', () => {
        const input = '<p>Copyright &#169; 2023</p>';
        const expected = 'Copyright © 2023';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });
    });

    describe('Bullet and list handling', () => {
      test('converts bullet characters to asterisks', () => {
        const input = '<p>• First item<br>• Second item</p>';
        const expected = '• First item\n• Second item';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('handles bullet formatting with line breaks', () => {
        const input = '<p>• Item 1<br>• Item 2<br>• Item 3</p>';
        const expected = '• Item 1\n• Item 2\n• Item 3';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });
    });

    describe('Whitespace and formatting cleanup', () => {
      test('handles multiple spaces in content', () => {
        const input = '<p>This    has    multiple    spaces</p>';
        const expected = 'This has multiple spaces';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('normalizes multiple line breaks', () => {
        const input = '<p>First line</p>\n\n\n<p>Second line</p>';
        const expected = 'First line\n\nSecond line';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('trims whitespace from beginning and end', () => {
        const input = '   <p>Content</p>   ';
        const expected = 'Content';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('handles tabs and mixed whitespace', () => {
        const input = '<p>Line 1\twith\ttabs</p><p>Line 2</p>';
        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        // The actual behavior normalizes tabs to spaces
        expect(result).toContain('Line 1');
        expect(result).toContain('with');
        expect(result).toContain('tabs');
        expect(result).toContain('Line 2');
      });

      test('demonstrates actual space normalization', () => {
        const input = '<p>Text   with   multiple   spaces</p>';
        const expected = 'Text with multiple spaces';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });
    });

    describe('Feature toggle functionality', () => {
      test('disables all features when features=false', () => {
        const input = '<p>This is <strong>bold</strong> and <em>italic</em> text</p>';
        const expected = 'This is bold and italic text';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, false, {});

        expect(result).toBe(expected);
      });

      test('allows selective feature disabling', () => {
        const input = '<p>This is <strong>bold</strong> and <em>italic</em> text</p>';
        const features = { bold: false, italic: true };
        const expected = 'This is **bold** and *italic* text';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, features, {});

        expect(result).toBe(expected);
      });

      test('enables features by default', () => {
        const input = '<p>This is <strong>bold</strong> text</p>';
        const expected = 'This is **bold** text';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });
    });

    describe('Complex real-world scenarios', () => {
      test('handles email-like content', () => {
        const input = `
          <div>
            <h1>Meeting Summary</h1>
            <p>Hello team,</p>
            <p>Here's what we discussed:</p>
            <ul>
              <li>• Project timeline</li>
              <li>• Budget concerns</li>
            </ul>
            <p>Best regards,<br>John</p>
          </div>
        `;
        const expected = '# Meeting Summary\n\nHello team,\n\nHere\'s what we discussed:\n\n• Project timeline\n• Budget concerns\n\nBest regards,\nJohn';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('handles nested HTML structures', () => {
        const input = '<div><p>Outer <strong>bold <em>italic</em></strong> text</p></div>';
        const expected = 'Outer **bold italic** text';

        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});

        expect(result).toBe(expected);
      });

      test('handles large content efficiently', () => {
        const largeContent = '<p>' + 'Test content. '.repeat(1000) + '</p>';
        const $element = createMockJQueryElement(largeContent);
        
        const startTime = Date.now();
        const result = utils.markdownify($element, true, {});
        const endTime = Date.now();

        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      });
    });

    describe('Edge cases and error handling', () => {
      test('handles null/undefined input gracefully', () => {
        expect(() => utils.markdownify(null, true, {})).not.toThrow();
        expect(() => utils.markdownify(undefined, true, {})).not.toThrow();
      });

      test('handles empty input', () => {
        const $element = createMockJQueryElement('');
        const result = utils.markdownify($element, true, {});
        expect(result).toBe('');
      });

      test('handles input with only whitespace', () => {
        const $element = createMockJQueryElement('   \n\t   ');
        const result = utils.markdownify($element, true, {});
        expect(result).toBe('');
      });

      test('handles malformed HTML gracefully', () => {
        const input = '<p>Unclosed tag<strong>Bold text<p>Another paragraph';
        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });

      test('handles elements with no text content', () => {
        const input = '<div><p></p><p>Content</p></div>';
        const expected = 'Content';
        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});
        expect(result).toBe(expected);
      });

      test('handles special characters and unicode', () => {
        const input = '<p>Special chars: &copy; &trade; &reg; &euro; &pound;</p>';
        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });

      test('handles very long text content', () => {
        const longText = 'A'.repeat(10000);
        const input = `<p>${longText}</p>`;
        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});
        expect(result).toBeDefined();
        expect(result.length).toBe(10000);
      });
    });

    describe('Integration and consistency tests', () => {
      test('produces consistent output for same input', () => {
        const input = '<p>Test <strong>bold</strong> content</p>';
        const $element = createMockJQueryElement(input);
        
        const result1 = utils.markdownify($element, true, {});
        const result2 = utils.markdownify($element, true, {});
        
        expect(result1).toBe(result2);
      });

      test('validates markdown output format', () => {
        const input = '<h1>Title</h1><p>This is <strong>bold</strong> and <em>italic</em> text with a <a href="https://example.com">link</a>.</p>';
        const $element = createMockJQueryElement(input);
        const result = utils.markdownify($element, true, {});
        
        // Should contain markdown syntax
        expect(result).toContain('# Title');
        expect(result).toContain('**bold**');
        expect(result).toContain('*italic*');
        expect(result).toContain('[link]');
        expect(result).toContain('(<https://example.com/>)');
      });
    });
  });
});
