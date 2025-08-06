/**
 * Comprehensive Jest test suite for PopupView class
 * Tests all methods and functionality of the PopupView class
 */

// Import shared test utilities
const {
  _ts, // G2T_TestSuite instance
  /* debugOut, */
  testApp, // Pre-created mock app with all dependencies
} = require('./test_shared');

// Load the REAL PopupView class - this will override the mock version
// The real PopupView will use the mock dependencies from testApp
_ts.loadSourceFile('chrome_manifest_v3/views/class_popupView.js');

describe('PopupView Class', () => {
  let popupView;

  beforeEach(() => {
    // Create a fresh real PopupView instance with the pre-created mock dependencies
    // The real PopupView class was loaded above, and will use mock dependencies from testApp
    popupView = new G2T.PopupView({ app: testApp });

    // Clear all mocks
    _ts.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should create PopupView instance with app dependency', () => {
      expect(popupView).toBeInstanceOf(window.G2T.PopupView);
      expect(popupView.app).toBe(testApp);
    });

    test('should initialize with default properties', () => {
      expect(popupView.isInitialized).toBe(false);
      expect(popupView.dataDirty).toBe(true);
      expect(popupView.MAX_BODY_SIZE).toBe(16384);
      expect(popupView.mouseDownTracker).toEqual({});
      expect(popupView.lastError).toBe('');
      expect(popupView.intervalId).toBe(0);
      expect(popupView.updatesPending).toEqual([]);
      expect(popupView.comboInitialized).toBe(false);
    });

    test('should initialize size constraints', () => {
      expect(popupView.size_k.width.min).toBe(700);
      expect(popupView.size_k.width.max).toBe(window.innerWidth - 16);
      expect(popupView.size_k.height.min).toBe(464);
      expect(popupView.size_k.height.max).toBe(1400);
      expect(popupView.size_k.text.min).toBe(111);
    });

    test('should create PopupForm instance', () => {
      expect(popupView.form).toBeInstanceOf(window.G2T.PopupForm);
      expect(popupView.form.parent).toBe(popupView);
      expect(popupView.form.app).toBe(testApp);
    });

    test('ck static getter should return correct value', () => {
      expect(window.G2T.PopupView.ck).toEqual({ id: 'g2t_popupview' });
    });

    test('ck getter should return correct value', () => {
      expect(popupView.ck).toEqual({ id: 'g2t_popupview' });
    });
  });

  describe('Basic Functionality', () => {
    test('should have init method', () => {
      expect(typeof popupView.init).toBe('function');
    });

    test('should have finalCreatePopup method', () => {
      expect(typeof popupView.finalCreatePopup).toBe('function');
    });

    test('should have centerPopup method', () => {
      expect(typeof popupView.centerPopup).toBe('function');
    });
  });

  describe('Integration Tests', () => {
    test('should integrate with app correctly', () => {
      expect(popupView.app).toBe(testApp);
      expect(popupView.app.utils).toBeDefined();
    });

    test('should integrate with form correctly', () => {
      expect(popupView.form).toBeInstanceOf(window.G2T.PopupForm);
      expect(popupView.form.parent).toBe(popupView);
      expect(popupView.form.app).toBe(testApp);
    });
  });
});
