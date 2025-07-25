/**
 * Comprehensive Jest test suite for Chrome class
 * Tests all methods and functionality of the Chrome class
 */

// Mock jQuery for testing
global.$ = jest.fn();

// Mock chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn()
    },
    onChanged: {
      addListener: jest.fn()
    }
  },
  runtime: {
    sendMessage: jest.fn(),
    getURL: jest.fn()
  }
};

// Mock console for testing
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Mock window object
global.window = {
  location: {
    reload: jest.fn()
  },
  console: {
    log: jest.fn()
  }
};

// Mock document object
global.document = {
  createElement: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  body: {
    appendChild: jest.fn()
  }
};

// Mock confirm function
global.confirm = jest.fn();

// Import the Chrome class
const Chrome = require('../chrome_manifest_v3/class_chrome.js');

describe('Chrome Class', () => {
  let chromeInstance;
  let mockApp;
  let mockUtils;
  let mockPopupView;

  beforeEach(() => {
    // Create mock instances
    mockPopupView = {
      displayExtensionInvalidReload: jest.fn()
    };

    mockUtils = {
      refreshDebugMode: jest.fn(),
      log: jest.fn()
    };

    mockApp = {
      utils: mockUtils,
      popupView: mockPopupView
    };

    // Create a fresh Chrome instance for each test
    chromeInstance = new Chrome({ app: mockApp });
    
    // Reset all mocks
    $.mockClear();
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
    chrome.storage.sync.get.mockClear();
    chrome.storage.sync.set.mockClear();
    chrome.storage.onChanged.addListener.mockClear();
    chrome.runtime.sendMessage.mockClear();
    chrome.runtime.getURL.mockClear();
    console.log.mockClear();
    console.error.mockClear();
    console.warn.mockClear();
    window.console.log.mockClear();
    window.location.reload.mockClear();
    document.createElement.mockClear();
    document.querySelector.mockClear();
    document.querySelectorAll.mockClear();
    document.body.appendChild.mockClear();
    confirm.mockClear();
  });

  describe('Constructor and Initialization', () => {
    test('should create Chrome instance with app dependency', () => {
      expect(chromeInstance).toBeInstanceOf(Chrome);
      expect(chromeInstance.app).toBe(mockApp);
    });

    test('should handle constructor with no arguments', () => {
      const defaultChrome = new Chrome();
      expect(defaultChrome).toBeInstanceOf(Chrome);
      expect(defaultChrome.app).toBeUndefined();
    });

    test('should bind events on construction', () => {
      expect(chrome.storage.onChanged.addListener).toHaveBeenCalled();
    });

    test('ck static getter should return correct value', () => {
      expect(Chrome.ck).toEqual({
        id: 'g2t_chrome',
        errorPrefix: 'Chrome API Error:',
        contextInvalidError: 'Extension context invalidated',
        reloadMessage: 'Extension needs to be reloaded.'
      });
    });

    test('ck getter should return correct value', () => {
      expect(chromeInstance.ck).toEqual({
        id: 'g2t_chrome',
        errorPrefix: 'Chrome API Error:',
        contextInvalidError: 'Extension context invalidated',
        reloadMessage: 'Extension needs to be reloaded.'
      });
    });
  });

  describe('Event Binding', () => {
    test('bindEvents should bind storage change listener', () => {
      expect(chrome.storage.onChanged.addListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    test('storage change listener should handle debug mode changes', () => {
      const listener = chrome.storage.onChanged.addListener.mock.calls[0][0];
      
      const changes = { debugMode: { newValue: true } };
      const namespace = 'sync';
      
      listener(changes, namespace);
      
      expect(mockUtils.refreshDebugMode).toHaveBeenCalled();
    });

    test('storage change listener should ignore non-sync namespace', () => {
      const listener = chrome.storage.onChanged.addListener.mock.calls[0][0];
      
      const changes = { debugMode: { newValue: true } };
      const namespace = 'local';
      
      listener(changes, namespace);
      
      expect(mockUtils.refreshDebugMode).not.toHaveBeenCalled();
    });

    test('storage change listener should ignore non-debugMode changes', () => {
      const listener = chrome.storage.onChanged.addListener.mock.calls[0][0];
      
      const changes = { otherSetting: { newValue: true } };
      const namespace = 'sync';
      
      listener(changes, namespace);
      
      expect(mockUtils.refreshDebugMode).not.toHaveBeenCalled();
    });
  });

  describe('API Call Wrapping', () => {
    test('wrapApiCall should execute successful API calls', () => {
      const apiCall = jest.fn((callback) => {
        callback('success');
        return 'result';
      });
      const callback = jest.fn();
      
      const result = chromeInstance.wrapApiCall(apiCall, 'test operation', callback);
      
      expect(apiCall).toHaveBeenCalledWith(callback);
      expect(callback).toHaveBeenCalledWith('success');
      expect(result).toBe('result');
    });

    test('wrapApiCall should handle API call errors', () => {
      const apiCall = jest.fn(() => {
        throw new Error('API Error');
      });
      
      expect(() => {
        chromeInstance.wrapApiCall(apiCall, 'test operation');
      }).toThrow('API Error');
      
      expect(window.console.log).toHaveBeenCalledWith(
        'Chrome API Error: test operation failed: API Error'
      );
    });

    test('wrapApiCall should handle API calls without callback', () => {
      const apiCall = jest.fn(() => 'result');
      
      const result = chromeInstance.wrapApiCall(apiCall, 'test operation');
      
      expect(apiCall).toHaveBeenCalledWith(undefined);
      expect(result).toBe('result');
    });
  });

  describe('Error Handling', () => {
    test('handleChromeError should handle context invalidation', () => {
      const error = new Error('Extension context invalidated');
      confirm.mockReturnValue(true);
      
      chromeInstance.handleChromeError(error, 'test operation');
      
      expect(window.console.log).toHaveBeenCalledWith(
        'Chrome API Error: Context invalidated during test operation. Extension needs to be reloaded.'
      );
      expect(confirm).toHaveBeenCalledWith(
        'Gmail-2-Trello extension needs to be reloaded to work correctly.\n\nReload now?'
      );
      expect(window.location.reload).toHaveBeenCalled();
    });

    test('handleChromeError should handle context invalidation with user decline', () => {
      const error = new Error('Extension context invalidated');
      confirm.mockReturnValue(false);
      
      chromeInstance.handleChromeError(error, 'test operation');
      
      expect(confirm).toHaveBeenCalled();
      expect(window.location.reload).not.toHaveBeenCalled();
    });

    test('handleChromeError should handle other errors', () => {
      const error = new Error('Other API Error');
      
      chromeInstance.handleChromeError(error, 'test operation');
      
      expect(window.console.log).toHaveBeenCalledWith(
        'Chrome API Error: test operation failed: Other API Error'
      );
      expect(confirm).not.toHaveBeenCalled();
      expect(window.location.reload).not.toHaveBeenCalled();
    });

    test('handleChromeError should handle errors without message', () => {
      const error = {};
      
      chromeInstance.handleChromeError(error, 'test operation');
      
      expect(window.console.log).toHaveBeenCalledWith(
        'Chrome API Error: test operation failed: Unknown error'
      );
    });
  });

  describe('Context Invalid Message Display', () => {
    test('showContextInvalidMessage should use popup view when available', () => {
      chromeInstance.showContextInvalidMessage();
      
      expect(mockPopupView.displayExtensionInvalidReload).toHaveBeenCalled();
    });

    test('showContextInvalidMessage should create notification when popup not available', () => {
      const mockNotification = {
        style: {},
        textContent: ''
      };
      document.createElement.mockReturnValue(mockNotification);
      
      chromeInstance.app.popupView = null;
      chromeInstance.showContextInvalidMessage();
      
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(mockNotification.style.cssText).toContain('position: fixed');
      expect(mockNotification.style.cssText).toContain('background: #ff6b6b');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockNotification);
    });

    test('showContextInvalidMessage should handle missing app', () => {
      const mockNotification = {
        style: {},
        textContent: ''
      };
      document.createElement.mockReturnValue(mockNotification);
      
      chromeInstance.app = null;
      chromeInstance.showContextInvalidMessage();
      
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockNotification);
    });
  });

  describe('Storage Operations', () => {
    test('storageSyncGet should call chrome.storage.sync.get', () => {
      const keys = ['key1', 'key2'];
      const callback = jest.fn();
      
      chromeInstance.storageSyncGet(keys, callback);
      
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(keys, callback);
    });

    test('storageSyncSet should call chrome.storage.sync.set', () => {
      const items = { key1: 'value1', key2: 'value2' };
      const callback = jest.fn();
      
      chromeInstance.storageSyncSet(items, callback);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(items, callback);
    });

    test('storageSyncGet should handle missing callback', () => {
      const keys = ['key1'];
      
      chromeInstance.storageSyncGet(keys);
      
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(keys, undefined);
    });

    test('storageSyncSet should handle missing callback', () => {
      const items = { key1: 'value1' };
      
      chromeInstance.storageSyncSet(items);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(items, undefined);
    });
  });

  describe('Runtime Operations', () => {
    test('runtimeSendMessage should call chrome.runtime.sendMessage', () => {
      const message = { type: 'test', data: 'test data' };
      const callback = jest.fn();
      
      chromeInstance.runtimeSendMessage(message, callback);
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(message, callback);
    });

    test('runtimeGetURL should call chrome.runtime.getURL', () => {
      const path = 'test/path.html';
      
      chromeInstance.runtimeGetURL(path);
      
      expect(chrome.runtime.getURL).toHaveBeenCalledWith(path);
    });

    test('runtimeSendMessage should handle missing callback', () => {
      const message = { type: 'test' };
      
      chromeInstance.runtimeSendMessage(message);
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(message, undefined);
    });
  });

  describe('Error Recovery', () => {
    test('should handle missing app gracefully', () => {
      chromeInstance.app = null;
      
      expect(() => chromeInstance.showContextInvalidMessage()).not.toThrow();
    });

    test('should handle missing popup view gracefully', () => {
      chromeInstance.app.popupView = null;
      
      expect(() => chromeInstance.showContextInvalidMessage()).not.toThrow();
    });

    test('should handle missing utils gracefully', () => {
      chromeInstance.app.utils = null;
      
      const listener = chrome.storage.onChanged.addListener.mock.calls[0][0];
      const changes = { debugMode: { newValue: true } };
      const namespace = 'sync';
      
      expect(() => listener(changes, namespace)).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should integrate with app utils correctly', () => {
      const listener = chrome.storage.onChanged.addListener.mock.calls[0][0];
      const changes = { debugMode: { newValue: true } };
      const namespace = 'sync';
      
      listener(changes, namespace);
      
      expect(mockUtils.refreshDebugMode).toHaveBeenCalled();
    });

    test('should integrate with popup view correctly', () => {
      chromeInstance.showContextInvalidMessage();
      
      expect(mockPopupView.displayExtensionInvalidReload).toHaveBeenCalled();
    });

    test('should integrate with chrome API correctly', () => {
      const keys = ['test'];
      const callback = jest.fn();
      
      chromeInstance.storageSyncGet(keys, callback);
      
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(keys, callback);
    });
  });

  describe('Performance Tests', () => {
    test('should handle API calls efficiently', () => {
      const apiCall = jest.fn(() => 'result');
      
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        chromeInstance.wrapApiCall(apiCall, 'test');
      }
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    test('should handle error processing efficiently', () => {
      const error = new Error('Test error');
      
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        chromeInstance.handleChromeError(error, 'test');
      }
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null error in handleChromeError', () => {
      expect(() => chromeInstance.handleChromeError(null, 'test')).not.toThrow();
      expect(window.console.log).toHaveBeenCalledWith(
        'Chrome API Error: test failed: Unknown error'
      );
    });

    test('should handle undefined error in handleChromeError', () => {
      expect(() => chromeInstance.handleChromeError(undefined, 'test')).not.toThrow();
      expect(window.console.log).toHaveBeenCalledWith(
        'Chrome API Error: test failed: Unknown error'
      );
    });

    test('should handle empty error message', () => {
      const error = { message: '' };
      
      chromeInstance.handleChromeError(error, 'test');
      
      expect(window.console.log).toHaveBeenCalledWith(
        'Chrome API Error: test failed: '
      );
    });

    test('should handle storage changes with null changes', () => {
      const listener = chrome.storage.onChanged.addListener.mock.calls[0][0];
      
      expect(() => listener(null, 'sync')).not.toThrow();
    });

    test('should handle storage changes with undefined namespace', () => {
      const listener = chrome.storage.onChanged.addListener.mock.calls[0][0];
      const changes = { debugMode: { newValue: true } };
      
      expect(() => listener(changes, undefined)).not.toThrow();
    });
  });
});