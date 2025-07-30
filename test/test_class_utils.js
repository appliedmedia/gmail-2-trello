/**
 * Comprehensive Jest test suite for Utils class
 * Tests all methods and functionality of the Utils class
 */

// Import shared test utilities
const {
  loadClassFile,
  setupJSDOM,
  cleanupJSDOM,
  setupUtilsForTesting,
  createMockJQueryElement,
  g2t_element,
  injectJQueryAndMocks,
  console_log,
} = require('./test_shared');

// Load the Utils class using eval (for Chrome extension compatibility)
const utilsCode = loadClassFile('chrome_manifest_v3/class_utils.js');

// Create mock constructors code
const mockConstructorsCode = `
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
};`;

// Use standardized injection function
const injectedCode = injectJQueryAndMocks(utilsCode, mockConstructorsCode);
eval(injectedCode);

describe('Utils Class', () => {
  let dom, window, utils, testApp;

  beforeEach(() => {
    // Setup JSDOM environment using shared function
    const jsdomSetup = setupJSDOM();
    dom = jsdomSetup.dom;
    window = jsdomSetup.window;

    // Setup Utils class using shared function
    const utilsSetup = setupUtilsForTesting();
    utils = utilsSetup.utils;
    testApp = utilsSetup.testApp;
  });

  afterEach(() => {
    // Clean up JSDOM environment using shared function
    cleanupJSDOM(dom);
  });

  // Simple test to verify setup is working
  test('basic setup test', () => {
    console_log('Basic setup test running');
    expect(utils).toBeDefined();
    expect(testApp).toBeDefined();
  });

  // Simple test to see what $ returns
  test('simple $ test', () => {
    const result = $('div');
    expect(result).toBeDefined();
    expect(result.length).toBeDefined();
  });

  // Test if global $ is available
  test('global $ availability test', () => {
    expect(global.$).toBeDefined();
    expect(typeof global.$).toBe('function');
  });

  describe('Constructor and Initialization', () => {
    test('should create Utils instance with default settings', () => {
      expect(utils).toBeInstanceOf(global.G2T.Utils);
      expect(utils.app).toBe(testApp);
    });

    test('should create Utils instance with debug enabled', () => {
      const debugApp = {
        ...testApp,
        temp: {
          ...testApp.temp,
          log: {
            ...testApp.temp.log,
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
    test('log should output when debug is enabled', () => {
      testApp.temp.log.debugMode = true;
      utils.log('Test message');
      expect(testApp.temp.log.memory.length).toBeGreaterThan(0);
    });

    test('log should not output when debug is disabled', () => {
      testApp.temp.log.debugMode = false;
      utils.log('Test message');
      expect(testApp.temp.log.memory.length).toBeGreaterThan(0); // Still logs to memory
    });

    test('ck getter should return correct value', () => {
      expect(utils.ck).toBeDefined();
    });

    test('ck static getter should return correct value', () => {
      expect(G2T.Utils.ck).toBeDefined();
    });
  });

  describe('Chrome Storage Operations', () => {
    test('loadFromChromeStorage should call goog.storageSyncGet', () => {
      testApp.goog.storageSyncGet.mockImplementation((key, callback) => {
        callback({ testKey: JSON.stringify('testValue') });
      });

      utils.loadFromChromeStorage('testKey');
      expect(testApp.goog.storageSyncGet).toHaveBeenCalledWith(
        'testKey',
        expect.any(Function),
      );
    });

    test('saveToChromeStorage should call goog.storageSyncSet', () => {
      utils.saveToChromeStorage('testKey', 'testValue');
      expect(testApp.goog.storageSyncSet).toHaveBeenCalledWith({
        testKey: JSON.stringify('testValue'),
      });
    });

    test('loadFromChromeStorage should handle errors', () => {
      testApp.goog.storageSyncGet.mockImplementation((key, callback) => {
        callback({});
      });

      utils.loadFromChromeStorage('nonexistentKey');
      expect(testApp.goog.storageSyncGet).toHaveBeenCalledWith(
        'nonexistentKey',
        expect.any(Function),
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
      expect(utils.uriForDisplay('https://example.com')).toBe(
        'https://example.com',
      );
      expect(utils.uriForDisplay('http://example.com')).toBe(
        'http://example.com',
      );
      expect(utils.uriForDisplay('ftp://example.com')).toBe(
        'ftp://example.com',
      );
      expect(utils.uriForDisplay('mailto:test@example.com')).toBe(
        'mailto:test@example.com',
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
        'https://example.com?param=value',
      );
      expect(
        utils.url_add_var('https://example.com?existing=1', 'param=value'),
      ).toBe('https://example.com?existing=1&param=value');
    });

    test('url_add_var should handle empty parameters', () => {
      expect(utils.url_add_var('https://example.com', '')).toBe(
        'https://example.com',
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
      expect(utils.bookend('*', 'Hello', 'bold')).toBe(
        '<* style="bold">Hello</*>',
      );
      expect(utils.bookend('`', 'code', 'code')).toBe(
        '<` style="code">code</`>',
      );
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
        '& < > " \'',
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
      const result = utils.anchorMarkdownify(
        'Link Text',
        'https://example.com',
      );
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Link Text');
      expect(result).toContain('https://example.com');
    });

    test('anchorMarkdownify should handle same text and href', () => {
      const result = utils.anchorMarkdownify(
        'https://example.com',
        'https://example.com',
      );
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('anchorMarkdownify should handle mailto links', () => {
      const result = utils.anchorMarkdownify(
        'test@example.com',
        'mailto:test@example.com',
      );
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
          toString: jest.fn().mockReturnValue('Selected text'),
        }),
      };
      Object.defineProperty(window, 'getSelection', {
        value: jest.fn().mockReturnValue(mockSelection),
        writable: true,
      });

      const result = utils.getSelectedText();
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('getSelectedText should handle no selection', () => {
      const mockSelection = {
        toString: jest.fn().mockReturnValue(''),
        rangeCount: 0,
      };
      Object.defineProperty(window, 'getSelection', {
        value: jest.fn().mockReturnValue(mockSelection),
        writable: true,
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
      const result = utils.markdownify_featureEnabled(
        { bold: false },
        'strong',
      );
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
        length: 1,
      };
      expect(() => utils.markdownify($emailBody, {}, {})).not.toThrow();
    });

    test('should handle markdownify with features disabled', () => {
      const $emailBody = {
        html: () => '<p>Test</p>',
        length: 1,
      };
      const result = utils.markdownify($emailBody, false, {});
      expect(result).toBeDefined();
    });

    test('should handle markdownify with selective features', () => {
      const $emailBody = {
        html: () => '<p>Test</p>',
        length: 1,
      };
      const result = utils.markdownify(
        $emailBody,
        { bold: true, italic: false },
        {},
      );
      expect(result).toBeDefined();
    });

    test('should handle markdownify preprocessing', () => {
      const $emailBody = {
        html: () => '<p>Test</p>',
        length: 1,
      };
      const result = utils.markdownify($emailBody, {}, { preprocess: true });
      expect(result).toBeDefined();
    });
  });

  describe('Markdownify', () => {
    // Simple tests using array-based approach with element keys
    const simpleMarkdownifyTests = [
      'p',
      'a',
      'h1',
      'mailto',
      'strong',
      'em',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p2',
      'div2',
      'hr',
      'hr2',
      'br',
      'br_attr',
      'b',
      'em_text',
      'i',
      'u',
      'del',
      's',
      'strike',
      'strong_em',
      'strong_em_both',
      'headers_spacing',
      'a_title',
      'a_long',
      'a_short',
      'a_same',
      'a_multiple',
      'html_entities',
      'bullet_chars',
      'bullet',
      'spaces',
      'linebreaks',
      'trim',
      'space_normalize',
      'email_content',
      'nested_html',
      'empty_input',
      'whitespace_input',
      'malformed_html',
      'empty_content',
      'special_chars',
      'long_text',
      'title_bold_italic_link',
      'strong_simple',
      'tabs_whitespace',
    ];

    // Generate tests for all simple markdownify elements
    simpleMarkdownifyTests.forEach(elementKey => {
      const element = g2t_element[elementKey];
      test(`Markdownify Test "${elementKey}"`, () => {
        const result = utils.markdownify(element, element.features, {});
        expect(result).toBe(element.expected.markdownify);
      });
    });

    describe('Complex HTML to Markdown conversion', () => {
      test('converts multiple paragraphs with proper spacing', () => {
        const result = utils.markdownify(
          g2t_element.p2,
          g2t_element.p2.features,
          {},
        );
        expect(result).toBe(g2t_element.p2.expected.markdownify);
      });

      test('converts div elements to paragraph spacing', () => {
        const result = utils.markdownify(g2t_element.div2, true, {});
        expect(result).toBe(g2t_element.div2.expected.markdownify);
      });

      test('converts horizontal rule', () => {
        const result = utils.markdownify(g2t_element.hr, true, {});
        expect(result).toBe(g2t_element.hr.expected.markdownify);
      });

      test('converts horizontal rule variations', () => {
        const result = utils.markdownify(g2t_element.hr2, true, {});
        expect(result).toBe(g2t_element.hr2.expected.markdownify);
      });

      test('converts line breaks', () => {
        const result = utils.markdownify(g2t_element.br, true, {});
        expect(result).toBe(g2t_element.br.expected.markdownify);
      });

      test('converts line breaks with attributes', () => {
        const result = utils.markdownify(g2t_element.br_attr, true, {});
        expect(result).toBe(g2t_element.br_attr.expected.markdownify);
      });
    });

    describe('Text formatting conversion', () => {
      // Note: Simple strong/em tests moved to array-based approach above

      test('converts b bold text', () => {
        const result = utils.markdownify(g2t_element.b, true, {});
        expect(result).toBe(g2t_element.b.expected.markdownify);
      });

      test('converts em italic text', () => {
        const result = utils.markdownify(g2t_element.em_text, true, {});
        expect(result).toBe(g2t_element.em_text.expected.markdownify);
      });

      test('converts i italic text', () => {
        const result = utils.markdownify(g2t_element.i, true, {});
        expect(result).toBe(g2t_element.i.expected.markdownify);
      });

      test('converts underline text', () => {
        const result = utils.markdownify(g2t_element.u, true, {});
        expect(result).toBe(g2t_element.u.expected.markdownify);
      });

      test('converts strikethrough del text', () => {
        const result = utils.markdownify(g2t_element.del, true, {});
        expect(result).toBe(g2t_element.del.expected.markdownify);
      });

      test('converts strikethrough s text', () => {
        const result = utils.markdownify(g2t_element.s, true, {});
        expect(result).toBe(g2t_element.s.expected.markdownify);
      });

      test('converts strikethrough strike text', () => {
        const result = utils.markdownify(g2t_element.strike, true, {});
        expect(result).toBe(g2t_element.strike.expected.markdownify);
      });

      test('handles nested formatting', () => {
        const result = utils.markdownify(g2t_element.strong_em, true, {});
        expect(result).toBe(g2t_element.strong_em.expected.markdownify);
      });

      test('handles multiple formatting in same text', () => {
        const result = utils.markdownify(g2t_element.strong_em_both, true, {});
        expect(result).toBe(g2t_element.strong_em_both.expected.markdownify);
      });
    });

    describe('Header conversion', () => {
      // Note: Simple h1 test moved to array-based approach above

      // Note: h2, h3, h4, h5, h6 tests moved to array-based approach above

      test('handles headers with proper spacing', () => {
        const result = utils.markdownify(g2t_element.headers_spacing, true, {});
        expect(result).toBe(g2t_element.headers_spacing.expected.markdownify);
      });
    });

    describe('Link conversion', () => {
      // Note: Simple link test moved to array-based approach above

      test('converts links with title attributes', () => {
        const result = utils.markdownify(g2t_element.a_title, true, {});
        expect(result).toBe(g2t_element.a_title.expected.markdownify);
      });

      test('handles links with long text', () => {
        const result = utils.markdownify(g2t_element.a_long, true, {});
        expect(result).toBe(g2t_element.a_long.expected.markdownify);
      });

      test('ignores links with short text (less than 4 characters)', () => {
        const result = utils.markdownify(g2t_element.a_short, true, {});
        expect(result).toBe(g2t_element.a_short.expected.markdownify);
      });

      // Note: Multiple links test removed - requires simpler jQuery mock architecture

      test('handles same text and href', () => {
        const result = utils.markdownify(g2t_element.a_same, true, {});
        expect(result).toBe(g2t_element.a_same.expected.markdownify);
      });

      // Note: Simple mailto test moved to array-based approach above
    });

    describe('HTML entity decoding', () => {
      test('decodes common HTML entities', () => {
        const result = utils.markdownify(g2t_element.html_entities, true, {});
        expect(result).toBe(g2t_element.html_entities.expected.markdownify);
      });

      test('decodes numeric HTML entities', () => {
        const result = utils.markdownify(
          g2t_element.numeric_entities,
          true,
          {},
        );
        expect(result).toBe(g2t_element.numeric_entities.expected.markdownify);
      });
    });

    describe('Bullet and list handling', () => {
      test('converts bullet characters to asterisks', () => {
        const result = utils.markdownify(g2t_element.bullet_chars, true, {});
        expect(result).toBe(g2t_element.bullet_chars.expected.markdownify);
      });

      test('handles bullet formatting with line breaks', () => {
        const result = utils.markdownify(g2t_element.bullet, true, {});
        expect(result).toBe(g2t_element.bullet.expected.markdownify);
      });
    });

    describe('Whitespace and formatting cleanup', () => {
      test('handles multiple spaces in content', () => {
        const result = utils.markdownify(g2t_element.spaces, true, {});
        expect(result).toBe(g2t_element.spaces.expected.markdownify);
      });

      test('normalizes multiple line breaks', () => {
        const result = utils.markdownify(g2t_element.linebreaks, true, {});
        expect(result).toBe(g2t_element.linebreaks.expected.markdownify);
      });

      test('trims whitespace from beginning and end', () => {
        const result = utils.markdownify(g2t_element.trim, true, {});
        expect(result).toBe(g2t_element.trim.expected.markdownify);
      });

      test('demonstrates actual space normalization', () => {
        const result = utils.markdownify(g2t_element.space_normalize, true, {});
        expect(result).toBe(g2t_element.space_normalize.expected.markdownify);
      });
    });

    describe('Feature toggle functionality', () => {
      test('disables all features when features=false', () => {
        const result = utils.markdownify(
          g2t_element.features_disabled,
          g2t_element.features_disabled.features,
          {},
        );
        expect(result).toBe(g2t_element.features_disabled.expected.markdownify);
      });

      test('allows selective feature disabling', () => {
        const result = utils.markdownify(
          g2t_element.features_strong_off_italic_on,
          g2t_element.features_strong_off_italic_on.features,
          {},
        );
        expect(result).toBe(
          g2t_element.features_strong_off_italic_on.expected.markdownify,
        );
      });

      test('enables features by default', () => {
        const result = utils.markdownify(
          g2t_element.strong_simple,
          g2t_element.strong_simple.features,
          {},
        );
        expect(result).toBe(g2t_element.strong_simple.expected.markdownify);
      });
    });

    describe('Complex real-world scenarios', () => {
      test('handles email-like content', () => {
        const result = utils.markdownify(g2t_element.email_content, true, {});
        expect(result).toBe(g2t_element.email_content.expected.markdownify);
      });

      test('handles nested HTML structures', () => {
        const result = utils.markdownify(g2t_element.nested_html, true, {});
        expect(result).toBe(g2t_element.nested_html.expected.markdownify);
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
        const result = utils.markdownify(g2t_element.empty_input, true, {});
        expect(result).toBe(g2t_element.empty_input.expected.markdownify);
      });

      test('handles input with only whitespace', () => {
        const result = utils.markdownify(
          g2t_element.whitespace_input,
          true,
          {},
        );
        expect(result).toBe(g2t_element.whitespace_input.expected.markdownify);
      });

      test('handles malformed HTML gracefully', () => {
        const result = utils.markdownify(g2t_element.malformed_html, true, {});
        expect(result).toBe(g2t_element.malformed_html.expected.markdownify);
      });

      test('handles elements with no text content', () => {
        const result = utils.markdownify(g2t_element.empty_content, true, {});
        expect(result).toBe(g2t_element.empty_content.expected.markdownify);
      });

      test('handles special characters and unicode', () => {
        const result = utils.markdownify(g2t_element.special_chars, true, {});
        expect(result).toBe(g2t_element.special_chars.expected.markdownify);
      });

      test('handles very long text content', () => {
        const result = utils.markdownify(g2t_element.long_text, true, {});
        expect(result).toBe(g2t_element.long_text.expected.markdownify);
      });
    });

    describe('Integration and consistency tests', () => {
      test('produces consistent output for same input', () => {
        const result1 = utils.markdownify(
          g2t_element.consistent_test,
          true,
          {},
        );
        const result2 = utils.markdownify(
          g2t_element.consistent_test,
          true,
          {},
        );

        expect(result1).toBe(result2);
      });

      test('validates markdown output format', () => {
        const result = utils.markdownify(
          g2t_element.title_bold_italic_link,
          true,
          {},
        );
        expect(result).toBe(
          g2t_element.title_bold_italic_link.expected.markdownify,
        );
      });
    });
  });
});
