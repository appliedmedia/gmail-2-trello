/**
 * Comprehensive Jest test suite for Trel class
 * Tests all methods and functionality of the Trel class
 */

// Import shared test utilities
const {
  _ts, // G2T_TestSuite instance
  testApp, // Pre-created mock app with all dependencies
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
    test('setApiKey should set API key', () => {
      const apiKey = 'test-api-key';
      trelInstance.setApiKey(apiKey);
      expect(window.Trello.setKey).toHaveBeenCalledWith(apiKey);
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
    test('authorize should call Trello.authorize', () => {
      trelInstance.authorize(true);
      expect(window.Trello.authorize).toHaveBeenCalled();
    });

    test('deauthorize should call Trello.deauthorize and update state', () => {
      testApp.persist.trelloAuthorized = true;
      testApp.persist.trelloData = { some: 'data' };

      trelInstance.deauthorize();

      expect(testApp.persist.trelloAuthorized).toBe(false);
      expect(testApp.persist.trelloData).toBeNull();
      expect(window.Trello.deauthorize).toHaveBeenCalled();
    });

    test('deauthorize should update state even if Trello.deauthorize fails', () => {
      testApp.persist.trelloAuthorized = true;
      testApp.persist.trelloData = { some: 'data' };

      // Mock Trello.deauthorize to throw
      window.Trello.deauthorize.mockImplementation(() => {
        throw new Error('Trello not defined');
      });

      trelInstance.deauthorize();

      expect(testApp.persist.trelloAuthorized).toBe(false);
      expect(testApp.persist.trelloData).toBeNull();
    });
  });

  describe('Core API Wrapper', () => {
    test('wrapApiCall should call Trello.rest when authorized', () => {
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

      expect(Trello.rest).toHaveBeenCalledWith(
        'get',
        'members/me',
        {},
        expect.any(Function),
        expect.any(Function),
      );
      expect(testApp.utils.log).toHaveBeenCalledWith(
        'Trello API call: GET members/me',
      );
    });

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

    test('wrapApiCall should handle Trello.rest errors', () => {
      testApp.persist.trelloAuthorized = true;

      const error = new Error('API Error');
      window.Trello.rest.mockImplementation(() => {
        throw error;
      });

      const successCallback = jest.fn();
      const failureCallback = jest.fn();

      trelInstance.wrapApiCall(
        'get',
        'members/me',
        {},
        successCallback,
        failureCallback,
      );

      expect(failureCallback).toHaveBeenCalledWith({ error: 'API Error' });
    });
  });

  describe('High-Level API Methods', () => {
    beforeEach(() => {
      testApp.persist.trelloAuthorized = true;
    });

    test('getUser should call wrapApiCall with correct parameters', () => {
      trelInstance.getUser();

      expect(window.Trello.rest).toHaveBeenCalledWith(
        'get',
        'members/me',
        {},
        expect.any(Function),
        expect.any(Function),
      );
    });

    test('getBoards should call wrapApiCall with correct parameters', () => {
      trelInstance.getBoards();

      expect(window.Trello.rest).toHaveBeenCalledWith(
        'get',
        'members/me/boards',
        {},
        expect.any(Function),
        expect.any(Function),
      );
    });

    test('getLists should call wrapApiCall with board ID', () => {
      const boardId = 'board123';

      trelInstance.getLists(boardId);

      expect(window.Trello.rest).toHaveBeenCalledWith(
        'get',
        `boards/${boardId}/lists`,
        {},
        expect.any(Function),
        expect.any(Function),
      );
    });

    test('getCards should call wrapApiCall with list ID', () => {
      const listId = 'list123';

      trelInstance.getCards(listId);

      expect(window.Trello.rest).toHaveBeenCalledWith(
        'get',
        `lists/${listId}/cards`,
        {},
        expect.any(Function),
        expect.any(Function),
      );
    });

    test('getMembers should call wrapApiCall with board ID', () => {
      const boardId = 'board123';

      trelInstance.getMembers(boardId);

      expect(window.Trello.rest).toHaveBeenCalledWith(
        'get',
        `boards/${boardId}/members`,
        {},
        expect.any(Function),
        expect.any(Function),
      );
    });

    test('getLabels should call wrapApiCall with board ID', () => {
      const boardId = 'board123';

      trelInstance.getLabels(boardId);

      expect(window.Trello.rest).toHaveBeenCalledWith(
        'get',
        `boards/${boardId}/labels`,
        {},
        expect.any(Function),
        expect.any(Function),
      );
    });

    test('createCard should call wrapApiCall with card data', () => {
      const cardData = { name: 'Test Card', idList: 'list123' };

      trelInstance.createCard(cardData);

      expect(window.Trello.rest).toHaveBeenCalledWith(
        'post',
        'cards',
        expect.any(Object),
        expect.any(Function),
        expect.any(Function),
      );
    });
  });

  describe('Success/Failure Handlers', () => {
    test('authorize_success should update authorization state', () => {
      const authData = { token: 'test-token' };

      trelInstance.authorize_success(authData);

      expect(testApp.persist.trelloAuthorized).toBe(true);
      expect(testApp.persist.trelloData).toEqual(authData);
    });

    test('authorize_failure should update authorization state', () => {
      testApp.persist.trelloAuthorized = true;
      testApp.persist.trelloData = { some: 'data' };

      trelInstance.authorize_failure('Auth failed');

      expect(testApp.persist.trelloAuthorized).toBe(false);
      expect(testApp.persist.trelloData).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    test('should integrate with app correctly', () => {
      expect(trelInstance.app).toBe(testApp);
      expect(trelInstance.app.events.emit).toBeDefined();
      expect(trelInstance.app.persist.trelloAuthorized).toBeDefined();
      expect(trelInstance.app.utils.log).toBeDefined();
    });

    test('should handle complete authorization flow', () => {
      // Start unauthorized
      expect(trelInstance.isAuthorized()).toBe(false);

      // Authorize
      trelInstance.authorize_success({ token: 'test-token' });
      expect(trelInstance.isAuthorized()).toBe(true);

      // Make API call
      trelInstance.getUser();
      expect(window.Trello.rest).toHaveBeenCalled();

      // Deauthorize
      trelInstance.deauthorize();
      expect(trelInstance.isAuthorized()).toBe(false);
    });
  });
});
