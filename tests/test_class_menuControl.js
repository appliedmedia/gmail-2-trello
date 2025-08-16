/**
 * Comprehensive Jest test suite for MenuControl class
 * Tests all methods and functionality of the MenuControl class
 */

// Import shared test utilities
const {
  G2T, // G2T namespace
  testApp, // Pre-created mock app with all dependencies
  _ts, // G2T_TestSuite instance
  debugOut,
} = require('./test_shared');

// Load the REAL MenuControl class - this will override the mock version
// The real MenuControl will use the mock dependencies from testApp
_ts.loadSourceFile('chrome_manifest_v3/class_menuControl.js');

describe('MenuControl Class', () => {
  let menuControl;

  beforeEach(() => {
    // Create a fresh real MenuControl instance with the pre-created mock dependencies
    // The real MenuControl class was loaded above, and will use mock dependencies from testApp
    menuControl = new G2T.MenuControl({ app: testApp });

    // Clear all mocks
    _ts.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should create MenuControl instance with app dependency', () => {
      expect(menuControl).toBeInstanceOf(G2T.MenuControl);
      expect(menuControl.app).toBe(testApp);
    });

    test('should handle constructor with no arguments', () => {
      const defaultMenuControl = new G2T.MenuControl({});
      expect(defaultMenuControl).toBeInstanceOf(G2T.MenuControl);
      expect(defaultMenuControl.app).toBeUndefined();
    });

    test('ck static getter should return correct value', () => {
      expect(G2T.MenuControl.ck).toEqual({ id: 'g2t_menuControl' });
    });

    test('ck getter should return correct value', () => {
      expect(menuControl.ck).toEqual({ id: 'g2t_menuControl' });
    });
  });

  describe('Menu Reset', () => {
    test('reset should initialize menu with selectors', () => {
      // Add menu items to jsdom DOM
      document.body.innerHTML = `
        <div class="menu-item" data-menu-index="0">Item 1</div>
        <div class="menu-item" data-menu-index="1">Item 2</div>
      `;

      const selectors = '.menu-item';
      menuControl.selectors = { item: selectors };

      // Sanity check DOM via native API
      expect(document.querySelectorAll('.menu-item').length).toBe(2);
      expect(() => menuControl.reset({ selectors })).not.toThrow();
      expect(menuControl.items).toBeDefined();

      // Clean up
      document.body.innerHTML = '';
    });

    test('reset should handle empty selector', () => {
      menuControl.selectors = '';
      expect(() => menuControl.reset({ selectors: '' })).not.toThrow();
    });

    test('reset should handle null selector', () => {
      menuControl.selectors = null;
      expect(() => menuControl.reset({ selectors: null })).not.toThrow();
    });

    test('reset should handle undefined selector', () => {
      menuControl.selectors = undefined;
      expect(() => menuControl.reset({ selectors: undefined })).not.toThrow();
    });
  });

  describe('Menu Item Management', () => {
    test('should handle menu items with click handlers', () => {
      document.body.innerHTML = `
        <div class="menu-item" data-menu-index="0">Item 1</div>
      `;

      menuControl.selectors = { item: '.menu-item' };
      // Sanity check DOM via native API
      expect(document.querySelectorAll('.menu-item').length).toBe(1);
      menuControl.reset({ selectors: '.menu-item' });

      expect(menuControl.items).toBeDefined();
      expect(typeof menuControl.items.click).toBe('function');

      // Clean up
      document.body.innerHTML = '';
    });

    test('should handle multiple menu items', () => {
      document.body.innerHTML = `
        <div class="menu-item" data-menu-index="0">Item 1</div>
        <div class="menu-item" data-menu-index="1">Item 2</div>
        <div class="menu-item" data-menu-index="2">Item 3</div>
      `;

      menuControl.selectors = { item: '.menu-item' };
      // Sanity check DOM via native API
      expect(document.querySelectorAll('.menu-item').length).toBe(3);
      expect(() =>
        menuControl.reset({ selectors: '.menu-item' }),
      ).not.toThrow();
      expect(menuControl.items).toBeDefined();

      // Clean up
      document.body.innerHTML = '';
    });
  });

  describe('Integration Tests', () => {
    test('should integrate with app correctly', () => {
      expect(menuControl.app).toBe(testApp);
      expect(menuControl.app.events).toBeDefined();
      expect(menuControl.app.utils).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid selectors gracefully', () => {
      expect(() => menuControl.reset({ selectors: 123 })).not.toThrow();
      expect(() => menuControl.reset({ selectors: {} })).not.toThrow();
      expect(() => menuControl.reset({ selectors: [] })).not.toThrow();
    });
  });
});
