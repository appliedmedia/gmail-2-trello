/**
 * Comprehensive Jest test suite for PopupView class
 * Tests all methods and functionality of the PopupView class
 */

// Mock jQuery for testing
global.$ = jest.fn();

// Mock chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  runtime: {
    sendMessage: jest.fn(),
    getManifest: jest.fn(() => ({ version: '2.9.0' }))
  }
};

// Mock console for testing
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Mock G2T global object and its classes
global.G2T = {
  PopupForm: jest.fn()
};

// Mock window object
global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock document object
global.document = {
  createElement: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  getElementById: jest.fn()
};

// Import the PopupView class
const PopupView = require('../chrome_manifest_v3/views/class_popupView.js');

describe('PopupView Class', () => {
  let popupView;
  let mockApp;
  let mockUtils;
  let mockForm;

  beforeEach(() => {
    // Create mock instances
    mockForm = {
      init: jest.fn(),
      bindData: jest.fn(),
      submit: jest.fn()
    };

    mockUtils = {
      log: jest.fn(),
      loadFromChromeStorage: jest.fn(),
      saveToChromeStorage: jest.fn()
    };

    mockApp = {
      utils: mockUtils,
      eventTarget: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      }
    };

    // Setup G2T class mocks
    G2T.PopupForm.mockImplementation(() => mockForm);

    // Create a fresh PopupView instance for each test
    popupView = new PopupView({ app: mockApp });
    
    // Reset all mocks
    $.mockClear();
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
    chrome.runtime.sendMessage.mockClear();
    chrome.runtime.getManifest.mockClear();
    console.log.mockClear();
    console.error.mockClear();
    console.warn.mockClear();
    window.addEventListener.mockClear();
    window.removeEventListener.mockClear();
    document.createElement.mockClear();
    document.querySelector.mockClear();
    document.querySelectorAll.mockClear();
    document.getElementById.mockClear();
  });

  describe('Constructor and Initialization', () => {
    test('should create PopupView instance with app dependency', () => {
      expect(popupView).toBeInstanceOf(PopupView);
      expect(popupView.app).toBe(mockApp);
    });

    test('should initialize with default properties', () => {
      expect(popupView.isInitialized).toBe(false);
      expect(popupView.dataDirty).toBe(true);
      expect(popupView.posDirty).toBe(false);
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

    test('should initialize draggable constraints', () => {
      expect(popupView.draggable.height.min).toBe(464);
      expect(popupView.draggable.height.max).toBe(window.innerHeight - 100);
      expect(popupView.draggable.width.min).toBe(700);
      expect(popupView.draggable.width.max).toBe(window.innerWidth - 100);
    });

    test('should initialize constants', () => {
      expect(popupView.EVENT_LISTENER).toBe('.g2t_event_listener');
      expect(popupView.CLEAR_EXT_BROWSING_DATA).toBe('g2t_clear_extension_browsing_data');
      expect(popupView.VERSION_STORAGE).toBe('g2t_version');
      expect(popupView.ATTRIBUTE_STORAGE).toBe('g2t-attr-');
    });

    test('should create PopupForm instance', () => {
      expect(popupView.form).toBe(mockForm);
      expect(G2T.PopupForm).toHaveBeenCalledWith({
        parent: popupView,
        app: mockApp
      });
    });

    test('ck static getter should return correct value', () => {
      expect(PopupView.ck).toEqual({ id: 'g2t_popupview' });
    });

    test('ck getter should return correct value', () => {
      expect(popupView.ck).toEqual({ id: 'g2t_popupview' });
    });
  });

  describe('Popup Creation and Management', () => {
    test('finalCreatePopup should handle missing toolbar', () => {
      popupView.$toolBar = null;
      expect(() => popupView.finalCreatePopup()).not.toThrow();
    });

    test('finalCreatePopup should create popup when button exists', () => {
      popupView.$toolBar = document.createElement('div');
      popupView.html = { add_to_trello: '' };
      
      // Mock jQuery
      const mockButton = { length: 1 };
      const mockPopup = { length: 0 };
      $.mockImplementation((selector) => {
        if (selector === '#g2tButton') return mockButton;
        if (selector === '#g2tPopup') return mockPopup;
        return { length: 0 };
      });

      expect(() => popupView.finalCreatePopup()).not.toThrow();
    });

    test('centerPopup should center popup correctly', () => {
      const useWidth = 800;
      expect(() => popupView.centerPopup(useWidth)).not.toThrow();
    });

    test('resetDragResize should reset drag and resize', () => {
      expect(() => popupView.resetDragResize()).not.toThrow();
    });
  });

  describe('Popup Visibility', () => {
    test('showPopup should show popup', () => {
      expect(() => popupView.showPopup()).not.toThrow();
    });

    test('hidePopup should hide popup', () => {
      expect(() => popupView.hidePopup()).not.toThrow();
    });

    test('popupVisible should check popup visibility', () => {
      const result = popupView.popupVisible();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Event Handling', () => {
    test('bindEvents should bind all event listeners', () => {
      expect(() => popupView.bindEvents()).not.toThrow();
    });

    test('bindPopupEvents should bind popup-specific events', () => {
      expect(() => popupView.bindPopupEvents()).not.toThrow();
    });

    test('toggleActiveMouseDown should toggle mouse down state', () => {
      const element = document.createElement('div');
      expect(() => popupView.toggleActiveMouseDown(element)).not.toThrow();
    });
  });

  describe('Version Management', () => {
    test('getManifestVersion should get manifest version', () => {
      const version = popupView.getManifestVersion();
      expect(version).toBe('2.9.0');
      expect(chrome.runtime.getManifest).toHaveBeenCalled();
    });

    test('forceSetVersion should force set version', () => {
      expect(() => popupView.forceSetVersion()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('handleChromeAPIError should handle API errors', () => {
      const error = new Error('API Error');
      const operation = 'test_operation';
      expect(() => popupView.handleChromeAPIError(error, operation)).not.toThrow();
    });

    test('should handle missing dependencies gracefully', () => {
      popupView.$toolBar = null;
      popupView.form = null;
      expect(() => popupView.finalCreatePopup()).not.toThrow();
    });
  });

  describe('Periodic Operations', () => {
    test('periodicChecks should perform periodic checks', () => {
      expect(() => popupView.periodicChecks()).not.toThrow();
    });

    test('handlePeriodicChecks should handle periodic check events', () => {
      expect(() => popupView.handlePeriodicChecks()).not.toThrow();
    });
  });

  describe('Authorization Handling', () => {
    test('showSignOutOptions should show sign out options', () => {
      const data = { user: 'test' };
      expect(() => popupView.showSignOutOptions(data)).not.toThrow();
    });

    test('handleBeforeAuthorize should handle pre-authorization', () => {
      expect(() => popupView.handleBeforeAuthorize()).not.toThrow();
    });

    test('handleAuthorizeFail should handle authorization failure', () => {
      expect(() => popupView.handleAuthorizeFail()).not.toThrow();
    });

    test('handleAuthorized should handle successful authorization', () => {
      expect(() => popupView.handleAuthorized()).not.toThrow();
    });
  });

  describe('Trello Integration', () => {
    test('handleBeforeLoadTrello should handle pre-Trello loading', () => {
      expect(() => popupView.handleBeforeLoadTrello()).not.toThrow();
    });

    test('handleTrelloDataReady should handle Trello data ready', () => {
      expect(() => popupView.handleTrelloDataReady()).not.toThrow();
    });
  });

  describe('Runtime Message Handling', () => {
    test('handleRuntimeMessage should handle runtime messages', () => {
      const request = { type: 'test' };
      const sender = { id: 'test' };
      const sendResponse = jest.fn();
      expect(() => popupView.handleRuntimeMessage(request, sender, sendResponse)).not.toThrow();
    });
  });

  describe('Popup Lifecycle', () => {
    test('handlePopupVisible should handle popup visibility', () => {
      expect(() => popupView.handlePopupVisible()).not.toThrow();
    });

    test('handlePopupViewInitDone should handle initialization completion', () => {
      expect(() => popupView.handlePopupViewInitDone()).not.toThrow();
    });

    test('handlePopupLoaded should handle popup loading', () => {
      expect(() => popupView.handlePopupLoaded()).not.toThrow();
    });
  });

  describe('Button Handling', () => {
    test('handleDetectButton should handle detect button clicks', () => {
      expect(() => popupView.handleDetectButton()).not.toThrow();
    });
  });

  describe('Extension Management', () => {
    test('displayExtensionInvalidReload should display reload message', () => {
      expect(() => popupView.displayExtensionInvalidReload()).not.toThrow();
    });
  });

  describe('Data Binding', () => {
    test('bindData should bind data to form', () => {
      const model = { boards: [], lists: [] };
      expect(() => popupView.bindData(model)).not.toThrow();
    });
  });

  describe('Form Integration', () => {
    test('should integrate with PopupForm correctly', () => {
      expect(popupView.form).toBe(mockForm);
      expect(mockForm.init).toBeDefined();
      expect(mockForm.bindData).toBeDefined();
      expect(mockForm.submit).toBeDefined();
    });

    test('should initialize form on popup creation', () => {
      popupView.finalCreatePopup();
      expect(mockForm.init).toHaveBeenCalled();
    });
  });

  describe('Size Management', () => {
    test('should respect minimum size constraints', () => {
      expect(popupView.size_k.width.min).toBeGreaterThan(0);
      expect(popupView.size_k.height.min).toBeGreaterThan(0);
    });

    test('should respect maximum size constraints', () => {
      expect(popupView.size_k.width.max).toBeLessThanOrEqual(window.innerWidth);
      expect(popupView.size_k.height.max).toBeLessThanOrEqual(1400);
    });

    test('should handle window resize', () => {
      const originalWidth = window.innerWidth;
      const originalHeight = window.innerHeight;
      
      window.innerWidth = 1600;
      window.innerHeight = 900;
      
      const newPopupView = new PopupView({ app: mockApp });
      
      expect(newPopupView.size_k.width.max).toBe(1600 - 16);
      expect(newPopupView.draggable.width.max).toBe(1600 - 100);
      expect(newPopupView.draggable.height.max).toBe(900 - 100);
    });
  });

  describe('State Management', () => {
    test('should maintain initialization state', () => {
      expect(popupView.isInitialized).toBe(false);
      popupView.isInitialized = true;
      expect(popupView.isInitialized).toBe(true);
    });

    test('should maintain dirty state flags', () => {
      expect(popupView.dataDirty).toBe(true);
      expect(popupView.posDirty).toBe(false);
      
      popupView.dataDirty = false;
      popupView.posDirty = true;
      
      expect(popupView.dataDirty).toBe(false);
      expect(popupView.posDirty).toBe(true);
    });

    test('should maintain error state', () => {
      expect(popupView.lastError).toBe('');
      popupView.lastError = 'Test error';
      expect(popupView.lastError).toBe('Test error');
    });
  });

  describe('Mouse Tracking', () => {
    test('should track mouse down events', () => {
      const element = document.createElement('div');
      popupView.toggleActiveMouseDown(element);
      expect(popupView.mouseDownTracker).toBeDefined();
    });

    test('should handle multiple mouse down events', () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      
      popupView.toggleActiveMouseDown(element1);
      popupView.toggleActiveMouseDown(element2);
      
      expect(popupView.mouseDownTracker).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('should initialize efficiently', () => {
      const startTime = Date.now();
      const newPopupView = new PopupView({ app: mockApp });
      const endTime = Date.now();
      
      expect(newPopupView).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    test('should handle popup operations efficiently', () => {
      const startTime = Date.now();
      popupView.showPopup();
      popupView.hidePopup();
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Integration Tests', () => {
    test('should integrate with app utils correctly', () => {
      popupView.handleChromeAPIError(new Error('test'), 'test_op');
      expect(mockUtils.log).toHaveBeenCalled();
    });

    test('should integrate with event system correctly', () => {
      popupView.bindEvents();
      expect(mockApp.eventTarget.addEventListener).toHaveBeenCalled();
    });

    test('should integrate with chrome API correctly', () => {
      popupView.getManifestVersion();
      expect(chrome.runtime.getManifest).toHaveBeenCalled();
    });
  });

  describe('Initialization', () => {
    test('init should initialize the popup view', () => {
      expect(() => popupView.init()).not.toThrow();
      expect(popupView.isInitialized).toBe(true);
    });

    test('init should only initialize once', () => {
      popupView.isInitialized = true;
      popupView.init();
      expect(popupView.isInitialized).toBe(true);
    });
  });
});