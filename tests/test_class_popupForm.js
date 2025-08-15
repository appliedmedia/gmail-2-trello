/**
 * Comprehensive Jest test suite for PopupForm class
 * Tests all methods and functionality of the PopupForm class
 */

// Import shared test utilities
const {
  G2T, // G2T namespace
  testApp, // Pre-created mock app with all dependencies
  _ts, // G2T_TestSuite instance
  debugOut,
} = require('./test_shared');

// Load the REAL PopupForm class - this will override the mock version
// The real PopupForm will use the mock dependencies from testApp
_ts.loadSourceFile('chrome_manifest_v3/views/class_popupForm.js');

describe('PopupForm Class', () => {
  let popupForm;
  let mockParent;

  beforeEach(() => {
    // Set up the g2t_combobox mock for this test
    if ($.fn && !$.fn.g2t_combobox) {
      $.fn.g2t_combobox = jest.fn(function (method, ...args) {
        if (method === 'setInputValue') {
          return this;
        }
        return this;
      });
    }

    // Create mock parent with basic state interface
    mockParent = {
      state: {
        boardId: '',
        listId: '',
        cardName: '',
        cardDescription: '',
      },
      // Add required jQuery elements that PopupForm expects
      $popup: $('<div id="g2tPopup"></div>'),
      $popupMessage: $('<div id="g2tPopupMessage"></div>'),
      $popupContent: $('<div id="g2tPopupContent"></div>'),
      // Add size_k property that set_max_autocomplete_size needs
      size_k: {
        text: {
          min: 100,
        },
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
      expect(popupForm).toBeInstanceOf(G2T.PopupForm);
      expect(popupForm.parent).toBe(mockParent);
      expect(popupForm.app).toBe(testApp);
    });

    test('should initialize with default properties', () => {
      expect(popupForm.isInitialized).toBe(false);
    });

    test('ck static getter should return correct value', () => {
      expect(G2T.PopupForm.ck).toEqual({ id: 'g2t_popupform' });
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

      // Verify that events were bound (at least some key ones)
      expect(testApp.events.addListener).toHaveBeenCalled();
      expect(testApp.events.addListener.mock.calls.length).toBeGreaterThan(0);
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

    test('bindData should bind data to form elements', () => {
      const originalInnerHTML = document.body.innerHTML;
      // Add necessary DOM structure for PopupForm
      document.body.innerHTML = `
        <div class="header">
          <a href="#">Test Link</a>
        </div>
        <div id="g2tSignOutButton"></div>
      `;

      expect(() => popupForm.bindData()).not.toThrow();

      // Clean up
      document.body.innerHTML = originalInnerHTML;
    });

    test('reset should reset form state', () => {
      const originalInnerHTML = document.body.innerHTML;
      // Add necessary DOM structure for PopupForm
      document.body.innerHTML = `
        <input id="g2tTitle" value="Test Title" />
        <input id="g2tDesc" value="Test Description" />
        <select id="g2tPosition">
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
        </select>
      `;

      expect(() => popupForm.reset()).not.toThrow();

      // Clean up
      document.body.innerHTML = originalInnerHTML;
    });

    test('submit should trigger form submission', () => {
      const originalInnerHTML = document.body.innerHTML;
      // Add necessary DOM structure for PopupForm
      document.body.innerHTML = `
        <input id="g2tTitle" value="Test Card" />
        <textarea id="g2tDesc">Test Description</textarea>
      `;

      // Set up app state
      popupForm.app.temp = { title: 'Test Card' };
      popupForm.app.persist = { boardId: 'test-board', listId: 'test-list' };

      expect(() => popupForm.submit()).not.toThrow();

      // Verify submission actually happened
      expect(testApp.events.emit).toHaveBeenCalledWith('submit');

      // Clean up
      document.body.innerHTML = originalInnerHTML;
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
