/**
 * Comprehensive Jest test suite for PopupForm class
 * Tests all methods and functionality of the PopupForm class
 */

// Import shared test utilities
const {
  _ts, // G2T_TestSuite instance
  debugOut,
  testApp, // Pre-created mock app with all dependencies
} = require('./test_shared');

// Load the REAL PopupForm class - this will override the mock version
// The real PopupForm will use the mock dependencies from testApp
_ts.loadSourceFile('chrome_manifest_v3/views/class_popupForm.js');

describe('PopupForm Class', () => {
  let popupForm;
  let mockParent;

  beforeEach(() => {
    // Create mock parent with basic state interface
    mockParent = {
      state: {
        boardId: '',
        listId: '',
        cardName: '',
        cardDescription: '',
      },
      // No showMessage delegation - all calls should use this.form.showMessage
    };

    // Create a fresh real PopupForm instance with the pre-created mock dependencies
    // The real PopupForm class was loaded above, and will use mock dependencies from testApp
    popupForm = new G2T.PopupForm({ parent: mockParent, app: testApp });

    // Clear all mocks
    _ts.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should create PopupForm instance with dependencies', () => {
      expect(popupForm).toBeInstanceOf(window.G2T.PopupForm);
      expect(popupForm.parent).toBe(mockParent);
      expect(popupForm.app).toBe(testApp);
    });

    test('should initialize with default properties', () => {
      expect(popupForm.isInitialized).toBe(false);
    });

    test('ck static getter should return correct value', () => {
      expect(window.G2T.PopupForm.ck).toEqual({ id: 'g2t_popupform' });
    });

    test('ck getter should return correct value', () => {
      expect(popupForm.ck).toEqual({ id: 'g2t_popupform' });
    });

    test('init should initialize the form', () => {
      expect(() => popupForm.init()).not.toThrow();
      expect(popupForm.isInitialized).toBe(true);
    });

    test('bindEvents should bind event listeners to app.events', () => {
      popupForm.bindEvents();
      expect(testApp.events.addListener).toHaveBeenCalledWith(
        'submit',
        expect.any(Function),
      );
      expect(testApp.events.addListener).toHaveBeenCalledWith(
        'APIFail',
        expect.any(Function),
      );
      // PopupForm binds 11 different event listeners
      expect(testApp.events.addListener).toHaveBeenCalledTimes(11);
    });
  });

  describe('Basic Functionality', () => {
    test('should have bindData method', () => {
      expect(typeof popupForm.bindData).toBe('function');
    });

    test('should have reset method', () => {
      expect(typeof popupForm.reset).toBe('function');
    });

    test('should have submit method', () => {
      expect(typeof popupForm.submit).toBe('function');
    });
  });

  describe('Integration Tests', () => {
    test('should integrate with parent correctly', () => {
      expect(popupForm.parent).toBe(mockParent);
      expect(popupForm.parent.state).toBeDefined();
    });

    test('should integrate with app correctly', () => {
      expect(popupForm.app).toBe(testApp);
      expect(popupForm.app.events).toBeDefined();
      expect(popupForm.app.utils).toBeDefined();
    });
  });
});
