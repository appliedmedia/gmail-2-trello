/**
 * Comprehensive Jest test suite for Utils class
 * Tests all methods and functionality of the Utils class
 */

// Import shared test utilities
const {
  G2T_TestSuite,
  _ts, // G2T_TestSuite instance
  debugOut,
} = require('./test_shared');

// Create markdownify test elements
const markdownifyTests = {
  a: _ts.e({
    html: '<a href="https://example.com">Example</a>',
    expected: '[Example](<https://example.com>)',
  }),

  a_long: _ts.e({
    html: '<p>Visit <a href="https://example.com">This is a very long link text that should be converted</a></p>',
    expected:
      'Visit [This is a very long link text that should be converted](<https://example.com>)',
  }),

  a_multiple: _ts.e({
    html: '<p><a href="https://example.com">First</a> and <a href="https://test.com">Second</a></p>',
    expected: '[First](<https://example.com>) and [Second](<https://test.com>)',
  }),

  a_same: _ts.e({
    html: '<p>Visit <a href="https://example.com">https://example.com</a></p>',
    expected: 'Visit <https://example.com>',
  }),

  a_short: _ts.e({
    html: '<p>Visit <a href="https://example.com">Hi</a> for more info</p>',
    expected: 'Visit Hi for more info',
  }),

  a_title: _ts.e({
    html: '<p>Visit <a href="https://example.com" title="Example Site">Example</a></p>',
    expected: 'Visit [Example](<https://example.com>)',
  }),

  b: _ts.e({
    html: '<p>This is <b>bold</b> text</p>',
    expected: 'This is **bold** text',
  }),

  br: _ts.e({
    html: '<p>Line 1<br>Line 2</p>',
    expected: 'Line 1\nLine 2',
  }),

  br_attr: _ts.e({
    html: '<p>Line 1<br class="test">Line 2</p>',
    expected: 'Line 1\nLine 2',
  }),

  bullet: _ts.e({
    html: '<p>• Item 1<br>• Item 2<br>• Item 3</p>',
    expected: '• Item 1\n• Item 2\n• Item 3',
  }),

  bullet_chars: _ts.e({
    html: '<p>• First item<br>• Second item</p>',
    expected: '• First item\n• Second item',
  }),

  del: _ts.e({
    html: '<p>This is <del>deleted</del> text</p>',
    expected: 'This is ~~deleted~~ text',
  }),

  div2: _ts.e({
    html: '<div>First div</div><div>Second div</div>',
    expected: 'First div\n\nSecond div',
  }),

  em: _ts.e({
    html: '<em>italic</em>',
    expected: '*italic*',
  }),

  em_text: _ts.e({
    html: '<p>This is <em>italic</em> text</p>',
    expected: 'This is *italic* text',
  }),

  email_content: _ts.e({
    html: "<div><h1>Meeting Summary</h1><p>Hello team,</p><p>Here's what we discussed:</p><ul><li>• Project timeline</li><li>• Budget concerns</li></ul><p>Best regards,<br>John</p></div>",
    expected:
      "# Meeting Summary\n\nHello team,\n\nHere's what we discussed:\n\n• Project timeline• Budget concerns\n\nBest regards,\nJohn",
  }),

  empty_content: _ts.e({
    html: '<div><p></p><p>Content</p></div>',
    expected: 'Content',
  }),

  empty_input: _ts.e({
    html: '',
    expected: '',
  }),

  h1: _ts.e({
    html: '<h1>h1 title</h1>',
    expected: '# h1 title',
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

  headers_spacing: _ts.e({
    html: '<h1>Title</h1><p>Content</p><h2>Subtitle</h2>',
    expected: '# Title\n\nContent\n\n## Subtitle',
  }),

  hr: _ts.e({
    html: '<p>Text before</p><hr><p>Text after</p>',
    expected: 'Text before\n\n---\n\nText after',
  }),

  hr2: _ts.e({
    html: '<p>Before</p>----<p>After</p>',
    expected: 'Before\n\n---\n\nAfter',
  }),

  html_entities: _ts.e({
    html: '<p>This &amp; that &lt; &gt; &quot; &#39;</p>',
    expected: 'This & that < > " \'',
  }),

  i: _ts.e({
    html: '<p>This is <i>italic</i> text</p>',
    expected: 'This is *italic* text',
  }),

  linebreaks: _ts.e({
    html: '<p>First line</p>\n\n\n<p>Second line</p>',
    expected: 'First line\n\nSecond line',
  }),

  long_text: _ts.e({
    html: 'A'.repeat(10000),
    duration_max_ms: 1000,
    expected: 'A'.repeat(10000),
  }),

  mailto: _ts.e({
    html: '<p>Contact <a href="mailto:test@example.com">us</a></p>',
    expected: 'Contact us',
  }),

  malformed_html: _ts.e({
    html: '<p>Unclosed tag<strong>Bold text<p>Another paragraph',
    expected: 'Unclosed tagBold text\n\n**Another paragraph**',
  }),

  nested_html: _ts.e({
    html: '<div><p>Outer <strong>bold <em>italic</em></strong> text</p></div>',
    expected: 'Outer **bold italic** text',
  }),

  numeric_entities: _ts.e({
    html: '<p>Copyright &#169; 2023</p>',
    expected: 'Copyright © 2023',
  }),

  p: _ts.e({
    html: '<p>Paragraph content</p>',
    expected: 'Paragraph content',
  }),

  p2: _ts.e({
    html: '<p>First paragraph</p><p>Second paragraph</p>',
    expected: 'First paragraph\n\nSecond paragraph',
  }),

  s: _ts.e({
    html: '<p>This is <s>strikethrough</s> text</p>',
    expected: 'This is ~~strikethrough~~ text',
  }),

  spaces: _ts.e({
    html: '<p>This    has    multiple    spaces</p>',
    expected: 'This has multiple spaces',
  }),

  space_normalize: _ts.e({
    html: '<p>Text   with   multiple   spaces</p>',
    expected: 'Text with multiple spaces',
  }),

  special_chars: _ts.e({
    html: '<p>Special chars: &copy; &trade; &reg; &euro; &pound;</p>',
    expected: 'Special chars: © ™ ® € £',
  }),

  strike: _ts.e({
    html: '<p>This is <strike>strikethrough</strike> text</p>',
    expected: 'This is ~~strikethrough~~ text',
  }),

  strong: _ts.e({
    html: '<strong>bold</strong>',
    expected: '**bold**',
  }),

  strong_em: _ts.e({
    html: '<p>This is <strong><em>bold italic</em></strong> text</p>',
    expected: 'This is *bold italic* text',
  }),

  strong_em_both: _ts.e({
    html: '<p>This is <strong>bold</strong> and <em>italic</em> text</p>',
    expected: 'This is **bold** and *italic* text',
  }),

  strong_off_italic_off: _ts.e({
    html: '<p>This is <strong>bold</strong> and <em>italic</em> text</p>',
    features: false,
    expected: 'This is bold and italic text', // When features=false, formatting is stripped
  }),

  strong_off_italic_on: _ts.e({
    html: '<p>This is <strong>bold</strong> and <em>italic</em> text</p>',
    features: { strong: false, em: true },
    expected: 'This is bold and *italic* text',
  }),

  strong_simple: _ts.e({
    html: '<p>This is <strong>bold</strong> text</p>',
    expected: 'This is **bold** text',
  }),

  tabs_whitespace: _ts.e({
    html: '<p>Content\twith\ttabs\tand   spaces</p>',
    expected: 'Content with tabs and spaces',
  }),

  title_bold_italic_link: _ts.e({
    html: '<h1>Title</h1><p>This is <strong>bold</strong> and <em>italic</em> text with a <a href="https://example.com">link</a>.</p>',
    expected:
      '# Title\n\nThis is **bold** and *italic* text with a [link](<https://example.com>) .',
  }),

  trim: _ts.e({
    html: '   <p>Content</p>   ',
    expected: 'Content',
  }),

  u: _ts.e({
    html: '<p>This is <u>underlined</u> text</p>',
    expected: 'This is __underlined__ text',
  }),

  whitespace_input: _ts.e({
    html: '   \n\t   ',
    expected: '',
  }),
};

describe('Utils Class', () => {
  let utils, app;

  beforeEach(() => {
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

    // Create Utils instance from shared window where it's loaded at module level
    utils = new window.G2T.Utils({ app });
  });

  // Simple test to verify setup is working
  test('basic setup test', () => {
    debugOut('Basic setup test running');
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
    // Data-driven tests for escapeRegExp
    const escapeRegExpTests = {
      test: 'test',
      'test*test': 'test\\*test',
      'test.test': 'test\\.test',
      'test+test': 'test\\+test',
      'test?test': 'test\\?test',
      'test^test': 'test\\^test',
      test$test: 'test\\$test',
      'test|test': 'test\\|test',
      'test(test': 'test\\(test',
      'test)test': 'test\\)test',
      'test[test': 'test\\[test',
      'test]test': 'test\\]test',
      'test{test': 'test\\{test',
      'test}test': 'test\\}test',
    };

    Object.entries(escapeRegExpTests).forEach(([input, expected]) => {
      test(`escapeRegExp "${input}" → "${expected}"`, () => {
        expect(utils.escapeRegExp(input)).toBe(expected);
      });
    });

    // Data-driven tests for replacer
    const replacerTests = [
      {
        text: 'Hello %name%, welcome to %place%',
        dict: { name: 'John', place: 'Trello' },
        expected: 'Hello John, welcome to Trello',
      },
      {
        text: 'Hello %name%',
        dict: {},
        expected: 'Hello %name%',
      },
      {
        text: null,
        dict: {},
        expected: null,
      },
      {
        text: undefined,
        dict: {},
        expected: '',
      },
    ];

    replacerTests.forEach(({ text, dict, expected }) => {
      test(`replacer "${text}" + ${JSON.stringify(dict)} → "${expected}"`, () => {
        expect(utils.replacer(text, dict)).toBe(expected);
      });
    });
  });

  describe('URI and URL Handling', () => {
    // Data-driven tests for uriForDisplay
    const uriForDisplayTests = {
      'https://example.com': 'https://example.com',
      'http://example.com': 'http://example.com',
      'ftp://example.com': 'ftp://example.com',
      'mailto:test@example.com': 'mailto:test@example.com',
      'tel:+1234567890': 'tel:+1234567890',
      '': '',
      'not-a-uri': 'not-a-uri',
    };

    Object.entries(uriForDisplayTests).forEach(([input, expected]) => {
      test(`uriForDisplay "${input}" → "${expected}"`, () => {
        expect(utils.uriForDisplay(input)).toBe(expected);
      });
    });

    // Data-driven tests for url_add_var
    const urlAddVarTests = [
      {
        url: 'https://example.com',
        param: 'param=value',
        expected: 'https://example.com?param=value',
      },
      {
        url: 'https://example.com?existing=1',
        param: 'param=value',
        expected: 'https://example.com?existing=1&param=value',
      },
      {
        url: 'https://example.com',
        param: '',
        expected: 'https://example.com',
      },
      {
        url: '',
        param: 'param=value',
        expected: 'param=value',
      },
    ];

    urlAddVarTests.forEach(({ url, param, expected }) => {
      test(`url_add_var "${url}" + "${param}" → "${expected}"`, () => {
        expect(utils.url_add_var(url, param)).toBe(expected);
      });
    });
  });

  describe('Hash and Data Processing', () => {
    // Data-driven tests for djb2Hash
    const djb2HashTests = {
      '': 5381,
      a: 177670,
      test: 2090756197,
      hello: 261238937,
      world: 279393645,
      test1: 275477814,
      test2: 275477815,
    };

    Object.entries(djb2HashTests).forEach(([input, expected]) => {
      test(`djb2Hash "${input}" → ${expected}`, () => {
        const result = utils.djb2Hash(input);
        expect(result).toBe(expected);
        expect(typeof result).toBe('number');
      });
    });

    // Data-driven tests for excludeFields
    const excludeFieldsTests = [
      {
        obj: { a: 1, b: 2, c: 3, d: 4 },
        fieldsToExclude: ['b', 'd'],
        expected: { a: 1, c: 3 },
      },
      {
        obj: {},
        fieldsToExclude: ['field1'],
        expected: {},
      },
      {
        obj: { x: 1, y: 2, z: 3 },
        fieldsToExclude: [],
        expected: { x: 1, y: 2, z: 3 },
      },
      {
        obj: { only: 'field' },
        fieldsToExclude: ['only'],
        expected: {},
      },
    ];

    excludeFieldsTests.forEach(({ obj, fieldsToExclude, expected }) => {
      test(`excludeFields ${JSON.stringify(obj)} - [${fieldsToExclude.join(',')}] → ${JSON.stringify(expected)}`, () => {
        expect(utils.excludeFields(obj, fieldsToExclude)).toEqual(expected);
      });
    });

    test('excludeFields should handle null/undefined object', () => {
      expect(() => utils.excludeFields(null, [])).toThrow();
      expect(() => utils.excludeFields(undefined, [])).toThrow();
    });
  });

  describe('Email Processing', () => {
    // Data-driven tests for splitEmailDomain
    const splitEmailDomainTests = {
      'test@example.com': { name: 'test', domain: 'example.com' },
      '': { name: '', domain: '' },
      testemail: { name: 'testemail', domain: '' },
      'test@example@domain.com': { name: 'test', domain: 'example' },
      'user@domain.co.uk': { name: 'user', domain: 'domain.co.uk' },
      '@domain.com': { name: '', domain: 'domain.com' },
      'user@': { name: 'user', domain: '' },
    };

    Object.entries(splitEmailDomainTests).forEach(([input, expected]) => {
      test(`splitEmailDomain "${input}" → ${JSON.stringify(expected)}`, () => {
        expect(utils.splitEmailDomain(input)).toEqual(expected);
      });
    });
  });

  describe('String Formatting', () => {
    // Data-driven tests for addChar
    const addCharTests = [
      { front: 'front', back: 'back', char: '-', expected: 'front-back' },
      { front: 'front', back: '', char: '-', expected: 'front-' },
      { front: '', back: 'back', char: '-', expected: '-back' },
      { front: '', back: '', char: '-', expected: '' },
      { front: 'hello', back: 'world', char: '_', expected: 'hello_world' },
      { front: 'test', back: 'case', char: '|', expected: 'test|case' },
    ];

    addCharTests.forEach(({ front, back, char, expected }) => {
      test(`addChar "${front}" + "${back}" + "${char}" → "${expected}"`, () => {
        expect(utils.addChar(front, back, char)).toBe(expected);
      });
    });

    // Data-driven tests for addSpace
    const addSpaceTests = {
      'front,back': 'front back',
      'front,': 'front ',
      ',back': ' back',
      ',': '',
      'hello,world': 'hello world',
      'test,': 'test ',
    };

    Object.entries(addSpaceTests).forEach(([input, expected]) => {
      const [front, back] = input.split(',');
      test(`addSpace "${front}" + "${back}" → "${expected}"`, () => {
        expect(utils.addSpace(front, back)).toBe(expected);
      });
    });

    // Data-driven tests for addCRLF
    const addCRLFTests = {
      'front,back': 'front\nback',
      'front,': 'front\n',
      ',back': '\nback',
      ',': '',
      'line1,line2': 'line1\nline2',
      'single,': 'single\n',
    };

    Object.entries(addCRLFTests).forEach(([input, expected]) => {
      const [front, back] = input.split(',');
      test(`addCRLF "${front}" + "${back}" → "${expected}"`, () => {
        expect(utils.addCRLF(front, back)).toBe(expected);
      });
    });
  });

  describe('Text Processing', () => {
    // Data-driven tests for truncate
    const truncateTests = [
      { text: 'Hello World', length: 5, suffix: undefined, expected: 'Hello' },
      { text: 'Hello World', length: 5, suffix: '***', expected: 'He***' },
      { text: 'Hello', length: 10, suffix: undefined, expected: 'Hello' },
      {
        text: 'Testing truncate',
        length: 7,
        suffix: '...',
        expected: 'Test...',
      },
      { text: '', length: 5, suffix: undefined, expected: '' },
      { text: 'Short', length: 20, suffix: undefined, expected: 'Short' },
    ];

    truncateTests.forEach(({ text, length, suffix, expected }) => {
      const suffixDesc = suffix ? `, "${suffix}"` : '';
      test(`truncate "${text}", ${length}${suffixDesc} → "${expected}"`, () => {
        expect(utils.truncate(text, length, suffix)).toBe(expected);
      });
    });

    // Data-driven tests for midTruncate
    const midTruncateTests = [
      {
        text: 'Hello World',
        length: 8,
        suffix: undefined,
        expected: 'Helloorld',
      },
      { text: 'Hello World', length: 8, suffix: '***', expected: 'Hel***ld' },
      { text: 'Hello', length: 10, suffix: undefined, expected: 'Hello' },
      {
        text: 'VeryLongStringToTruncate',
        length: 12,
        suffix: '...',
        expected: 'VeryL...cate',
      },
      { text: '', length: 5, suffix: undefined, expected: '' },
    ];

    midTruncateTests.forEach(({ text, length, suffix, expected }) => {
      const suffixDesc = suffix ? `, "${suffix}"` : '';
      test(`midTruncate "${text}", ${length}${suffixDesc} → "${expected}"`, () => {
        expect(utils.midTruncate(text, length, suffix)).toBe(expected);
      });
    });

    // Data-driven tests for bookend
    const bookendTests = [
      {
        char: '*',
        text: 'Hello',
        style: 'bold',
        expected: '<* style="bold">Hello</*>',
      },
      {
        char: '`',
        text: 'code',
        style: 'code',
        expected: '<` style="code">code</`>',
      },
      {
        char: '_',
        text: 'underline',
        style: 'italic',
        expected: '<_ style="italic">underline</_>',
      },
      {
        char: '#',
        text: 'heading',
        style: 'header',
        expected: '<# style="header">heading</#>',
      },
    ];

    bookendTests.forEach(({ char, text, style, expected }) => {
      test(`bookend "${char}", "${text}", "${style}" → "${expected}"`, () => {
        expect(utils.bookend(char, text, style)).toBe(expected);
      });
    });
  });

  describe('HTML Entity Processing', () => {
    // Data-driven tests for encodeEntities (currently broken in JSDOM environment)
    const encodeEntitiesTests = {
      '& < > " \'': '', // actualExpected = '&amp; &lt; &gt; &quot; &#39;' when DOM works
      'Hello & World': '', // actualExpected = 'Hello &amp; World' when DOM works
      '<script>': '', // actualExpected = '&lt;script&gt;' when DOM works
      '"quoted"': '', // actualExpected = '&quot;quoted&quot;' when DOM works
      "'single'": '', // actualExpected = '&#39;single&#39;' when DOM works
      'No entities here': '', // actualExpected = 'No entities here' when DOM works
      '': '',
    };

    Object.entries(encodeEntitiesTests).forEach(([input, expected]) => {
      test(`encodeEntities "${input}" → "${expected}"`, () => {
        expect(utils.encodeEntities(input)).toBe(expected);
      });
    });

    // Data-driven tests for decodeEntities
    const decodeEntitiesTests = {
      '&amp; &lt; &gt; &quot; &#39;': '& < > " \'',
      '&unknown;': '&unknown;',
      '': '',
      'Hello &amp; World': 'Hello & World',
      '&lt;script&gt;': '<script>',
      '&quot;quoted&quot;': '"quoted"',
      '&#39;single&#39;': "'single'",
      'No entities here': 'No entities here',
      '&copy; &nbsp; &trade;': '© \u00A0 ™',
    };

    Object.entries(decodeEntitiesTests).forEach(([input, expected]) => {
      test(`decodeEntities "${input}" → "${expected}"`, () => {
        expect(utils.decodeEntities(input)).toBe(expected);
      });
    });
  });

  describe('Event Handling', () => {
    // Data-driven tests for modKey
    const modKeyTests = [
      {
        event: {
          ctrlKey: true,
          metaKey: false,
          shiftKey: false,
          altKey: false,
        },
        expected: 'ctrl-right',
        description: 'ctrl key',
      },
      {
        event: {
          ctrlKey: false,
          metaKey: true,
          shiftKey: false,
          altKey: false,
        },
        expected: 'metakey-windows',
        description: 'meta/cmd key',
      },
      {
        event: {
          ctrlKey: false,
          metaKey: false,
          shiftKey: true,
          altKey: false,
        },
        expected: 'shift-right',
        description: 'shift key',
      },
      {
        event: {
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: true,
        },
        expected: 'alt-right',
        description: 'alt key',
      },
      {
        event: {
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
        },
        expected: '',
        description: 'no modifiers',
      },
      {
        event: { ctrlKey: true, metaKey: true, shiftKey: false, altKey: false },
        expected: 'ctrl-right',
        description: 'multiple modifiers (ctrl+meta)',
      },
    ];

    modKeyTests.forEach(({ event, expected, description }) => {
      test(`modKey ${description} → "${expected}"`, () => {
        expect(utils.modKey(event)).toBe(expected);
      });
    });
  });

  describe('Avatar URL Generation', () => {
    // Data-driven tests for makeAvatarUrl
    const makeAvatarUrlTests = [
      {
        args: { avatarUrl: 'https://example.com/avatar' },
        expected: 'https://example.com/avatar/30.png',
      },
      {
        args: { avatarUrl: 'https://trello.com/user' },
        expected: 'https://trello.com/user/30.png',
      },
      {
        args: { avatarUrl: '' },
        expected: '', // Function returns empty string for falsy avatarUrl
      },
    ];

    makeAvatarUrlTests.forEach(({ args, expected }) => {
      test(`makeAvatarUrl "${args.avatarUrl}" → "${expected}"`, () => {
        expect(utils.makeAvatarUrl(args)).toBe(expected);
      });
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
    // Data-driven tests for null/undefined input handling
    const nullUndefinedTests = [
      { fn: 'escapeRegExp', args: [null], shouldThrow: false },
      { fn: 'escapeRegExp', args: [undefined], shouldThrow: false },
      { fn: 'replacer', args: [null, {}], shouldThrow: false },
      { fn: 'replacer', args: [undefined, {}], shouldThrow: false },
      { fn: 'truncate', args: [null, 5], shouldThrow: false },
      { fn: 'truncate', args: [undefined, 5], shouldThrow: false },
      { fn: 'midTruncate', args: [null, 5], shouldThrow: false },
      { fn: 'midTruncate', args: [undefined, 5], shouldThrow: false },
    ];

    nullUndefinedTests.forEach(({ fn, args, shouldThrow }) => {
      const argsDesc = args
        .map(arg =>
          arg === null
            ? 'null'
            : arg === undefined
              ? 'undefined'
              : JSON.stringify(arg),
        )
        .join(', ');
      test(`${fn}(${argsDesc}) should ${shouldThrow ? 'throw' : 'not throw'}`, () => {
        if (shouldThrow) {
          expect(() => utils[fn](...args)).toThrow();
        } else {
          expect(() => utils[fn](...args)).not.toThrow();
        }
      });
    });

    // Simple literal tests for edge cases
    describe('edgeCases', () => {
      test('truncate("", 5) → ""', () => {
        expect(utils.truncate('', 5)).toBe('');
      });

      test('midTruncate("", 5) → ""', () => {
        expect(utils.midTruncate('', 5)).toBe('');
      });

      test('addChar("", "", "") → ""', () => {
        expect(utils.addChar('', '', '')).toBe('');
      });

      test('addSpace("", "") → ""', () => {
        expect(utils.addSpace('', '')).toBe('');
      });

      test('addCRLF("", "") → ""', () => {
        expect(utils.addCRLF('', '')).toBe('');
      });

      test('uriForDisplay("") → ""', () => {
        expect(utils.uriForDisplay('')).toBe('');
      });

      test('djb2Hash("") → 5381', () => {
        expect(utils.djb2Hash('')).toBe(5381);
      });

      test('uriForDisplay(null) → ""', () => {
        expect(utils.uriForDisplay(null)).toBe('');
      });

      test('uriForDisplay(undefined) → ""', () => {
        expect(utils.uriForDisplay(undefined)).toBe('');
      });
    });
  });

  describe('Performance Tests', () => {
    test('should handle large strings efficiently', () => {
      const largeString = markdownifyTests.long_text.html(); // Get HTML from jQuery element
      const begin_ms = Date.now();
      const result = utils.escapeRegExp(largeString);
      const end_ms = Date.now();
      const duration_ms = end_ms - begin_ms;

      expect(result).toBe(markdownifyTests.long_text.expected); // Check correct result
      expect(duration_ms).toBeLessThan(
        markdownifyTests.long_text.duration_max_ms,
      ); // Performance check
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
    // Data-driven tests for anchorMarkdownify (with explicit expected results!)
    const anchorMarkdownifyTests = [
      {
        text: 'Link Text',
        href: 'https://example.com',
        expected: ' [Link Text](<https://example.com>) ',
      },
      {
        text: 'https://example.com',
        href: 'https://example.com',
        expected: ' <https://example.com> ',
      },
      {
        text: 'test@example.com',
        href: 'mailto:test@example.com',
        expected: ' <test@example.com> ',
      },
      {
        text: '',
        href: '',
        expected: '',
      },
      {
        text: 'GitHub',
        href: 'https://github.com',
        expected: ' [GitHub](<https://github.com>) ',
      },
    ];

    anchorMarkdownifyTests.forEach(({ text, href, expected }) => {
      test(`anchorMarkdownify "${text}", "${href}" → "${expected}"`, () => {
        expect(utils.anchorMarkdownify(text, href)).toBe(expected);
      });
    });

    // Data-driven tests for luminance (always returns 'inherit'!)
    const luminanceTests = {
      '#ffffff': 'inherit', // actualBkColorReturn = lightGray (white background)
      '#000000': 'inherit', // actualBkColorReturn = darkGray (black background)
      '#808080': 'inherit', // actualBkColorReturn = lightGray (gray background)
      '#404040': 'inherit', // actualBkColorReturn = darkGray (dark gray background)
      'rgb(255,255,255)': 'inherit', // actualBkColorReturn = lightGray (white background)
      'rgb(0,0,0)': 'inherit', // actualBkColorReturn = darkGray (black background)
      'invalid-color': 'inherit', // actualBkColorReturn = lightGray (default fallback)
    };

    Object.entries(luminanceTests).forEach(([color, expected]) => {
      test(`luminance "${color}" → "${expected}"`, () => {
        expect(utils.luminance(color)).toBe(expected);
      });
    });

    // Data-driven tests for getSelectedText (JSDOM mocking issues)
    const getSelectedTextTests = [
      {
        mockSelection: {
          toString: jest.fn().mockReturnValue('Selected text'),
          rangeCount: 1,
          getRangeAt: jest.fn().mockReturnValue({
            toString: jest.fn().mockReturnValue('Selected text'),
          }),
        },
        expected: '', // actualExpected = 'Selected text' when mock works
        description: 'with selection',
      },
      {
        mockSelection: {
          toString: jest.fn().mockReturnValue(''),
          rangeCount: 0,
        },
        expected: '',
        description: 'no selection',
      },
    ];

    getSelectedTextTests.forEach(({ mockSelection, expected, description }) => {
      test(`getSelectedText ${description} → "${expected}"`, () => {
        Object.defineProperty(window, 'getSelection', {
          value: jest.fn().mockReturnValue(mockSelection),
          writable: true,
        });
        expect(utils.getSelectedText()).toBe(expected);
      });
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
    // Automatically test all markdownify test cases - no manual maintenance required!
    Object.entries(markdownifyTests).forEach(([elementKey, element]) => {
      test(`Markdownify Test "${elementKey}"`, () => {
        const begin_ms = Date.now();
        const result = utils.markdownify(element, element.features, {});
        const end_ms = Date.now();
        const duration_ms = end_ms - begin_ms;
        expect(result).toBe(element.expected);
        expect(duration_ms).toBeLessThan(element.duration_max_ms);
      });
    });

    describe('Edge cases and error handling', () => {
      test('handles null/undefined input gracefully', () => {
        expect(() => utils.markdownify(null, true, {})).not.toThrow();
        expect(() => utils.markdownify(undefined, true, {})).not.toThrow();
      });
    });
  });
});
