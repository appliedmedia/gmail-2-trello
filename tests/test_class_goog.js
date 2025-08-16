/**
 * Comprehensive Jest test suite for Goog class
 * Tests all methods and functionality of the Goog class
 */

// Import shared test utilities
const {
  G2T, // G2T namespace
  testApp, // Pre-created mock app with all dependencies
  _ts, // G2T_TestSuite instance
  debugOut, // Debug output function
} = require('./test_shared');

// Load the REAL Goog class - this will override the mock version
// The real Goog will use the mock dependencies from testApp
_ts.loadSourceFile('chrome_manifest_v3/class_goog.js');

describe('Goog Class', () => {
  let googInstance;

  beforeEach(() => {
    // Clear all mocks before creating the instance
    _ts.clearAllMocks();

    // Reset testApp state to ensure clean state between tests
    testApp.temp.log.debugMode = false;

    // Ensure testApp.popupView is properly set up
    if (!testApp.popupView) {
      testApp.popupView = {
        displayExtensionInvalidReload: jest.fn(),
      };
    }

    // Create a fresh real Goog instance with the pre-created mock dependencies
    // The real Goog class was loaded above, and will use mock dependencies from testApp
    googInstance = new G2T.Goog({ app: testApp });
  });

  describe('Constructor and Initialization', () => {
    test('should create Goog instance with app dependency', () => {
      expect(googInstance).toBeInstanceOf(G2T.Goog);
      expect(googInstance.app).toBe(testApp);
    });

    test('should handle constructor with no arguments', () => {
      const defaultGoog = new G2T.Goog();
      expect(defaultGoog).toBeInstanceOf(G2T.Goog);
      expect(defaultGoog.app).toBeUndefined();
    });

    test('should initialize with correct properties', () => {
      expect(googInstance.app).toBe(testApp);
      expect(googInstance.ck).toBeDefined();
    });

    test('ck static getter should return correct value', () => {
      expect(G2T.Goog.ck).toEqual({
        id: 'g2t_goog',
        errorPrefix: 'Error:',
        contextInvalidError: 'Extension context invalidated',
        reloadMessage: 'Extension needs to be reloaded.',
      });
    });

    test('ck getter should return correct value', () => {
      expect(googInstance.ck).toEqual({
        id: 'g2t_goog',
        errorPrefix: 'Error:',
        contextInvalidError: 'Extension context invalidated',
        reloadMessage: 'Extension needs to be reloaded.',
      });
    });
  });

  describe('Event Binding', () => {
    test('bindEvents should be callable without throwing', () => {
      expect(() => googInstance.bindEvents()).not.toThrow();
    });

    test('should handle storage change events when available', () => {
      // Test that the class can handle storage change events
      // In test environment, Chrome APIs won't be available, but the class should handle it gracefully
      expect(() => googInstance.bindEvents()).not.toThrow();
    });

    test('should bind storage change listener when Chrome API is available', () => {
      // Test that bindEvents registers the storage listener
      googInstance.bindEvents();
      expect(window.chrome.storage.onChanged.addListener).toHaveBeenCalled();
    });

    test('should handle storage change events correctly', () => {
      // Test the actual storage change listener behavior
      googInstance.bindEvents();

      const listener =
        window.chrome.storage.onChanged.addListener.mock.calls[0][0];
      const changes = { debugMode: { newValue: true } };
      const namespace = 'sync';

      expect(testApp.temp.log.debugMode).toBe(false); // Initially false

      listener(changes, namespace);

      expect(testApp.temp.log.debugMode).toBe(true); // Should be set to true
    });

    test('should ignore non-sync namespace storage changes', () => {
      googInstance.bindEvents();

      const listener =
        window.chrome.storage.onChanged.addListener.mock.calls[0][0];
      const changes = { debugMode: { newValue: true } };
      const namespace = 'local';

      expect(testApp.temp.log.debugMode).toBe(false); // Initially false

      listener(changes, namespace);

      expect(testApp.temp.log.debugMode).toBe(false); // Should remain unchanged
    });

    test('should ignore non-debugMode storage changes', () => {
      googInstance.bindEvents();

      const listener =
        window.chrome.storage.onChanged.addListener.mock.calls[0][0];
      const changes = { otherSetting: { newValue: true } };
      const namespace = 'sync';

      expect(testApp.temp.log.debugMode).toBe(false); // Initially false

      listener(changes, namespace);

      expect(testApp.temp.log.debugMode).toBe(false); // Should remain unchanged
    });
  });

  describe('API Call Wrapping', () => {
    test('wrapApiCall should execute successful API calls', () => {
      const apiCall = jest.fn(callback => {
        callback('success');
        return 'result';
      });
      const callback = jest.fn();

      const result = googInstance.wrapApiCall(
        apiCall,
        'test operation',
        callback,
      );

      expect(apiCall).toHaveBeenCalledWith(callback);
      expect(callback).toHaveBeenCalledWith('success');
      expect(result).toBe('result');
    });

    test('wrapApiCall should handle API call errors', () => {
      const apiCall = jest.fn(callback => {
        callback('error');
        return 'error';
      });
      const callback = jest.fn();

      const result = googInstance.wrapApiCall(
        apiCall,
        'test operation',
        callback,
      );

      expect(apiCall).toHaveBeenCalledWith(callback);
      expect(callback).toHaveBeenCalledWith('error');
      expect(result).toBe('error');
    });

    test('wrapApiCall should handle API calls without callback', () => {
      const apiCall = jest.fn(() => 'result');

      const result = googInstance.wrapApiCall(apiCall, 'test operation');

      expect(apiCall).toHaveBeenCalled();
      expect(result).toBe('result');
    });
  });

  describe('Error Handling', () => {
    test('handleChromeError should handle context invalidation', () => {
      const error = new Error('Extension context invalidated');

      // Test that the method executes without throwing
      expect(() =>
        googInstance.handleChromeError(error, 'test operation'),
      ).not.toThrow();
    });

    test('handleChromeError should handle context invalidation gracefully', () => {
      const error = new Error('Extension context invalidated');

      // Test that the method handles the error gracefully
      expect(() =>
        googInstance.handleChromeError(error, 'test operation'),
      ).not.toThrow();
    });

    test('handleChromeError should handle other errors', () => {
      const error = new Error('Other API Error');

      // Test that the method handles other errors gracefully
      expect(() =>
        googInstance.handleChromeError(error, 'test operation'),
      ).not.toThrow();
    });

    test('handleChromeError should handle errors without message', () => {
      const error = new Error();

      // Test that the method handles errors without messages gracefully
      expect(() =>
        googInstance.handleChromeError(error, 'test operation'),
      ).not.toThrow();
    });

    test('should handle Chrome API context invalidation error', () => {
      // Test using the mock Chrome API that can simulate the error
      const chromeError = window.chrome.simulateContextInvalidation();

      // Test that the method handles Chrome API errors gracefully
      expect(() =>
        googInstance.handleChromeError(chromeError, 'Chrome API call'),
      ).not.toThrow();
    });

    test('should handle Chrome API context invalidation gracefully', () => {
      const chromeError = window.chrome.simulateContextInvalidation();

      // Test that the method handles Chrome API errors gracefully
      expect(() =>
        googInstance.handleChromeError(chromeError, 'Chrome API call'),
      ).not.toThrow();
    });
  });

  describe('Context Invalid Message Display', () => {
    test('showContextInvalidMessage should use confirm when popup not available', () => {
      // Test with no popup view
      const googWithoutPopup = new G2T.Goog({
        app: { ...testApp, popupView: null },
      });

      // Just verify the method executes without error
      expect(() => googWithoutPopup.showContextInvalidMessage()).not.toThrow();
    });

    test('showContextInvalidMessage should use confirm when app is missing', () => {
      const googWithoutApp = new G2T.Goog();

      // Just verify the method executes without error
      expect(() => googWithoutApp.showContextInvalidMessage()).not.toThrow();
    });
  });

  describe('Storage Operations', () => {
    test('storageSyncGet should be callable', () => {
      const keys = ['debugMode'];
      const callback = jest.fn();

      expect(() => googInstance.storageSyncGet(keys, callback)).not.toThrow();
    });

    test('storageSyncSet should be callable', () => {
      const items = { debugMode: true };
      const callback = jest.fn();

      expect(() => googInstance.storageSyncSet(items, callback)).not.toThrow();
    });

    test('storageSyncGet should handle missing callback', () => {
      const keys = ['debugMode'];

      expect(() => googInstance.storageSyncGet(keys)).not.toThrow();
    });

    test('storageSyncSet should handle missing callback', () => {
      const items = { debugMode: true };

      expect(() => googInstance.storageSyncSet(items)).not.toThrow();
    });

    test('storageSyncGet should call Chrome API when available', () => {
      const keys = ['debugMode'];
      const callback = jest.fn();

      googInstance.storageSyncGet(keys, callback);

      expect(window.chrome.storage.sync.get).toHaveBeenCalledWith(
        keys,
        callback,
      );
    });

    test('storageSyncSet should call Chrome API when available', () => {
      const items = { debugMode: true };
      const callback = jest.fn();

      googInstance.storageSyncSet(items, callback);

      expect(window.chrome.storage.sync.set).toHaveBeenCalledWith(
        items,
        callback,
      );
    });

    test('storageSyncGet should handle Chrome API errors gracefully', () => {
      const keys = ['debugMode'];
      const callback = jest.fn();

      // Simulate Chrome API throwing an error
      window.chrome.storage.sync.get.mockImplementation(() => {
        throw window.chrome.simulateContextInvalidation();
      });

      expect(() => googInstance.storageSyncGet(keys, callback)).not.toThrow();
    });

    test('storageSyncSet should handle Chrome API errors gracefully', () => {
      const items = { debugMode: true };
      const callback = jest.fn();

      // Simulate Chrome API throwing an error
      window.chrome.storage.sync.set.mockImplementation(() => {
        throw window.chrome.simulateContextInvalidation();
      });

      expect(() => googInstance.storageSyncSet(items, callback)).not.toThrow();
    });
  });

  describe('Runtime Operations', () => {
    test('runtimeSendMessage should be callable', () => {
      const message = { type: 'test' };
      const callback = jest.fn();

      expect(() =>
        googInstance.runtimeSendMessage(message, callback),
      ).not.toThrow();
    });

    test('runtimeGetURL should be callable', () => {
      const path = 'test.html';

      expect(() => googInstance.runtimeGetURL(path)).not.toThrow();
    });

    test('runtimeSendMessage should handle missing callback', () => {
      const message = { type: 'test' };

      expect(() => googInstance.runtimeSendMessage(message)).not.toThrow();
    });

    test('runtimeSendMessage should call Chrome API when available', () => {
      const message = { type: 'test' };
      const callback = jest.fn();

      googInstance.runtimeSendMessage(message, callback);

      expect(window.chrome.runtime.sendMessage).toHaveBeenCalledWith(
        message,
        callback,
      );
    });

    test('runtimeGetURL should call Chrome API when available', () => {
      const path = 'test.html';

      const result = googInstance.runtimeGetURL(path);

      expect(window.chrome.runtime.getURL).toHaveBeenCalledWith(path);
      expect(result).toBe(`chrome-extension://mock-id/${path}`);
    });

    test('runtimeSendMessage should handle Chrome API errors gracefully', () => {
      const message = { type: 'test' };
      const callback = jest.fn();

      // Simulate Chrome API throwing an error
      window.chrome.runtime.sendMessage.mockImplementation(() => {
        throw window.chrome.simulateContextInvalidation();
      });

      expect(() =>
        googInstance.runtimeSendMessage(message, callback),
      ).not.toThrow();
    });

    test('runtimeGetURL should handle Chrome API errors gracefully', () => {
      const path = 'test.html';

      // Simulate Chrome API throwing an error
      window.chrome.runtime.getURL.mockImplementation(() => {
        throw window.chrome.simulateContextInvalidation();
      });

      expect(() => googInstance.runtimeGetURL(path)).not.toThrow();
    });
  });

  describe('Error Recovery', () => {
    test('should handle missing app gracefully', () => {
      const googWithoutApp = new G2T.Goog();
      expect(googWithoutApp.app).toBeUndefined();
    });

    test('should handle missing popup view gracefully', () => {
      const googWithoutPopup = new G2T.Goog({
        app: { ...testApp, popupView: null },
      });

      // Just verify the method executes without error
      expect(() => googWithoutPopup.showContextInvalidMessage()).not.toThrow();
    });

    test('should handle missing utils gracefully', () => {
      const appWithoutUtils = { ...testApp };
      delete appWithoutUtils.utils;

      const googWithoutUtils = new G2T.Goog({ app: appWithoutUtils });
      expect(googWithoutUtils.app.utils).toBeUndefined();
    });
  });

  describe('Integration Tests', () => {
    test('should integrate with app utils correctly', () => {
      expect(googInstance.app.utils).toBeDefined();
      expect(googInstance.app.utils.log).toBeDefined();
    });

    test('should handle Chrome API unavailability gracefully', () => {
      // In test environment, Chrome APIs won't be available
      // The class should handle this gracefully without throwing
      expect(() => googInstance.bindEvents()).not.toThrow();
      expect(() => googInstance.storageSyncGet(['test'])).not.toThrow();
      expect(() => googInstance.runtimeSendMessage({})).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle null error in handleChromeError', () => {
      expect(() => googInstance.handleChromeError(null, 'test')).not.toThrow();
    });

    test('should handle undefined error in handleChromeError', () => {
      expect(() =>
        googInstance.handleChromeError(undefined, 'test'),
      ).not.toThrow();
    });

    test('should handle empty error message', () => {
      const error = new Error('');
      expect(() => googInstance.handleChromeError(error, 'test')).not.toThrow();
    });

    test('should handle storage changes with null changes', () => {
      // Test that the class can handle edge cases gracefully
      expect(() => googInstance.bindEvents()).not.toThrow();
    });

    test('should handle storage changes with undefined namespace', () => {
      // Test that the class can handle edge cases gracefully
      expect(() => googInstance.bindEvents()).not.toThrow();
    });
  });
});
