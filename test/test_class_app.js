/**
 * Comprehensive Jest test suite for App class functionality
 * Tests the App class and its methods
 */

// Ensure G2T namespace is available before importing App
if (!global.G2T) {
  throw new Error('G2T namespace not available - setup file may not be loaded');
}

// Import the actual App class
const App = require('../chrome_manifest_v3/class_app.js');

describe('App Class', () => {
  let app;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a fresh App instance for each test
    app = new App();
  });

  afterEach(() => {
    // Clean up
    if (app && typeof app.destroy === 'function') {
      app.destroy();
    }
  });

  describe('Constructor', () => {
    test('should create an App instance with all required properties', () => {
      expect(app).toBeDefined();
      expect(app.chrome).toBeDefined();
      expect(app.events).toBeDefined();
      expect(app.model).toBeDefined();
      expect(app.gmailView).toBeDefined();
      expect(app.popupView).toBeDefined();
      expect(app.utils).toBeDefined();
    });

    test('should initialize G2T classes with correct parameters', () => {
      expect(app.chrome).toBeInstanceOf(G2T.Chrome);
      expect(app.events).toBeInstanceOf(G2T.EventTarget);
      expect(app.model).toBeInstanceOf(G2T.Model);
      expect(app.gmailView).toBeInstanceOf(G2T.GmailView);
      expect(app.popupView).toBeInstanceOf(G2T.PopupView);
      expect(app.utils).toBeInstanceOf(G2T.Utils);
    });
  });

  describe('Initialization', () => {
    test('should initialize all components when init() is called', () => {
      app.init();
      
      expect(app.gmailView.init).toHaveBeenCalled();
      expect(app.popupView.init).toHaveBeenCalled();
    });

    test('should set up event listeners', () => {
      app.init();
      
      expect(app.events.addEventListener).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    test('should handle events correctly', () => {
      const mockEvent = { type: 'test', data: {} };
      
      app.handleEvent(mockEvent);
      
      expect(app.events.dispatchEvent).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('Data Management', () => {
    test('should get data from model', () => {
      const testData = { key: 'value' };
      app.model.get.mockReturnValue(testData);
      
      const result = app.getData('key');
      
      expect(app.model.get).toHaveBeenCalledWith('key');
      expect(result).toBe(testData);
    });

    test('should set data in model', () => {
      const testData = { key: 'newValue' };
      
      app.setData('key', testData);
      
      expect(app.model.set).toHaveBeenCalledWith('key', testData);
    });
  });

  describe('Storage Operations', () => {
    test('should get data from chrome storage', async () => {
      const testData = { key: 'value' };
      app.chrome.storageSyncGet.mockResolvedValue(testData);
      
      const result = await app.getStorageData('key');
      
      expect(app.chrome.storageSyncGet).toHaveBeenCalledWith('key');
      expect(result).toBe(testData);
    });

    test('should set data in chrome storage', async () => {
      const testData = { key: 'value' };
      
      await app.setStorageData('key', testData);
      
      expect(app.chrome.storageSyncSet).toHaveBeenCalledWith('key', testData);
    });
  });

  describe('Utility Functions', () => {
    test('should use utils for markdown conversion', () => {
      const testText = '**bold**';
      const expectedResult = '<strong>bold</strong>';
      app.utils.markdownify.mockReturnValue(expectedResult);
      
      const result = app.convertMarkdown(testText);
      
      expect(app.utils.markdownify).toHaveBeenCalledWith(testText);
      expect(result).toBe(expectedResult);
    });
  });

  describe('Cleanup', () => {
    test('should clean up resources when destroy() is called', () => {
      app.destroy();
      
      expect(app.events.removeEventListener).toHaveBeenCalled();
    });
  });
});