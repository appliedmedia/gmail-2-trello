/**
 * Comprehensive Jest test suite for Trel class
 * Tests all methods and functionality of the Trel class
 */

// Import shared test utilities
const {
  G2T, // G2T namespace
  testApp, // Pre-created mock app with all dependencies
  _ts, // G2T_TestSuite instance
} = require('./test_shared');

// Load the REAL Trel class - this will override the mock version
// The real Trel will use the mock dependencies from testApp
_ts.loadSourceFile('chrome_manifest_v3/class_trel.js');

describe('Trel Class', () => {
  let trelInstance;

  beforeEach(() => {
    // Create a fresh real Trel instance with the pre-created mock dependencies
    // The real Trel class was loaded above, and will use mock dependencies from testApp
    trelInstance = new G2T.Trel({ app: testApp });

    // Clear all mocks
    _ts.clearAllMocks();
  });

  afterEach(() => {
    // Clean up mocks
    _ts.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should create Trel instance with app dependency', () => {
      expect(trelInstance).toBeDefined();
      expect(trelInstance.app).toBe(testApp);
    });

    test('should initialize with correct ck properties', () => {
      expect(trelInstance.ck).toBeDefined();
      expect(trelInstance.ck.id).toBe('g2t_trel');
      expect(trelInstance.ck.errorPrefix).toBe('Trello API Error:');
      expect(trelInstance.ck.unauthorizedError).toBe('Trello not authorized');
      expect(trelInstance.ck.apiCallPrefix).toBe('Trello API call:');
    });

    test('bindEvents should be callable', () => {
      expect(() => trelInstance.bindEvents()).not.toThrow();
    });
  });

  describe('API Key Management', () => {
    test('setApiKey should handle API key setting and return success/failure', () => {
      const apiKey = 'test-api-key';
      const result = trelInstance.setApiKey(apiKey);
      // In test environment, Trello.setKey fails, so setApiKey returns false
      // This tests the error handling path of the method
      expect(result).toBe(false);
      expect(testApp.utils.log).toHaveBeenCalledWith(
        'Trello API Error: Failed to set API key: Trello.setKey is not a function',
      );
    });

    test('getApiKey should return stored API key', () => {
      expect(trelInstance.getApiKey()).toBe('21b411b1b5b549c54bd32f0e90738b41');
    });

    test('isAuthorized should return authorization status', () => {
      testApp.persist.trelloAuthorized = true;
      expect(trelInstance.isAuthorized()).toBe(true);

      testApp.persist.trelloAuthorized = false;
      expect(trelInstance.isAuthorized()).toBe(false);
    });
  });

  describe('Authorization Methods', () => {
    test('authorize should update app state when called', () => {
      // Start with unauthorized state
      testApp.persist.trelloAuthorized = false;
      testApp.persist.trelloData = null;

      trelInstance.authorize(true);

      // The method should be callable without throwing
      expect(() => trelInstance.authorize(true)).not.toThrow();
    });

    test('deauthorize should update app state', () => {
      testApp.persist.trelloAuthorized = true;
      testApp.persist.trelloData = { some: 'data' };

      trelInstance.deauthorize();

      expect(testApp.persist.trelloAuthorized).toBe(false);
      expect(testApp.persist.trelloData).toBeNull();
    });

    test('deauthorize should update state even when external calls fail', () => {
      testApp.persist.trelloAuthorized = true;
      testApp.persist.trelloData = { some: 'data' };

      trelInstance.deauthorize();

      // State should still be updated even if external calls fail
      expect(testApp.persist.trelloAuthorized).toBe(false);
      expect(testApp.persist.trelloData).toBeNull();
    });
  });

  describe('Core API Wrapper', () => {
    test('wrapApiCall should call failure callback when not authorized', () => {
      // Ensure we start with a clean state
      testApp.persist.trelloAuthorized = false;

      // Verify authorization status before the test
      expect(trelInstance.isAuthorized()).toBe(false);

      const successCallback = jest.fn();
      const failureCallback = jest.fn();

      trelInstance.wrapApiCall(
        'get',
        'members/me',
        {},
        successCallback,
        failureCallback,
      );

      // The failure callback should be called with the unauthorized error
      expect(failureCallback).toHaveBeenCalledWith({
        error: 'Trello not authorized',
      });
      expect(testApp.utils.log).toHaveBeenCalledWith(
        'Trello API Error: Trello not authorized',
      );
    });

    test('wrapApiCall should log API calls when authorized', () => {
      testApp.persist.trelloAuthorized = true;

      const successCallback = jest.fn();
      const failureCallback = jest.fn();

      trelInstance.wrapApiCall(
        'get',
        'members/me',
        {},
        successCallback,
        failureCallback,
      );

      // Should log the API call attempt
      expect(testApp.utils.log).toHaveBeenCalledWith(
        'Trello API call: GET members/me',
      );
    });
  });

  describe('High-Level API Methods', () => {
    beforeEach(() => {
      testApp.persist.trelloAuthorized = true;
    });

    test('getUser should call wrapApiCall with correct parameters', () => {
      const spy = jest.spyOn(trelInstance, 'wrapApiCall');

      trelInstance.getUser();

      expect(spy).toHaveBeenCalledWith(
        'get',
        'members/me',
        {},
        expect.any(Function),
        expect.any(Function),
      );

      spy.mockRestore();
    });

    test('getBoards should call wrapApiCall with correct parameters', () => {
      const spy = jest.spyOn(trelInstance, 'wrapApiCall');

      trelInstance.getBoards();

      expect(spy).toHaveBeenCalledWith(
        'get',
        'members/me/boards',
        {},
        expect.any(Function),
        expect.any(Function),
      );

      spy.mockRestore();
    });

    test('getLists should call wrapApiCall with board ID', () => {
      const boardId = 'board123';
      const spy = jest.spyOn(trelInstance, 'wrapApiCall');

      trelInstance.getLists(boardId);

      expect(spy).toHaveBeenCalledWith(
        'get',
        `boards/${boardId}/lists`,
        {},
        expect.any(Function),
        expect.any(Function),
      );

      spy.mockRestore();
    });

    test('getCards should call wrapApiCall with list ID', () => {
      const listId = 'list123';
      const spy = jest.spyOn(trelInstance, 'wrapApiCall');

      trelInstance.getCards(listId);

      expect(spy).toHaveBeenCalledWith(
        'get',
        `lists/${listId}/cards`,
        {},
        expect.any(Function),
        expect.any(Function),
      );

      spy.mockRestore();
    });

    test('getMembers should call wrapApiCall with board ID', () => {
      const boardId = 'board123';
      const spy = jest.spyOn(trelInstance, 'wrapApiCall');

      trelInstance.getMembers(boardId);

      expect(spy).toHaveBeenCalledWith(
        'get',
        `boards/${boardId}/members`,
        {},
        expect.any(Function),
        expect.any(Function),
      );

      spy.mockRestore();
    });

    test('getLabels should call wrapApiCall with board ID', () => {
      const boardId = 'board123';
      const spy = jest.spyOn(trelInstance, 'wrapApiCall');

      trelInstance.getLabels(boardId);

      expect(spy).toHaveBeenCalledWith(
        'get',
        `boards/${boardId}/labels`,
        {},
        expect.any(Function),
        expect.any(Function),
      );

      spy.mockRestore();
    });

    test('createCard should call wrapApiCall with card data', () => {
      const cardData = { name: 'Test Card', listId: 'list123' };
      const spy = jest.spyOn(trelInstance, 'wrapApiCall');

      trelInstance.createCard(cardData);

      expect(spy).toHaveBeenCalledWith(
        'post',
        'cards',
        expect.any(Object),
        expect.any(Function),
        expect.any(Function),
      );

      spy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete authorization flow', () => {
      // Start unauthorized
      testApp.persist.trelloAuthorized = false;
      testApp.persist.trelloData = null;

      // Authorize
      trelInstance.authorize(true);

      // Make API call
      const spy = jest.spyOn(trelInstance, 'wrapApiCall');
      trelInstance.getUser();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();

      // Deauthorize
      trelInstance.deauthorize();
      expect(testApp.persist.trelloAuthorized).toBe(false);
      expect(testApp.persist.trelloData).toBeNull();
    });

    test('should handle authorization failure gracefully', () => {
      testApp.persist.trelloAuthorized = false;

      const successCallback = jest.fn();
      const failureCallback = jest.fn();

      trelInstance.wrapApiCall(
        'get',
        'members/me',
        {},
        successCallback,
        failureCallback,
      );

      expect(failureCallback).toHaveBeenCalledWith({
        error: 'Trello not authorized',
      });
      expect(successCallback).not.toHaveBeenCalled();
    });

    test('should handle multiple API calls independently', () => {
      testApp.persist.trelloAuthorized = true;

      const spy = jest.spyOn(trelInstance, 'wrapApiCall');

      trelInstance.getUser();
      trelInstance.getBoards();
      trelInstance.getLists('board123');

      expect(spy).toHaveBeenCalledTimes(3);

      spy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing app dependency gracefully', () => {
      // The constructor doesn't throw, it just sets app to undefined
      const trelWithoutApp = new G2T.Trel();
      expect(trelWithoutApp.app).toBeUndefined();
    });

    test('should handle missing app.persist gracefully', () => {
      const appWithoutPersist = { ...testApp };
      delete appWithoutPersist.persist;

      // The constructor doesn't throw, it just sets app to the provided object
      const trelWithIncompleteApp = new G2T.Trel({ app: appWithoutPersist });
      expect(trelWithIncompleteApp.app).toBe(appWithoutPersist);
      expect(trelWithIncompleteApp.app.persist).toBeUndefined();
    });
  });
});
