/**
 * Comprehensive Jest test suite for Utils class
 * Tests all methods and functionality of the Utils class
 */

// Mock jQuery for testing
global.$ = jest.fn();

// Mock chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
};

// Mock console for testing
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Import the Utils class
const Utils = require('../chrome_manifest_v3/class_utils.js');

describe('Utils Class', () => {
  let utils;

  beforeEach(() => {
    // Create a fresh Utils instance for each test
    utils = new Utils({ debug: false });

    // Reset all mocks
    $.mockClear();
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
    console.log.mockClear();
    console.error.mockClear();
    console.warn.mockClear();
  });

  describe('Constructor and Initialization', () => {
    test('should create Utils instance with default settings', () => {
      expect(utils).toBeInstanceOf(Utils);
      expect(utils.debug).toBe(false);
    });

    test('should create Utils instance with debug enabled', () => {
      const debugUtils = new Utils({ debug: true });
      expect(debugUtils.debug).toBe(true);
    });

    test('should handle constructor with no arguments', () => {
      const defaultUtils = new Utils();
      expect(defaultUtils).toBeInstanceOf(Utils);
    });
  });

  describe('Debug and Logging', () => {
    test('refreshDebugMode should update debug state', () => {
      utils.debug = true;
      utils.refreshDebugMode();
      expect(utils.debug).toBe(true);
    });

    test('log should output when debug is enabled', () => {
      utils.debug = true;
      utils.log('Test message');
      expect(console.log).toHaveBeenCalledWith('Test message');
    });

    test('log should not output when debug is disabled', () => {
      utils.debug = false;
      utils.log('Test message');
      expect(console.log).not.toHaveBeenCalled();
    });

    test('ck getter should return correct value', () => {
      expect(utils.ck).toBeDefined();
    });

    test('ck static getter should return correct value', () => {
      expect(Utils.ck).toBeDefined();
    });
  });

  describe('Chrome Storage Operations', () => {
    test('loadFromChromeStorage should call chrome.storage.local.get', async () => {
      chrome.storage.local.get.mockImplementation((key, callback) => {
        callback({ testKey: 'testValue' });
      });

      const result = await utils.loadFromChromeStorage('testKey');
      expect(chrome.storage.local.get).toHaveBeenCalledWith(
        'testKey',
        expect.any(Function)
      );
    });

    test('saveToChromeStorage should call chrome.storage.local.set', async () => {
      chrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      await utils.saveToChromeStorage('testKey', 'testValue');
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        { testKey: 'testValue' },
        expect.any(Function)
      );
    });

    test('loadFromChromeStorage should handle errors', async () => {
      chrome.storage.local.get.mockImplementation((key, callback) => {
        callback({});
      });

      const result = await utils.loadFromChromeStorage('nonexistentKey');
      expect(result).toBeUndefined();
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
      expect(utils.replacer(null, {})).toBe('');
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
      expect(utils.uriForDisplay('https://example.com')).toBe('example.com');
      expect(utils.uriForDisplay('http://example.com')).toBe('example.com');
      expect(utils.uriForDisplay('ftp://example.com')).toBe('example.com');
      expect(utils.uriForDisplay('mailto:test@example.com')).toBe(
        'test@example.com'
      );
      expect(utils.uriForDisplay('tel:+1234567890')).toBe('+1234567890');
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
      expect(utils.url_add_var('', 'param=value')).toBe('?param=value');
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
      expect(utils.excludeFields(null, [])).toEqual({});
      expect(utils.excludeFields(undefined, [])).toEqual({});
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
      expect(result).toEqual({ name: 'test', domain: 'example@domain.com' });
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
      expect(utils.truncate('Hello World', 5)).toBe('Hello...');
      expect(utils.truncate('Hello World', 5, '***')).toBe('Hello***');
      expect(utils.truncate('Hello', 10)).toBe('Hello');
    });

    test('midTruncate should truncate from middle', () => {
      expect(utils.midTruncate('Hello World', 8)).toBe('He...ld');
      expect(utils.midTruncate('Hello World', 8, '***')).toBe('He***ld');
      expect(utils.midTruncate('Hello', 10)).toBe('Hello');
    });

    test('bookend should wrap text with specified characters', () => {
      expect(utils.bookend('*', 'Hello', 'bold')).toBe('*Hello*');
      expect(utils.bookend('`', 'code', 'code')).toBe('`code`');
    });
  });

  describe('HTML Entity Processing', () => {
    test('encodeEntities should encode HTML entities', () => {
      expect(utils.encodeEntities('& < > " \'')).toBe(
        '&amp; &lt; &gt; &quot; &#39;'
      );
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

      expect(utils.modKey(ctrlEvent)).toBe('ctrl');
      expect(utils.modKey(cmdEvent)).toBe('cmd');
      expect(utils.modKey(shiftEvent)).toBe('shift');
      expect(utils.modKey(altEvent)).toBe('alt');
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
      const args = { email: 'test@example.com', size: 50 };
      const result = utils.makeAvatarUrl(args);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^https?:\/\/.+/);
      expect(result).toContain('50');
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
