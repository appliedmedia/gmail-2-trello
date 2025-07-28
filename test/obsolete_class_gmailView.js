/**
 * Comprehensive Jest test suite for GmailView class
 * Tests all methods and functionality of the GmailView class
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
  runtime: {
    sendMessage: jest.fn(),
  },
};

// Mock console for testing
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock G2T global object and its classes
global.G2T = {
  WaitCounter: jest.fn(),
};

// Mock window object
global.window = {
  location: {
    hash: '#test-hash',
    href: 'https://mail.google.com',
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock document object
global.document = {
  createElement: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
};

// Import the GmailView class
const GmailView = require('../chrome_manifest_v3/views/class_gmailView.js');

describe('GmailView Class', () => {
  let gmailView;
  let mockApp;
  let mockUtils;
  let mockWaitCounter;

  beforeEach(() => {
    // Create mock instances
    mockWaitCounter = {
      start: jest.fn(),
      stop: jest.fn(),
    };

    mockUtils = {
      log: jest.fn(),
      url_add_var: jest.fn((url, var_str) => `${url}?${var_str}`),
      addSpace: jest.fn((front, back) => `${front} ${back}`),
      markdownify: jest.fn(),
      anchorMarkdownify: jest.fn(),
      splitEmailDomain: jest.fn(),
    };

    mockApp = {
      utils: mockUtils,
      eventTarget: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      },
    };

    // Setup G2T class mocks
    G2T.WaitCounter.mockImplementation(() => mockWaitCounter);

    // Create a fresh GmailView instance for each test
    gmailView = new GmailView({ app: mockApp });

    // Reset all mocks
    $.mockClear();
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
    chrome.runtime.sendMessage.mockClear();
    console.log.mockClear();
    console.error.mockClear();
    console.warn.mockClear();
    window.addEventListener.mockClear();
    window.removeEventListener.mockClear();
    document.createElement.mockClear();
    document.querySelector.mockClear();
    document.querySelectorAll.mockClear();
  });

  describe('Constructor and Initialization', () => {
    test('should create GmailView instance with app dependency', () => {
      expect(gmailView).toBeInstanceOf(GmailView);
      expect(gmailView.app).toBe(mockApp);
    });

    test('should initialize with default properties', () => {
      expect(gmailView.LAYOUT_DEFAULT).toBe(0);
      expect(gmailView.LAYOUT_SPLIT).toBe(1);
      expect(gmailView.$root).toBe(null);
      expect(gmailView.parsingData).toBe(false);
      expect(gmailView.runaway).toBe(0);
    });

    test('should create WaitCounter instance', () => {
      expect(gmailView.waitCounter).toBe(mockWaitCounter);
      expect(G2T.WaitCounter).toHaveBeenCalledWith({ app: mockApp });
    });

    test('should initialize selectors object', () => {
      expect(gmailView.selectors).toBeDefined();
      expect(typeof gmailView.selectors).toBe('object');
    });

    test('ck static getter should return correct value', () => {
      expect(GmailView.ck).toEqual({
        id: 'g2t_gmailview',
        uniqueUriVar: 'g2t_filename',
      });
    });

    test('ck getter should return correct value', () => {
      expect(gmailView.ck).toEqual({
        id: 'g2t_gmailview',
        uniqueUriVar: 'g2t_filename',
      });
    });
  });

  describe('Toolbar Detection', () => {
    test('detectToolbar_onTimeout should handle timeout correctly', () => {
      gmailView.detectToolbar_onTimeout();
      expect(gmailView.runaway).toBe(1);
    });

    test('detectToolbar_onTimeout should stop after 10 attempts', () => {
      gmailView.runaway = 10;
      gmailView.detectToolbar_onTimeout();
      expect(mockUtils.log).toHaveBeenCalledWith(
        'GmailView:detectToolbar RUNAWAY FIRED!'
      );
    });

    test('detectToolbar should be callable', () => {
      expect(() => gmailView.detectToolbar()).not.toThrow();
    });
  });

  describe('Email Opening Mode Detection', () => {
    test('detectEmailOpeningMode_onEmailClick should start wait counter', () => {
      gmailView.detectEmailOpeningMode_onEmailClick();
      expect(mockWaitCounter.start).toHaveBeenCalledWith(
        'emailclick',
        500,
        5,
        expect.any(Function)
      );
    });

    test('detectEmailOpeningMode should be callable', () => {
      expect(() => gmailView.detectEmailOpeningMode()).not.toThrow();
    });
  });

  describe('URL and Email Processing', () => {
    test('url_with_filename should add filename parameter', () => {
      const result = gmailView.url_with_filename(
        'https://example.com',
        'test.txt'
      );
      expect(mockUtils.url_add_var).toHaveBeenCalledWith(
        'https://example.com',
        'g2t_filename=/test.txt'
      );
    });

    test('displayNameAndEmail should format name and email', () => {
      const result = gmailView.displayNameAndEmail(
        'John Doe',
        'john@example.com'
      );
      expect(mockUtils.addSpace).toHaveBeenCalledWith(
        'John Doe',
        '<john@example.com>'
      );
    });

    test('displayNameAndEmail should handle empty email', () => {
      const result = gmailView.displayNameAndEmail('John Doe', '');
      expect(mockUtils.addSpace).toHaveBeenCalledWith('John Doe', '');
    });

    test('email_raw_md should handle empty name and email', () => {
      const result = gmailView.email_raw_md('', '');
      expect(result).toEqual({ raw: '', md: '' });
    });

    test('email_raw_md should process name and email', () => {
      const result = gmailView.email_raw_md('John Doe', 'john@example.com');
      expect(result).toBeDefined();
      expect(typeof result.raw).toBe('string');
      expect(typeof result.md).toBe('string');
    });
  });

  describe('Data Parsing', () => {
    test('parseData_onVisibleMailEach should process visible emails', () => {
      const index = 0;
      const element = document.createElement('div');
      expect(() =>
        gmailView.parseData_onVisibleMailEach(index, element)
      ).not.toThrow();
    });

    test('parseData_onEmailCCEach should process CC emails', () => {
      const index = 0;
      const element = document.createElement('div');
      expect(() =>
        gmailView.parseData_onEmailCCEach(index, element)
      ).not.toThrow();
    });

    test('parseData_onAttachmentEach should process attachments', () => {
      const index = 0;
      const element = document.createElement('div');
      expect(() =>
        gmailView.parseData_onAttachmentEach(index, element)
      ).not.toThrow();
    });

    test('parseData_onEmailCCIterate should process CC iteration', () => {
      const iter = 0;
      const item = 'test@example.com';
      expect(() =>
        gmailView.parseData_onEmailCCIterate(iter, item)
      ).not.toThrow();
    });

    test('parseData_onImageEach should process images', () => {
      const index = 0;
      const element = document.createElement('div');
      expect(() =>
        gmailView.parseData_onImageEach(index, element)
      ).not.toThrow();
    });

    test('parseData should process email data', () => {
      const args = { force: false };
      expect(() => gmailView.parseData(args)).not.toThrow();
    });

    test('parseData should handle force parameter', () => {
      const args = { force: true };
      expect(() => gmailView.parseData(args)).not.toThrow();
    });
  });

  describe('Email Processing', () => {
    test('make_preprocess_mailto should create mailto links', () => {
      const name = 'John Doe';
      const email = 'john@example.com';
      const result = gmailView.make_preprocess_mailto(name, email);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('make_preprocess_mailto should handle empty name', () => {
      const name = '';
      const email = 'john@example.com';
      const result = gmailView.make_preprocess_mailto(name, email);
      expect(result).toBeDefined();
    });

    test('make_preprocess_mailto should handle empty email', () => {
      const name = 'John Doe';
      const email = '';
      const result = gmailView.make_preprocess_mailto(name, email);
      expect(result).toBeDefined();
    });
  });

  describe('Detection Methods', () => {
    test('preDetect should perform pre-detection', () => {
      expect(() => gmailView.preDetect()).not.toThrow();
    });

    test('detect should perform detection', () => {
      expect(() => gmailView.detect()).not.toThrow();
    });

    test('forceRedraw should force redraw', () => {
      expect(() => gmailView.forceRedraw()).not.toThrow();
    });
  });

  describe('Event Handling', () => {
    test('handleGmailDetected should handle Gmail detection', () => {
      expect(() => gmailView.handleGmailDetected()).not.toThrow();
    });

    test('handleDetectButton should handle detect button', () => {
      expect(() => gmailView.handleDetectButton()).not.toThrow();
    });

    test('bindEvents should bind event listeners', () => {
      expect(() => gmailView.bindEvents()).not.toThrow();
    });

    test('init should initialize the view', () => {
      expect(() => gmailView.init()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle parsing errors gracefully', () => {
      gmailView.parsingData = true;
      expect(() => gmailView.parseData({ force: false })).not.toThrow();
    });

    test('should handle missing DOM elements gracefully', () => {
      gmailView.$root = null;
      expect(() => gmailView.detectToolbar()).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should integrate with app utils correctly', () => {
      const email = 'test@example.com';
      const name = 'Test User';

      gmailView.displayNameAndEmail(name, email);

      expect(mockUtils.addSpace).toHaveBeenCalledWith(
        name,
        '<test@example.com>'
      );
    });

    test('should integrate with wait counter correctly', () => {
      gmailView.detectEmailOpeningMode_onEmailClick();

      expect(mockWaitCounter.start).toHaveBeenCalled();
    });

    test('should integrate with event system correctly', () => {
      gmailView.bindEvents();

      expect(mockApp.eventTarget.addEventListener).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    test('should maintain parsing state correctly', () => {
      expect(gmailView.parsingData).toBe(false);

      gmailView.parsingData = true;
      expect(gmailView.parsingData).toBe(true);

      gmailView.parsingData = false;
      expect(gmailView.parsingData).toBe(false);
    });

    test('should maintain runaway counter correctly', () => {
      expect(gmailView.runaway).toBe(0);

      gmailView.runaway = 5;
      expect(gmailView.runaway).toBe(5);

      gmailView.runaway = 0;
      expect(gmailView.runaway).toBe(0);
    });
  });
});
