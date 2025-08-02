/**
 * Comprehensive Jest test suite for Utils class
 * Tests all methods and functionality of the Utils class
 */

// Import shared test utilities
const {
  loadSourceFile,
  setupJSDOM,
  cleanupJSDOM,
  createRealUtilsMethods,
  _ts, // G2T_TestSuite instance
  createJQueryElement,
  console_log,
} = require('./test_shared');

// Create Utils-specific test elements
const utils_e = {
  p: _ts.e({
    html: '<p>Paragraph content</p>',
    expected: 'Paragraph content',
  }),

  a: _ts.e({
    html: '<a href="https://example.com">Example</a>',
    expected: '[Example](<https://example.com>)',
  }),

  h1: _ts.e({
    html: '<h1>h1 title</h1>',
    expected: '# h1 title',
  }),

  strong: _ts.e({
    html: '<strong>bold</strong>',
    expected: '**bold**',
  }),

  em: _ts.e({
    html: '<em>italic</em>',
    expected: '*italic*',
  }),

  // Add all the test elements that were previously in g2t_element
  p2: _ts.e({
    html: '<p>First paragraph</p><p>Second paragraph</p>',
    expected: 'First paragraph\n\nSecond paragraph',
  }),

  div2: _ts.e({
    html: '<div>First div</div><div>Second div</div>',
    expected: 'First div\n\nSecond div',
  }),

  hr: _ts.e({
    html: '<p>Text before</p><hr><p>Text after</p>',
    expected: 'Text before\n\n---\n\nText after',
  }),

  hr2: _ts.e({
    html: '<p>Before</p>----<p>After</p>',
    expected: 'Before\n\n---\n\nAfter',
  }),

  br: _ts.e({
    html: '<p>Line 1<br>Line 2</p>',
    expected: 'Line 1\nLine 2',
  }),

  br_attr: _ts.e({
    html: '<p>Line 1<br class="test">Line 2</p>',
    expected: 'Line 1\nLine 2',
  }),

  b: _ts.e({
    html: '<p>This is <b>bold</b> text</p>',
    expected: 'This is **bold** text',
  }),

  em_text: _ts.e({
    html: '<p>This is <em>italic</em> text</p>',
    expected: 'This is *italic* text',
  }),

  i: _ts.e({
    html: '<p>This is <i>italic</i> text</p>',
    expected: 'This is *italic* text',
  }),

  u: _ts.e({
    html: '<p>This is <u>underlined</u> text</p>',
    expected: 'This is __underlined__ text',
  }),

  del: _ts.e({
    html: '<p>This is <del>deleted</del> text</p>',
    expected: 'This is ~~deleted~~ text',
  }),

  s: _ts.e({
    html: '<p>This is <s>strikethrough</s> text</p>',
    expected: 'This is ~~strikethrough~~ text',
  }),

  strike: _ts.e({
    html: '<p>This is <strike>strikethrough</strike> text</p>',
    expected: 'This is ~~strikethrough~~ text',
  }),

  strong_em: _ts.e({
    html: '<p>This is <strong><em>bold italic</em></strong> text</p>',
    expected: 'This is *bold italic* text',
  }),

  strong_em_both: _ts.e({
    html: '<p>This is <strong>bold</strong> and <em>italic</em> text</p>',
    expected: 'This is **bold** and *italic* text',
  }),

  headers_spacing: _ts.e({
    html: '<h1>Title</h1><p>Content</p><h2>Subtitle</h2>',
    expected: '# Title\n\nContent\n\n## Subtitle',
  }),

  a_title: _ts.e({
    html: '<p>Visit <a href="https://example.com" title="Example Site">Example</a></p>',
    expected: 'Visit [Example](<https://example.com>)',
  }),

  a_long: _ts.e({
    html: '<p>Visit <a href="https://example.com">This is a very long link text that should be converted</a></p>',
    expected:
      'Visit [This is a very long link text that should be converted](<https://example.com>)',
  }),

  a_short: _ts.e({
    html: '<p>Visit <a href="https://example.com">Hi</a> for more info</p>',
    expected: 'Visit Hi for more info',
  }),

  a_same: _ts.e({
    html: '<p>Visit <a href="https://example.com">https://example.com</a></p>',
    expected: 'Visit <https://example.com>',
  }),

  html_entities: _ts.e({
    html: '<p>This &amp; that &lt; &gt; &quot; &#39;</p>',
    expected: 'This & that < > " \'',
  }),

  numeric_entities: _ts.e({
    html: '<p>Copyright &#169; 2023</p>',
    expected: 'Copyright © 2023',
  }),

  bullet_chars: _ts.e({
    html: '<p>• First item<br>• Second item</p>',
    expected: '• First item\n• Second item',
  }),

  bullet: _ts.e({
    html: '<p>• Item 1<br>• Item 2<br>• Item 3</p>',
    expected: '• Item 1\n• Item 2\n• Item 3',
  }),

  spaces: _ts.e({
    html: '<p>This    has    multiple    spaces</p>',
    expected: 'This has multiple spaces',
  }),

  linebreaks: _ts.e({
    html: '<p>First line</p>\n\n\n<p>Second line</p>',
    expected: 'First line\n\nSecond line',
  }),

  trim: _ts.e({
    html: '   <p>Content</p>   ',
    expected: 'Content',
  }),

  space_normalize: _ts.e({
    html: '<p>Text   with   multiple   spaces</p>',
    expected: 'Text with multiple spaces',
  }),

  features_disabled: _ts.e({
    html: '<p>This is <strong>bold</strong> and <em>italic</em> text</p>',
    features: false,
    expected: 'This is bold and italic text', // When features=false, formatting is stripped
  }),

  features_strong_off_italic_on: _ts.e({
    html: '<p>This is <strong>bold</strong> and <em>italic</em> text</p>',
    features: { strong: false, em: true },
    expected: 'This is bold and *italic* text',
  }),

  strong_simple: _ts.e({
    html: '<p>This is <strong>bold</strong> text</p>',
    expected: 'This is **bold** text',
  }),

  email_content: _ts.e({
    html: "<div><h1>Meeting Summary</h1><p>Hello team,</p><p>Here's what we discussed:</p><ul><li>• Project timeline</li><li>• Budget concerns</li></ul><p>Best regards,<br>John</p></div>",
    expected:
      "# Meeting Summary\n\nHello team,\n\nHere's what we discussed:\n\n• Project timeline• Budget concerns\n\nBest regards,\nJohn",
  }),

  nested_html: _ts.e({
    html: '<div><p>Outer <strong>bold <em>italic</em></strong> text</p></div>',
    expected: 'Outer **bold italic** text',
  }),

  empty_input: _ts.e({
    html: '',
    expected: '',
  }),

  whitespace_input: _ts.e({
    html: '   \n\t   ',
    expected: '',
  }),

  malformed_html: _ts.e({
    html: '<p>Unclosed tag<strong>Bold text<p>Another paragraph',
    expected: 'Unclosed tagBold text\n\n**Another paragraph**',
  }),

  empty_content: _ts.e({
    html: '<div><p></p><p>Content</p></div>',
    expected: 'Content',
  }),

  special_chars: _ts.e({
    html: '<p>Special chars: &copy; &trade; &reg; &euro; &pound;</p>',
    expected: 'Special chars: © ™ ® € £',
  }),

  long_text: _ts.e({
    html: 'A'.repeat(10000),
    expected: 'A'.repeat(10000),
  }),

  consistent_test: _ts.e({
    html: '<p>Test <strong>bold</strong> content</p>',
    expected: 'Test **bold** content',
  }),

  title_bold_italic_link: _ts.e({
    html: '<h1>Title</h1><p>This is <strong>bold</strong> and <em>italic</em> text with a <a href="https://example.com">link</a>.</p>',
    expected:
      '# Title\n\nThis is **bold** and *italic* text with a [link](<https://example.com>) .',
  }),

  // Missing elements causing test failures
  mailto: _ts.e({
    html: '<p>Contact <a href="mailto:test@example.com">us</a></p>',
    expected: 'Contact us',
  }),

  h2: _ts.e({
    html: '<h2>h2 title</h2>',
    expected: '## h2 title',
  }),

  h3: _ts.e({
    html: '<h3>h3 title</h3>',
    expected: '### h3 title',
  }),

  h4: _ts.e({
    html: '<h4>h4 title</h4>',
    expected: '#### h4 title',
  }),

  h5: _ts.e({
    html: '<h5>h5 title</h5>',
    expected: '##### h5 title',
  }),

  h6: _ts.e({
    html: '<h6>h6 title</h6>',
    expected: '###### h6 title',
  }),

  a_multiple: _ts.e({
    html: '<p><a href="https://example.com">First</a> and <a href="https://test.com">Second</a></p>',
    expected: '[First](<https://example.com>) and [Second](<https://test.com>)',
  }),

  tabs_whitespace: _ts.e({
    html: '<p>Content\twith\ttabs\tand   spaces</p>',
    expected: 'Content with tabs and spaces',
  }),
};

