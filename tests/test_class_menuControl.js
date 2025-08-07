/**
 * Comprehensive Jest test suite for MenuControl class
 * Tests all methods and functionality of the MenuControl class
 */

// Import shared test utilities
const {
  _ts, // G2T_TestSuite instance
  debugOut,
  testApp, // Pre-created mock app with all dependencies
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
      expect(menuControl).toBeInstanceOf(window.G2T.MenuControl);
      expect(menuControl.app).toBe(testApp);
    });

    test('should handle constructor with no arguments', () => {
      const defaultMenuControl = new G2T.MenuControl({});
      expect(defaultMenuControl).toBeInstanceOf(window.G2T.MenuControl);
      expect(defaultMenuControl.app).toBeUndefined();
    });

    test('ck static getter should return correct value', () => {
      expect(window.G2T.MenuControl.ck).toEqual({ id: 'g2t_menuControl' });
    });

    test('ck getter should return correct value', () => {
      expect(menuControl.ck).toEqual({ id: 'g2t_menuControl' });
    });
  });

  describe('Menu Reset', () => {
    test('reset should initialize menu with selectors', () => {
      const selectors = '.menu-item';
      const mockItems = [
        { menuIndex: 0 },
        { menuIndex: 1 },
      ];

      // Mock jQuery to return our test items with click method
      const mockJQuery = jest.fn(() => ({
        ...mockItems,
        click: jest.fn(),
        length: mockItems.length
      }));
      global.jQuery = mockJQuery;
      global.$ = global.jQuery;

      // Set up selectors property that reset method expects
      menuControl.selectors = selectors;
      
      expect(() => menuControl.reset({ selectors })).not.toThrow();
      expect(global.jQuery).toHaveBeenCalledWith(selectors);
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
      const mockItems = [
        { menuIndex: 0 },
      ];

      // Mock jQuery to return our test items with click method
      const mockJQuery = jest.fn(() => ({
        ...mockItems,
        click: jest.fn(),
        length: mockItems.length
      }));
      global.jQuery = mockJQuery;
      global.$ = global.jQuery;

      menuControl.selectors = '.menu-item';
      menuControl.reset({ selectors: '.menu-item' });

      // Verify jQuery was called
      expect(global.jQuery).toHaveBeenCalledWith('.menu-item');
    });

    test('should handle multiple menu items', () => {
      const mockItems = [
        { menuIndex: 0 },
        { menuIndex: 1 },
        { menuIndex: 2 },
      ];

      // Mock jQuery to return our test items with click method
      const mockJQuery = jest.fn(() => ({
        ...mockItems,
        click: jest.fn(),
        length: mockItems.length
      }));
      global.jQuery = mockJQuery;
      global.$ = global.jQuery;

      menuControl.selectors = '.menu-item';
      expect(() => menuControl.reset({ selectors: '.menu-item' })).not.toThrow();
      expect(global.jQuery).toHaveBeenCalledWith('.menu-item');
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
    test('should handle jQuery errors gracefully', () => {
      // Mock jQuery to throw an error
      global.jQuery = jest.fn(() => {
        throw new Error('jQuery error');
      });
      global.$ = global.jQuery;

      menuControl.selectors = '.menu-item';
      expect(() => menuControl.reset({ selectors: '.menu-item' })).toThrow('jQuery error');
    });

    test('should handle invalid selectors gracefully', () => {
      expect(() => menuControl.reset({ selectors: 123 })).not.toThrow();
      expect(() => menuControl.reset({ selectors: {} })).not.toThrow();
      expect(() => menuControl.reset({ selectors: [] })).not.toThrow();
    });
  });
});
