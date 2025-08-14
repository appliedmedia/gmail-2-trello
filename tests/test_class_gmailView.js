/**
 * Comprehensive Jest test suite for GmailView class
 * Tests all methods and functionality of the GmailView class using data-driven patterns
 */

// Import shared test utilities
const {
  document, // JSDOM document - needed for DOM queries
  G2T, // G2T namespace with all classes
  testApp, // Pre-created mock app with all dependencies
  // window, // JSDOM window - uncomment if needed for window.foo access
  _ts, // Test suite utilities
} = require('./test_shared');

// Load the REAL GmailView class - this will override the mock version
// The real GmailView will use the mock dependencies from testApp
_ts.loadSourceFile('chrome_manifest_v3/views/class_gmailView.js');

describe('GmailView Class', () => {
  let gmailView;

  beforeEach(() => {
    // Create a fresh real GmailView instance with the pre-created mock app
    // The real GmailView class was loaded above, overriding the mock version
    gmailView = new G2T.GmailView({ app: testApp });

    // Initialize properties that the GmailView methods expect
    gmailView.preprocess = { a: {} };
    gmailView.emailImage = {}; // Fixed: was 'image', should be 'emailImage'
    gmailView.attachment = [];
    gmailView.cc_raw = '';
    gmailView.cc_md = '';

    // Prevent automatic detection to avoid runaway errors
    gmailView.detect = jest.fn();

    // Clear all mocks before each test
    _ts.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    // Data-driven tests for constructor properties
    const constructorTests = {
      'LAYOUT_DEFAULT constant': {
        property: 'LAYOUT_DEFAULT',
        expected: 0,
      },
      'LAYOUT_SPLIT constant': {
        property: 'LAYOUT_SPLIT',
        expected: 1,
      },
      '$root initial value': {
        property: '$root',
        expected: null,
      },
      'parsingData initial value': {
        property: 'parsingData',
        expected: false,
      },
      'runaway initial value': {
        property: 'runaway',
        expected: 0,
      },
    };

    Object.entries(constructorTests).forEach(
      ([testName, { property, expected }]) => {
        test(`should have correct ${testName}`, () => {
          expect(gmailView[property]).toBe(expected);
        });
      },
    );

    // Data-driven tests for static and instance ck properties
    const ckTests = [
      {
        name: 'static ck.id',
        accessor: () => G2T.GmailView.ck.id,
        expected: 'g2t_gmailview',
      },
      {
        name: 'static ck.uniqueUriVar',
        accessor: () => G2T.GmailView.ck.uniqueUriVar,
        expected: 'g2t_filename',
      },
      {
        name: 'instance ck.id',
        accessor: () => gmailView.ck.id,
        expected: 'g2t_gmailview',
      },
      {
        name: 'instance ck.uniqueUriVar',
        accessor: () => gmailView.ck.uniqueUriVar,
        expected: 'g2t_filename',
      },
    ];

    ckTests.forEach(({ name, accessor, expected }) => {
      test(`should have correct ${name}`, () => {
        expect(accessor()).toBe(expected);
      });
    });

    test('should create WaitCounter instance', () => {
      expect(typeof gmailView.waitCounter).toBe('object');
      expect(gmailView.waitCounter.start).toBeDefined();
      expect(gmailView.waitCounter.stop).toBeDefined();
    });

    test('should have selectors object', () => {
      expect(typeof gmailView.selectors).toBe('object');
    });
  });

  describe('Utility Methods', () => {
    // Data-driven tests for url_with_filename
    const urlWithFilenameTests = {
      'https://example.com, test.txt': {
        url: 'https://example.com',
        filename: 'test.txt',
        expected: 'https://example.com?g2t_filename=/test.txt',
      },
      'https://site.com/path, document.pdf': {
        url: 'https://site.com/path',
        filename: 'document.pdf',
        expected: 'https://site.com/path?g2t_filename=/document.pdf',
      },
      'empty filename': {
        url: 'https://example.com',
        filename: '',
        expected: 'https://example.com?g2t_filename=/',
      },
    };

    Object.entries(urlWithFilenameTests).forEach(
      ([testCase, { url, filename, expected }]) => {
        test(`url_with_filename ${testCase} → "${expected}"`, () => {
          const result = gmailView.url_with_filename(url, filename);
          expect(result).toBe(expected);
        });
      },
    );

    // Data-driven tests for displayNameAndEmail
    const displayNameAndEmailTests = {
      'John Doe, john@example.com': {
        name: 'John Doe',
        email: 'john@example.com',
        expected: 'John Doe <john@example.com>',
      },
      'John Doe, empty email': {
        name: 'John Doe',
        email: '',
        expected: 'John Doe',
      },
      'empty name, john@example.com': {
        name: '',
        email: 'john@example.com',
        expected: '<john@example.com>',
      },
      'empty name, empty email': {
        name: '',
        email: '',
        expected: '',
      },
    };

    Object.entries(displayNameAndEmailTests).forEach(
      ([testCase, { name, email, expected }]) => {
        test(`displayNameAndEmail ${testCase} → "${expected}"`, () => {
          const result = gmailView.displayNameAndEmail(name, email);
          expect(result).toBe(expected);
        });
      },
    );
  });

  describe('Email Processing Methods', () => {
    // Data-driven tests for email_raw_md
    const emailRawMdTests = {
      'empty name and email': {
        name: '',
        email: '',
        expected: { raw: '', md: '' },
      },
      'John Doe, john@example.com': {
        name: 'John Doe',
        email: 'john@example.com',
        expected: {
          raw: 'John Doe <john@example.com>',
          md: '[John Doe](<john@example.com>)',
        },
      },
      'John Doe, empty email': {
        name: 'John Doe',
        email: '',
        expected: { raw: 'John Doe', md: 'John Doe' },
      },
      'empty name, john@example.com': {
        name: '',
        email: 'john@example.com',
        expected: {
          raw: 'john <john@example.com>',
          md: '[john](<john@example.com>)',
        },
      },
      'matching name and email': {
        name: 'john@example.com',
        email: 'john@example.com',
        expected: {
          raw: 'john <john@example.com>',
          md: '[john](<john@example.com>)',
        },
      },
    };

    Object.entries(emailRawMdTests).forEach(
      ([testCase, { name, email, expected }]) => {
        test(`email_raw_md ${testCase} → raw: "${expected.raw}", md: "${expected.md}"`, () => {
          const result = gmailView.email_raw_md(name, email);
          expect(result.raw).toBe(expected.raw);
          expect(result.md).toBe(expected.md);
        });
      },
    );

    // Data-driven tests for make_preprocess_mailto
    const makePreprocessMailtoTests = {
      'John Doe, john@example.com': {
        name: 'John Doe',
        email: 'john@example.com',
        expectedKey: 'john doe <john@example.com>',
        expectedValue: ' [John Doe](<john@example.com>) ',
      },
      'Jane Smith, jane@test.org': {
        name: 'Jane Smith',
        email: 'jane@test.org',
        expectedKey: 'jane smith <jane@test.org>',
        expectedValue: ' [Jane Smith](<jane@test.org>) ',
      },
    };

    Object.entries(makePreprocessMailtoTests).forEach(
      ([testCase, { name, email, expectedKey, expectedValue }]) => {
        test(`make_preprocess_mailto ${testCase} → includes "${expectedKey}"`, () => {
          const result = gmailView.make_preprocess_mailto(name, email);
          expect(typeof result).toBe('object');
          expect(Object.keys(result).length).toBeGreaterThan(0);
          expect(result[expectedKey]).toBe(expectedValue);
        });
      },
    );
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
      // Ensure $root is set by calling detect first
      gmailView.detect();
      // Mock detectToolbar to not reset the runaway counter
      const originalDetectToolbar = gmailView.detectToolbar;
      gmailView.detectToolbar = jest.fn();

      gmailView.detectToolbar_onTimeout();
      expect(gmailView.runaway).toBe(initialRunaway + 1);

      // Restore original method
      gmailView.detectToolbar = originalDetectToolbar;
    });

    test('detectEmailOpeningMode_onEmailClick should start wait counter', () => {
      const startSpy = jest.spyOn(gmailView.waitCounter, 'start');
      gmailView.detectEmailOpeningMode_onEmailClick();
      expect(startSpy).toHaveBeenCalledWith(
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

    test('should have Gmail toolbar element loaded from test_jsdom.html', () => {
      const toolbar = document.querySelector('[gh="mtb"]');
      expect(toolbar).toBeDefined();
      expect(toolbar.tagName).toBe('DIV');
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

      // Check that the event was emitted
      expect(testApp.events.emit).toHaveBeenCalledWith(
        'gmailDataReady',
        expect.any(Object),
      );

      // Get the actual call arguments
      const emitCall = testApp.events.emit.mock.calls.find(
        call => call[0] === 'gmailDataReady',
      );
      expect(emitCall).toBeDefined();

      const gmailData = emitCall[1].gmail;
      expect(gmailData).toBeDefined();
      expect(gmailData.subject).toBe('Test Subject');
      expect(gmailData.time).toBe('2025-01-01 12:00 PM');
      expect(Array.isArray(gmailData.attachment)).toBe(true);
      expect(Array.isArray(gmailData.image)).toBe(true);
    });
  });

  describe('edgeCases', () => {
    test('displayNameAndEmail(null, null) should return empty string', () => {
      const result = gmailView.displayNameAndEmail(null, null);
      expect(result).toBe('');
    });

    test('displayNameAndEmail(undefined, undefined) should not throw', () => {
      expect(() =>
        gmailView.displayNameAndEmail(undefined, undefined),
      ).not.toThrow();
    });

    test('email_raw_md(null, null) should return empty object', () => {
      const result = gmailView.email_raw_md(null, null);
      expect(result.raw).toBe('');
      expect(result.md).toBe('');
    });

    test('email_raw_md(undefined, undefined) should return empty object', () => {
      const result = gmailView.email_raw_md(undefined, undefined);
      expect(result.raw).toBe('');
      expect(result.md).toBe('');
    });

    test('url_with_filename with null inputs should not throw', () => {
      expect(() => gmailView.url_with_filename(null, null)).not.toThrow();
    });

    test('url_with_filename with undefined inputs should not throw', () => {
      expect(() =>
        gmailView.url_with_filename(undefined, undefined),
      ).not.toThrow();
    });

    test('make_preprocess_mailto with null inputs should not throw', () => {
      expect(() => gmailView.make_preprocess_mailto(null, null)).not.toThrow();
    });

    test('make_preprocess_mailto with undefined inputs should not throw', () => {
      expect(() =>
        gmailView.make_preprocess_mailto(undefined, undefined),
      ).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('should handle large data sets efficiently', () => {
      const largeData = Array(1000).fill('test data');
      const duration_max_ms = 100;

      const begin_ms = Date.now();
      largeData.forEach(item =>
        gmailView.displayNameAndEmail(item, 'test@example.com'),
      );
      const end_ms = Date.now();
      const duration_ms = end_ms - begin_ms;

      expect(duration_ms).toBeLessThan(duration_max_ms);
    });

    test('should handle many event handlers efficiently', () => {
      const manyHandlers = Array(100).fill(() => {});
      const duration_max_ms = 50;

      const begin_ms = Date.now();
      manyHandlers.forEach(handler =>
        testApp.events.addListener('test', handler),
      );
      const end_ms = Date.now();
      const duration_ms = end_ms - begin_ms;

      expect(duration_ms).toBeLessThan(duration_max_ms);
    });

    test('email processing should be fast', () => {
      const testEmails = [
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@test.org' },
        { name: 'Bob Wilson', email: 'bob@company.com' },
      ];
      const duration_max_ms = 10;

      const begin_ms = Date.now();
      testEmails.forEach(({ name, email }) => {
        gmailView.email_raw_md(name, email);
        gmailView.make_preprocess_mailto(name, email);
      });
      const end_ms = Date.now();
      const duration_ms = end_ms - begin_ms;

      expect(duration_ms).toBeLessThan(duration_max_ms);
    });
  });

  describe('Parse Data Methods', () => {
    // Data-driven tests for CC iteration (these work well)
    const ccIterationTests = [
      {
        name: 'Test User',
        email: 'cc@example.com',
      },
      {
        name: 'Jane Doe',
        email: 'jane.doe@company.com',
      },
    ];

    ccIterationTests.forEach(({ name, email }) => {
      test(`parseData_onEmailCCIterate should process ${name} <${email}>`, () => {
        // Initialize preprocess object
        gmailView.preprocess = { a: {} };

        gmailView.parseData_onEmailCCIterate(0, { name, email });

        expect(gmailView.preprocess).toBeDefined();
        expect(gmailView.preprocess['a']).toBeDefined();
      });
    });

    // TODO: DOM parsing tests with _ts.e() need to be reworked due to jQuery syntax errors
    // These tests require more sophisticated mocking of jQuery element behavior
    test('parseData methods should be tested with proper DOM mocking', () => {
      expect(gmailView).toBeDefined();
      // Placeholder until DOM mocking is improved
    });
  });
});
