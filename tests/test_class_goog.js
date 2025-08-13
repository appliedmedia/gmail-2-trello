/**
 * Comprehensive Jest test suite for Goog class
 * Tests all methods and functionality of the Goog class
 */

// Import shared test utilities
const {
  _ts, // G2T_TestSuite instance
  testApp, // Pre-created mock app with all dependencies
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

    test('should bind events on construction', () => {
      // The Goog constructor calls bindEvents(), which registers the storage listener
      expect(window.chrome.storage.onChanged.addListener).toHaveBeenCalled();
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
    test('bindEvents should bind storage change listener', () => {
      expect(window.chrome.storage.onChanged.addListener).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    test('storage change listener should handle debug mode changes', () => {
      const listener =
        window.chrome.storage.onChanged.addListener.mock.calls[0][0];

      const changes = { debugMode: { newValue: true } };
      const namespace = 'sync';

      expect(testApp.temp.log.debugMode).toBe(false); // Initially false

      listener(changes, namespace);

      expect(testApp.temp.log.debugMode).toBe(true); // Should be set to true
    });

    test('storage change listener should ignore non-sync namespace', () => {
      const listener =
        window.chrome.storage.onChanged.addListener.mock.calls[0][0];

      const changes = { debugMode: { newValue: true } };
      const namespace = 'local';

      expect(testApp.temp.log.debugMode).toBe(false); // Initially false

      listener(changes, namespace);

      expect(testApp.temp.log.debugMode).toBe(false); // Should remain unchanged
    });

    test('storage change listener should ignore non-debugMode changes', () => {
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
      const confirm = jest.fn(() => false); // Return false to prevent reload in tests
      window.confirm = confirm;

      googInstance.handleChromeError(error, 'test operation');

      expect(window.console.log).toHaveBeenCalledWith(
        'Error: Context invalidated during test operation. Extension needs to be reloaded.',
      );
      expect(confirm).toHaveBeenCalledWith(
        'Gmail-2-Trello extension needs to be reloaded to work correctly.\n\nReload now?',
      );
    });

    test('handleChromeError should handle context invalidation with user decline', () => {
      const error = new Error('Extension context invalidated');
      const confirm = jest.fn(() => false);
      window.confirm = confirm;

      googInstance.handleChromeError(error, 'test operation');

      expect(window.console.log).toHaveBeenCalledWith(
        'Error: Context invalidated during test operation. Extension needs to be reloaded.',
      );
      expect(confirm).toHaveBeenCalled();
    });

    test('handleChromeError should handle other errors', () => {
      const error = new Error('Other API Error');

      // Reset confirm mock to ensure it's not called
      window.confirm = jest.fn();

      googInstance.handleChromeError(error, 'test operation');

      expect(window.console.log).toHaveBeenCalledWith(
        'Error: test operation failed: Other API Error',
      );
      expect(global.confirm).not.toHaveBeenCalled();
    });

    test('handleChromeError should handle errors without message', () => {
      const error = {};

      googInstance.handleChromeError(error, 'test operation');

      expect(window.console.log).toHaveBeenCalledWith(
        'Error: test operation failed: Unknown error',
      );
    });
  });

  describe('Context Invalid Message Display', () => {
    test('showContextInvalidMessage should use popup view when available', () => {
      googInstance.showContextInvalidMessage();

      expect(
        testApp.popupView.displayExtensionInvalidReload,
      ).toHaveBeenCalled();
    });

    test('showContextInvalidMessage should use confirm when popup not available', () => {
      googInstance.app.popupView = null;
      const confirm = jest.fn(() => false); // Return false to prevent reload in tests
      window.confirm = confirm;

      googInstance.showContextInvalidMessage();

      // The method should call confirm with the reload message
      expect(confirm).toHaveBeenCalledWith(
        'Gmail-2-Trello extension needs to be reloaded to work correctly.\n\nReload now?',
      );
    });

    test('showContextInvalidMessage should use confirm when app is missing', () => {
      googInstance.app = null;
      const confirm = jest.fn(() => false); // Return false to prevent reload in tests
      window.confirm = confirm;

      googInstance.showContextInvalidMessage();

      // The method should call confirm with the reload message
      expect(confirm).toHaveBeenCalledWith(
        'Gmail-2-Trello extension needs to be reloaded to work correctly.\n\nReload now?',
      );
    });
  });

  describe('Storage Operations', () => {
    test('storageSyncGet should call chrome.storage.sync.get', () => {
      const keys = ['debugMode'];
      const callback = jest.fn();

      googInstance.storageSyncGet(keys, callback);

      expect(window.chrome.storage.sync.get).toHaveBeenCalledWith(
        keys,
        callback,
      );
    });

    test('storageSyncSet should call chrome.storage.sync.set', () => {
      const items = { debugMode: true };
      const callback = jest.fn();

      googInstance.storageSyncSet(items, callback);

      expect(window.chrome.storage.sync.set).toHaveBeenCalledWith(
        items,
        callback,
      );
    });

    test('storageSyncGet should handle missing callback', () => {
      const keys = ['debugMode'];

      googInstance.storageSyncGet(keys);

      expect(window.chrome.storage.sync.get).toHaveBeenCalledWith(
        keys,
        undefined,
      );
    });

    test('storageSyncSet should handle missing callback', () => {
      const items = { debugMode: true };

      googInstance.storageSyncSet(items);

      expect(window.chrome.storage.sync.set).toHaveBeenCalledWith(
        items,
        undefined,
      );
    });
  });

  describe('Runtime Operations', () => {
    test('runtimeSendMessage should call chrome.runtime.sendMessage', () => {
      const message = { action: 'test' };
      const callback = jest.fn();

      googInstance.runtimeSendMessage(message, callback);

      expect(window.chrome.runtime.sendMessage).toHaveBeenCalledWith(
        message,
        callback,
      );
    });

    test('runtimeGetURL should call chrome.runtime.getURL', () => {
      const path = 'popup.html';

      googInstance.runtimeGetURL(path);

      expect(window.chrome.runtime.getURL).toHaveBeenCalledWith(path);
    });

    test('runtimeSendMessage should handle missing callback', () => {
      const message = { action: 'test' };

      googInstance.runtimeSendMessage(message);

      expect(window.chrome.runtime.sendMessage).toHaveBeenCalledWith(
        message,
        undefined,
      );
    });
  });

  describe('Error Recovery', () => {
    test('should handle missing app gracefully', () => {
      googInstance.app = null;

      const listener =
        window.chrome.storage.onChanged.addListener.mock.calls[0][0];
      const changes = { debugMode: { newValue: true } };
      const namespace = 'sync';

      expect(() => listener(changes, namespace)).not.toThrow();
    });

    test('should handle missing popup view gracefully', () => {
      googInstance.app.popupView = null;
      const confirm = jest.fn(() => false);
      window.confirm = confirm;

      expect(() => googInstance.showContextInvalidMessage()).not.toThrow();

      // The method should call confirm with the reload message
      expect(confirm).toHaveBeenCalledWith(
        'Gmail-2-Trello extension needs to be reloaded to work correctly.\n\nReload now?',
      );
    });

    test('should handle missing utils gracefully', () => {
      googInstance.app.utils = null;

      const listener =
        window.chrome.storage.onChanged.addListener.mock.calls[0][0];
      const changes = { debugMode: { newValue: true } };
      const namespace = 'sync';

      expect(() => listener(changes, namespace)).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should integrate with app utils correctly', () => {
      const listener =
        window.chrome.storage.onChanged.addListener.mock.calls[0][0];
      const changes = { debugMode: { newValue: true } };
      const namespace = 'sync';

      expect(testApp.temp.log.debugMode).toBe(false); // Initially false

      listener(changes, namespace);

      expect(testApp.temp.log.debugMode).toBe(true); // Should be set correctly
    });

    test('should integrate with popup view correctly', () => {
      googInstance.showContextInvalidMessage();

      expect(
        testApp.popupView.displayExtensionInvalidReload,
      ).toHaveBeenCalled();
    });

    test('should integrate with chrome API correctly', () => {
      const keys = ['debugMode'];
      const callback = jest.fn();

      googInstance.storageSyncGet(keys, callback);

      expect(window.chrome.storage.sync.get).toHaveBeenCalledWith(
        keys,
        callback,
      );
    });
  });

  describe('Performance Tests', () => {
    test('should handle API calls efficiently', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        googInstance.storageSyncGet(['debugMode']);
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    test('should handle error processing efficiently', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        googInstance.handleChromeError(
          new Error('test error'),
          'test operation',
        );
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });
  });

  describe('Edge Cases', () => {
    test('should handle null error in handleChromeError', () => {
      expect(() => googInstance.handleChromeError(null, 'test')).not.toThrow();
      expect(window.console.log).toHaveBeenCalledWith(
        'Error: test failed: Unknown error',
      );
    });

    test('should handle undefined error in handleChromeError', () => {
      expect(() =>
        googInstance.handleChromeError(undefined, 'test'),
      ).not.toThrow();
      expect(window.console.log).toHaveBeenCalledWith(
        'Error: test failed: Unknown error',
      );
    });

    test('should handle empty error message', () => {
      const error = new Error('');

      googInstance.handleChromeError(error, 'test');

      expect(window.console.log).toHaveBeenCalledWith(
        'Error: test failed: Unknown error',
      );
    });

    test('should handle storage changes with null changes', () => {
      const listener =
        window.chrome.storage.onChanged.addListener.mock.calls[0][0];

      expect(() => listener(null, 'sync')).not.toThrow();
    });

    test('should handle storage changes with undefined namespace', () => {
      const listener =
        window.chrome.storage.onChanged.addListener.mock.calls[0][0];
      const changes = { debugMode: { newValue: true } };

      expect(() => listener(changes, undefined)).not.toThrow();
    });
  });
});
