/**
 * Comprehensive Jest test suite for MenuControl class
 * Tests all methods and functionality of the MenuControl class
 */

// Mock jQuery for testing
global.jQuery = jest.fn();

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

// Mock G2T global object
global.G2T = {};

// Import the MenuControl class
const MenuControl = require('../chrome_manifest_v3/class_menuControl.js');

describe('MenuControl Class', () => {
  let menuControl;
  let mockApp;
  let mockUtils;
  let mockEvents;

  beforeEach(() => {
    // Create mock instances
    mockEvents = {
      fire: jest.fn(),
    };

    mockUtils = {
      log: jest.fn(),
    };

    mockApp = {
      utils: mockUtils,
      events: mockEvents,
    };

    // Create a fresh MenuControl instance for each test
    menuControl = new MenuControl({ app: mockApp });

    // Reset all mocks
    jQuery.mockClear();
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
    chrome.runtime.sendMessage.mockClear();
    console.log.mockClear();
    console.error.mockClear();
    console.warn.mockClear();
  });

  describe('Constructor and Initialization', () => {
    test('should create MenuControl instance with app dependency', () => {
      expect(menuControl).toBeInstanceOf(MenuControl);
      expect(menuControl.app).toBe(mockApp);
    });

    test('should handle constructor with no arguments', () => {
      const defaultMenuControl = new MenuControl();
      expect(defaultMenuControl).toBeInstanceOf(MenuControl);
      expect(defaultMenuControl.app).toBeUndefined();
    });

    test('ck static getter should return correct value', () => {
      expect(MenuControl.ck).toEqual({ id: 'g2t_menuControl' });
    });

    test('ck getter should return correct value', () => {
      expect(menuControl.ck).toEqual({ id: 'g2t_menuControl' });
    });
  });

  describe('Menu Reset', () => {
    test('reset should initialize menu with selectors', () => {
      const selectors = '.menu-item';
      const mockItems = [
        { menuIndex: 0, click: jest.fn() },
        { menuIndex: 1, click: jest.fn() },
      ];

      jQuery.mockReturnValue(mockItems);

      menuControl.reset({ selectors });

      expect(jQuery).toHaveBeenCalledWith(selectors);
      expect(menuControl.items).toBe(mockItems);
      expect(menuControl.nonexclusive).toBe(false);
      expect(mockItems[0].menuIndex).toBe(0);
      expect(mockItems[1].menuIndex).toBe(1);
    });

    test('reset should handle nonexclusive mode', () => {
      const selectors = '.menu-item';
      const mockItems = [{ menuIndex: 0, click: jest.fn() }];

      jQuery.mockReturnValue(mockItems);

      menuControl.reset({ selectors, nonexclusive: true });

      expect(menuControl.nonexclusive).toBe(true);
    });

    test('reset should handle missing selectors', () => {
      menuControl.selectors = null;

      menuControl.reset({});

      expect(mockUtils.log).toHaveBeenCalledWith(
        'MenuControl: missing required selectors'
      );
      expect(jQuery).not.toHaveBeenCalled();
    });

    test('reset should handle empty selectors object', () => {
      menuControl.selectors = {};

      menuControl.reset({});

      expect(mockUtils.log).toHaveBeenCalledWith(
        'MenuControl: missing required selectors'
      );
      expect(jQuery).not.toHaveBeenCalled();
    });

    test('reset should handle undefined selectors', () => {
      menuControl.reset({});

      expect(mockUtils.log).toHaveBeenCalledWith(
        'MenuControl: missing required selectors'
      );
      expect(jQuery).not.toHaveBeenCalled();
    });
  });

  describe('Event Binding', () => {
    test('bindEvents should bind click events to menu items', () => {
      const mockItems = [
        { menuIndex: 0, click: jest.fn() },
        { menuIndex: 1, click: jest.fn() },
      ];

      menuControl.items = mockItems;
      menuControl.nonexclusive = false;

      menuControl.bindEvents();

      expect(mockItems[0].click).toHaveBeenCalled();
      expect(mockItems[1].click).toHaveBeenCalled();
    });

    test('bindEvents should handle exclusive mode click', () => {
      const mockItem = { menuIndex: 0, click: jest.fn() };
      const mockSiblings = { removeClass: jest.fn() };

      menuControl.items = [mockItem];
      menuControl.nonexclusive = false;

      // Mock jQuery for the click handler
      $.mockReturnValue({
        addClass: jest.fn().mockReturnValue({
          siblings: jest.fn().mockReturnValue(mockSiblings),
        }),
      });

      menuControl.bindEvents();

      // Simulate click event
      const clickHandler = mockItem.click.mock.calls[0][0];
      const mockEvent = {
        currentTarget: mockItem,
      };

      clickHandler(mockEvent);

      expect($).toHaveBeenCalledWith(mockItem);
      expect(mockSiblings.removeClass).toHaveBeenCalledWith('active');
      expect(mockEvents.fire).toHaveBeenCalledWith('menuClick', {
        target: mockItem,
        index: 0,
      });
    });

    test('bindEvents should handle nonexclusive mode click', () => {
      const mockItem = { menuIndex: 0, click: jest.fn() };

      menuControl.items = [mockItem];
      menuControl.nonexclusive = true;

      // Mock jQuery for the click handler
      $.mockReturnValue({
        toggleClass: jest.fn(),
      });

      menuControl.bindEvents();

      // Simulate click event
      const clickHandler = mockItem.click.mock.calls[0][0];
      const mockEvent = {
        currentTarget: mockItem,
      };

      clickHandler(mockEvent);

      expect($).toHaveBeenCalledWith(mockItem);
      expect(mockEvents.fire).toHaveBeenCalledWith('menuClick', {
        target: mockItem,
        index: 0,
      });
    });
  });

  describe('Click Event Handling', () => {
    test('should handle click with exclusive mode', () => {
      const mockItem = { menuIndex: 1 };
      const mockSiblings = { removeClass: jest.fn() };

      menuControl.items = [mockItem];
      menuControl.nonexclusive = false;

      $.mockReturnValue({
        addClass: jest.fn().mockReturnValue({
          siblings: jest.fn().mockReturnValue(mockSiblings),
        }),
      });

      menuControl.bindEvents();

      const clickHandler = mockItem.click.mock.calls[0][0];
      const mockEvent = {
        currentTarget: mockItem,
      };

      clickHandler(mockEvent);

      expect($).toHaveBeenCalledWith(mockItem);
      expect(mockSiblings.removeClass).toHaveBeenCalledWith('active');
      expect(mockEvents.fire).toHaveBeenCalledWith('menuClick', {
        target: mockItem,
        index: 1,
      });
    });

    test('should handle click with nonexclusive mode', () => {
      const mockItem = { menuIndex: 2 };

      menuControl.items = [mockItem];
      menuControl.nonexclusive = true;

      $.mockReturnValue({
        toggleClass: jest.fn(),
      });

      menuControl.bindEvents();

      const clickHandler = mockItem.click.mock.calls[0][0];
      const mockEvent = {
        currentTarget: mockItem,
      };

      clickHandler(mockEvent);

      expect($).toHaveBeenCalledWith(mockItem);
      expect(mockEvents.fire).toHaveBeenCalledWith('menuClick', {
        target: mockItem,
        index: 2,
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing app gracefully', () => {
      menuControl.app = null;

      expect(() =>
        menuControl.reset({ selectors: '.menu-item' })
      ).not.toThrow();
    });

    test('should handle missing utils gracefully', () => {
      menuControl.app.utils = null;

      expect(() =>
        menuControl.reset({ selectors: '.menu-item' })
      ).not.toThrow();
    });

    test('should handle missing events gracefully', () => {
      menuControl.app.events = null;

      const mockItem = { menuIndex: 0, click: jest.fn() };
      menuControl.items = [mockItem];

      expect(() => menuControl.bindEvents()).not.toThrow();
    });

    test('should handle missing items gracefully', () => {
      menuControl.items = null;

      expect(() => menuControl.bindEvents()).not.toThrow();
    });

    test('should handle empty items array gracefully', () => {
      menuControl.items = [];

      expect(() => menuControl.bindEvents()).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should integrate with app correctly', () => {
      expect(menuControl.app).toBe(mockApp);
      expect(menuControl.app.utils).toBe(mockUtils);
      expect(menuControl.app.events).toBe(mockEvents);
    });

    test('should integrate with jQuery correctly', () => {
      const selectors = '.menu-item';
      const mockItems = [{ menuIndex: 0, click: jest.fn() }];

      jQuery.mockReturnValue(mockItems);

      menuControl.reset({ selectors });

      expect(jQuery).toHaveBeenCalledWith(selectors);
    });

    test('should integrate with event system correctly', () => {
      const mockItem = { menuIndex: 0, click: jest.fn() };

      menuControl.items = [mockItem];
      menuControl.nonexclusive = false;

      $.mockReturnValue({
        addClass: jest.fn().mockReturnValue({
          siblings: jest.fn().mockReturnValue({ removeClass: jest.fn() }),
        }),
      });

      menuControl.bindEvents();

      const clickHandler = mockItem.click.mock.calls[0][0];
      const mockEvent = { currentTarget: mockItem };

      clickHandler(mockEvent);

      expect(mockEvents.fire).toHaveBeenCalledWith('menuClick', {
        target: mockItem,
        index: 0,
      });
    });
  });

  describe('Performance Tests', () => {
    test('should handle many menu items efficiently', () => {
      const selectors = '.menu-item';
      const mockItems = Array.from({ length: 100 }, (_, i) => ({
        menuIndex: i,
        click: jest.fn(),
      }));

      jQuery.mockReturnValue(mockItems);

      const startTime = Date.now();
      menuControl.reset({ selectors });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
      expect(mockItems[0].menuIndex).toBe(0);
      expect(mockItems[99].menuIndex).toBe(99);
    });

    test('should handle event binding efficiently', () => {
      const mockItems = Array.from({ length: 50 }, () => ({
        menuIndex: 0,
        click: jest.fn(),
      }));

      menuControl.items = mockItems;
      menuControl.nonexclusive = false;

      $.mockReturnValue({
        addClass: jest.fn().mockReturnValue({
          siblings: jest.fn().mockReturnValue({ removeClass: jest.fn() }),
        }),
      });

      const startTime = Date.now();
      menuControl.bindEvents();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null selectors', () => {
      menuControl.reset({ selectors: null });

      expect(mockUtils.log).toHaveBeenCalledWith(
        'MenuControl: missing required selectors'
      );
    });

    test('should handle undefined selectors', () => {
      menuControl.reset({ selectors: undefined });

      expect(mockUtils.log).toHaveBeenCalledWith(
        'MenuControl: missing required selectors'
      );
    });

    test('should handle empty string selectors', () => {
      menuControl.reset({ selectors: '' });

      expect(mockUtils.log).toHaveBeenCalledWith(
        'MenuControl: missing required selectors'
      );
    });

    test('should handle items with missing menuIndex', () => {
      const mockItems = [{ click: jest.fn() }];

      menuControl.items = mockItems;
      menuControl.nonexclusive = false;

      $.mockReturnValue({
        addClass: jest.fn().mockReturnValue({
          siblings: jest.fn().mockReturnValue({ removeClass: jest.fn() }),
        }),
      });

      expect(() => menuControl.bindEvents()).not.toThrow();
    });

    test('should handle click event with missing currentTarget', () => {
      const mockItem = { menuIndex: 0, click: jest.fn() };

      menuControl.items = [mockItem];
      menuControl.nonexclusive = false;

      $.mockReturnValue({
        addClass: jest.fn().mockReturnValue({
          siblings: jest.fn().mockReturnValue({ removeClass: jest.fn() }),
        }),
      });

      menuControl.bindEvents();

      const clickHandler = mockItem.click.mock.calls[0][0];
      const mockEvent = {};

      expect(() => clickHandler(mockEvent)).not.toThrow();
    });
  });

  describe('State Management', () => {
    test('should maintain items state', () => {
      const mockItems = [{ menuIndex: 0, click: jest.fn() }];
      menuControl.items = mockItems;

      expect(menuControl.items).toBe(mockItems);
    });

    test('should maintain nonexclusive state', () => {
      menuControl.nonexclusive = true;
      expect(menuControl.nonexclusive).toBe(true);

      menuControl.nonexclusive = false;
      expect(menuControl.nonexclusive).toBe(false);
    });

    test('should maintain selectors state', () => {
      const selectors = '.test-selector';
      menuControl.selectors = selectors;

      expect(menuControl.selectors).toBe(selectors);
    });
  });

  describe('Namespace Integration', () => {
    test('should be assigned to G2T namespace', () => {
      expect(G2T.MenuControl).toBe(MenuControl);
    });
  });
});
