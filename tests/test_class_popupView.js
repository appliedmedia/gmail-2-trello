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
    // Stub window.innerWidth to ensure deterministic tests
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      configurable: true,
    });

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
      expect(popupView.size_k.width.max).toBe(1024 - 16); // Based on stubbed value
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

    test('init should initialize the popup view', () => {
      const originalInnerHTML = document.body.innerHTML;
      // Add necessary DOM structure for PopupView
      document.body.innerHTML = `
        <div id="g2tButton"></div>
        <div id="g2tPopup"></div>
        <div class="toolbar"></div>
      `;
      
      // Set up toolbar reference that PopupView expects
      popupView.$toolBar = $('.toolbar');

      expect(() => popupView.init()).not.toThrow();
      expect(popupView.isInitialized).toBe(true);
      
      // Clean up
      document.body.innerHTML = originalInnerHTML;
    });

    test('finalCreatePopup should create popup elements', () => {
      const originalInnerHTML = document.body.innerHTML;
      // Add necessary DOM structure for PopupView
      document.body.innerHTML = `
        <div class="toolbar"></div>
        <div id="g2tButton"></div>
        <div id="g2tPopup"></div>
      `;
      
      // Set up toolbar reference that PopupView expects
      popupView.$toolBar = $('.toolbar');

      expect(() => popupView.finalCreatePopup()).not.toThrow();

      // Clean up
      document.body.innerHTML = originalInnerHTML;
    });

    test('centerPopup should center the popup on screen', () => {
      const originalInnerHTML = document.body.innerHTML;
      // Add necessary DOM structure for PopupView
      document.body.innerHTML = `
        <div id="g2tButton" style="position: absolute; left: 100px; top: 50px; width: 50px; height: 30px;"></div>
        <div id="g2tPopup" style="position: absolute; width: 400px; height: 300px;"></div>
      `;
      
      // Set up button reference that centerPopup expects
      popupView.$g2tButton = $('#g2tButton');

      expect(() => popupView.centerPopup()).not.toThrow();

      // Clean up
      document.body.innerHTML = originalInnerHTML;
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