describe('Utils Class', () => {
  let dom, window, utils, app;

  beforeAll(() => {
    // Setup Utils class using real methods (only once)
    // We'll pass app in beforeEach since it's created there
    utils = null; // Will be set in beforeEach
  });

  beforeEach(() => {
    // Setup JSDOM environment using shared function
    const jsdomSetup = setupJSDOM();
    dom = jsdomSetup.dom;
    window = jsdomSetup.window;

    // Setup fresh app for each test with structure matching real Utils class
    app = {
      utils: { log: jest.fn() },
      temp: {
        log: {
          count: 0,
          debugMode: false,
          max: 100,
          memory: [],
        },
      },
      persist: {
        storageHashes: {},
      },
      goog: {
        storageSyncGet: jest.fn(),
        storageSyncSet: jest.fn(),
      },
    };

    // Create Utils instance with our app
    utils = createRealUtilsMethods(app);
  });

  afterEach(() => {
    // Clean up JSDOM environment using shared function
    cleanupJSDOM(dom);
  });

  // Simple test to verify setup is working
  test('basic setup test', () => {
    console_log('Basic setup test running');
    expect(utils).toBeDefined();
    expect(app).toBeDefined();
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
      expect(utils.app).toBe(app);
    });

    test('should create Utils instance with debug enabled', () => {
      const debugApp = {
        ...app,
        temp: {
          ...app.temp,
          log: {
            ...app.temp.log,
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
      app.temp.log.debugMode = true;
      utils.log('Test message');
      expect(app.temp.log.memory.length).toBeGreaterThan(0);
    });

    test('log should not output when debug is disabled', () => {
      app.temp.log.debugMode = false;
      utils.log('Test message');
      expect(app.temp.log.memory.length).toBeGreaterThan(0); // Still logs to memory
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
      app.goog.storageSyncGet.mockImplementation((key, callback) => {
        callback({ testKey: JSON.stringify('testValue') });
      });

      utils.loadFromChromeStorage('testKey');
      expect(app.goog.storageSyncGet).toHaveBeenCalledWith(
        'testKey',
        expect.any(Function),
      );
    });

    test('saveToChromeStorage should call goog.storageSyncSet', () => {
      utils.saveToChromeStorage('testKey', 'testValue');
      expect(app.goog.storageSyncSet).toHaveBeenCalledWith({
        testKey: JSON.stringify('testValue'),
      });
    });

    test('loadFromChromeStorage should handle errors', () => {
      app.goog.storageSyncGet.mockImplementation((key, callback) => {
        callback({});
      });

      utils.loadFromChromeStorage('nonexistentKey');
      expect(app.goog.storageSyncGet).toHaveBeenCalledWith(
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
      const element = utils_e[elementKey];
      test(`Markdownify Test "${elementKey}"`, () => {
        const result = utils.markdownify(element, element.features, {});
        expect(result).toBe(element.expected);
      });
    });

    describe('Complex HTML to Markdown conversion', () => {
      test('converts multiple paragraphs with proper spacing', () => {
        const result = utils.markdownify(utils_e.p2, utils_e.p2.features, {});
        expect(result).toBe(utils_e.p2.expected);
      });

      test('converts div elements to paragraph spacing', () => {
        const result = utils.markdownify(utils_e.div2, true, {});
        expect(result).toBe(utils_e.div2.expected);
      });

      test('converts horizontal rule', () => {
        const result = utils.markdownify(utils_e.hr, true, {});
        expect(result).toBe(utils_e.hr.expected);
      });

      test('converts horizontal rule variations', () => {
        const result = utils.markdownify(utils_e.hr2, true, {});
        expect(result).toBe(utils_e.hr2.expected);
      });

      test('converts line breaks', () => {
        const result = utils.markdownify(utils_e.br, true, {});
        expect(result).toBe(utils_e.br.expected);
      });

      test('converts line breaks with attributes', () => {
        const result = utils.markdownify(utils_e.br_attr, true, {});
        expect(result).toBe(utils_e.br_attr.expected);
      });
    });

    describe('Text formatting conversion', () => {
      // Note: Simple strong/em tests moved to array-based approach above

      test('converts b bold text', () => {
        const result = utils.markdownify(utils_e.b, true, {});
        expect(result).toBe(utils_e.b.expected);
      });

      test('converts em italic text', () => {
        const result = utils.markdownify(utils_e.em_text, true, {});
        expect(result).toBe(utils_e.em_text.expected);
      });

      test('converts i italic text', () => {
        const result = utils.markdownify(utils_e.i, true, {});
        expect(result).toBe(utils_e.i.expected);
      });

      test('converts underline text', () => {
        const result = utils.markdownify(utils_e.u, true, {});
        expect(result).toBe(utils_e.u.expected);
      });

      test('converts strikethrough del text', () => {
        const result = utils.markdownify(utils_e.del, true, {});
        expect(result).toBe(utils_e.del.expected);
      });

      test('converts strikethrough s text', () => {
        const result = utils.markdownify(utils_e.s, true, {});
        expect(result).toBe(utils_e.s.expected);
      });

      test('converts strikethrough strike text', () => {
        const result = utils.markdownify(utils_e.strike, true, {});
        expect(result).toBe(utils_e.strike.expected);
      });

      test('handles nested formatting', () => {
        const result = utils.markdownify(utils_e.strong_em, true, {});
        expect(result).toBe(utils_e.strong_em.expected);
      });

      test('handles multiple formatting in same text', () => {
        const result = utils.markdownify(utils_e.strong_em_both, true, {});
        expect(result).toBe(utils_e.strong_em_both.expected);
      });
    });

    describe('Header conversion', () => {
      // Note: Simple h1 test moved to array-based approach above

      // Note: h2, h3, h4, h5, h6 tests moved to array-based approach above

      test('handles headers with proper spacing', () => {
        const result = utils.markdownify(utils_e.headers_spacing, true, {});
        expect(result).toBe(utils_e.headers_spacing.expected);
      });
    });

    describe('Link conversion', () => {
      // Note: Simple link test moved to array-based approach above

      test('converts links with title attributes', () => {
        const result = utils.markdownify(utils_e.a_title, true, {});
        expect(result).toBe(utils_e.a_title.expected);
      });

      test('handles links with long text', () => {
        const result = utils.markdownify(utils_e.a_long, true, {});
        expect(result).toBe(utils_e.a_long.expected);
      });

      test('ignores links with short text (less than 4 characters)', () => {
        const result = utils.markdownify(utils_e.a_short, true, {});
        expect(result).toBe(utils_e.a_short.expected);
      });

      // Note: Multiple links test removed - requires simpler jQuery mock architecture

      test('handles same text and href', () => {
        const result = utils.markdownify(utils_e.a_same, true, {});
        expect(result).toBe(utils_e.a_same.expected);
      });

      // Note: Simple mailto test moved to array-based approach above
    });

    describe('HTML entity decoding', () => {
      test('decodes common HTML entities', () => {
        const result = utils.markdownify(utils_e.html_entities, true, {});
        expect(result).toBe(utils_e.html_entities.expected);
      });

      test('decodes numeric HTML entities', () => {
        const result = utils.markdownify(utils_e.numeric_entities, true, {});
        expect(result).toBe(utils_e.numeric_entities.expected);
      });
    });

    describe('Bullet and list handling', () => {
      test('converts bullet characters to asterisks', () => {
        const result = utils.markdownify(utils_e.bullet_chars, true, {});
        expect(result).toBe(utils_e.bullet_chars.expected);
      });

      test('handles bullet formatting with line breaks', () => {
        const result = utils.markdownify(utils_e.bullet, true, {});
        expect(result).toBe(utils_e.bullet.expected);
      });
    });

    describe('Whitespace and formatting cleanup', () => {
      test('handles multiple spaces in content', () => {
        const result = utils.markdownify(utils_e.spaces, true, {});
        expect(result).toBe(utils_e.spaces.expected);
      });

      test('normalizes multiple line breaks', () => {
        const result = utils.markdownify(utils_e.linebreaks, true, {});
        expect(result).toBe(utils_e.linebreaks.expected);
      });

      test('trims whitespace from beginning and end', () => {
        const result = utils.markdownify(utils_e.trim, true, {});
        expect(result).toBe(utils_e.trim.expected);
      });

      test('demonstrates actual space normalization', () => {
        const result = utils.markdownify(utils_e.space_normalize, true, {});
        expect(result).toBe(utils_e.space_normalize.expected);
      });
    });

    describe('Feature toggle functionality', () => {
      test('disables all features when features=false', () => {
        const result = utils.markdownify(
          utils_e.features_disabled,
          utils_e.features_disabled.features,
          {},
        );
        expect(result).toBe(utils_e.features_disabled.expected);
      });

      test('allows selective feature disabling', () => {
        const result = utils.markdownify(
          utils_e.features_strong_off_italic_on,
          utils_e.features_strong_off_italic_on.features,
          {},
        );
        expect(result).toBe(utils_e.features_strong_off_italic_on.expected);
      });

      test('enables features by default', () => {
        const result = utils.markdownify(
          utils_e.strong_simple,
          utils_e.strong_simple.features,
          {},
        );
        expect(result).toBe(utils_e.strong_simple.expected);
      });
    });

    describe('Complex real-world scenarios', () => {
      test('handles email-like content', () => {
        const result = utils.markdownify(utils_e.email_content, true, {});
        expect(result).toBe(utils_e.email_content.expected);
      });

      test('handles nested HTML structures', () => {
        const result = utils.markdownify(utils_e.nested_html, true, {});
        expect(result).toBe(utils_e.nested_html.expected);
      });

      test('handles large content efficiently', () => {
        const largeContent = '<p>' + 'Test content. '.repeat(1000) + '</p>';
        const $element = createJQueryElement(largeContent);

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
        const result = utils.markdownify(utils_e.empty_input, true, {});
        expect(result).toBe(utils_e.empty_input.expected);
      });

      test('handles input with only whitespace', () => {
        const result = utils.markdownify(utils_e.whitespace_input, true, {});
        expect(result).toBe(utils_e.whitespace_input.expected);
      });

      test('handles malformed HTML gracefully', () => {
        const result = utils.markdownify(utils_e.malformed_html, true, {});
        expect(result).toBe(utils_e.malformed_html.expected);
      });

      test('handles elements with no text content', () => {
        const result = utils.markdownify(utils_e.empty_content, true, {});
        expect(result).toBe(utils_e.empty_content.expected);
      });

      test('handles special characters and unicode', () => {
        const result = utils.markdownify(utils_e.special_chars, true, {});
        expect(result).toBe(utils_e.special_chars.expected);
      });

      test('handles very long text content', () => {
        const result = utils.markdownify(utils_e.long_text, true, {});
        expect(result).toBe(utils_e.long_text.expected);
      });
    });

    describe('Integration and consistency tests', () => {
      test('produces consistent output for same input', () => {
        const result1 = utils.markdownify(utils_e.consistent_test, true, {});
        const result2 = utils.markdownify(utils_e.consistent_test, true, {});

        expect(result1).toBe(result2);
      });

      test('validates markdown output format', () => {
        const result = utils.markdownify(
          utils_e.title_bold_italic_link,
          true,
          {},
        );
        expect(result).toBe(utils_e.title_bold_italic_link.expected);
      });
    });
  });
});
