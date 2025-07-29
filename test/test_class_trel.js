/**
 * Test file for class_trel.js
 * Tests the Trello API abstraction layer
 */

// Import shared test utilities
const {
  loadClassFile,
  createMockInstances,
  setupG2TMocks,
  clearAllMocks,
  createG2TNamespace,
  setupJSDOM,
  cleanupJSDOM,
  injectJQueryAndMocks,
} = require('./test_shared');

// Set up mocks before loading the Trel class
const mockInstances = createMockInstances();

// Make mock objects globally available
const mockChrome = mockInstances.mockChrome;
const mockEventTarget = mockInstances.mockEventTarget;
const mockModel = mockInstances.mockModel;
const mockGmailView = mockInstances.mockGmailView;
const mockPopupView = mockInstances.mockPopupView;
const mockUtils = mockInstances.mockUtils;

// Make mockInstances available to tests
global.mockInstances = mockInstances;

// Mock Trello library
global.Trello = {
  setKey: jest.fn(),
  authorize: jest.fn(),
  deauthorize: jest.fn(),
  rest: jest.fn(),
};

// Load the Trel class using eval (for Chrome extension compatibility)
const trelCode = loadClassFile('chrome_manifest_v3/class_trel.js');

// Create mock constructors code
const mockConstructorsCode = `
// Inject mock constructors for testing
G2T.Goog = function(args) {
  if (!(this instanceof G2T.Goog)) {
    return new G2T.Goog(args);
  }
  Object.assign(this, mockChrome);
  return this;
};
G2T.EventTarget = function(args) {
  if (!(this instanceof G2T.EventTarget)) {
    return new G2T.EventTarget(args);
  }
  Object.assign(this, mockEventTarget);
  return this;
};
G2T.Model = function(args) {
  if (!(this instanceof G2T.Model)) {
    return new G2T.Model(args);
  }
  Object.assign(this, mockModel);
  return this;
};
G2T.GmailView = function(args) {
  if (!(this instanceof G2T.GmailView)) {
    return new G2T.GmailView(args);
  }
  Object.assign(this, mockGmailView);
  return this;
};
G2T.PopupView = function(args) {
  if (!(this instanceof G2T.PopupView)) {
    return new G2T.PopupView(args);
  }
  Object.assign(this, mockPopupView);
  return this;
};
G2T.Utils = function(args) {
  if (!(this instanceof G2T.Utils)) {
    return new G2T.Utils(args);
  }
  Object.assign(this, mockUtils);
  return this;
};`;

// Use standardized injection function
const injectedCode = injectJQueryAndMocks(trelCode, mockConstructorsCode);
eval(injectedCode);

describe('Trel Class', () => {
  let trel, dom, testApp;

  beforeEach(() => {
    // Setup JSDOM environment using shared function
    const jsdomSetup = setupJSDOM();
    dom = jsdomSetup.dom;

    // Create test app
    testApp = {
      events: {
        emit: jest.fn(),
        addListener: jest.fn(),
      },
      persist: {
        trelloAuthorized: false,
        trelloData: null,
        boards: [],
      },
      utils: {
        log: jest.fn(),
      },
      trelloApiKey: 'test-api-key',
    };

    // Create a fresh Trel instance for each test
    trel = new G2T.Trel({ app: testApp });

    // Clear all mocks
    clearAllMocks();

    // Reset test app state to ensure clean state
    testApp.persist.trelloAuthorized = false;
    testApp.persist.trelloData = null;
    testApp.persist.boards = [];

    // Explicitly clear Trello.rest mock
    Trello.rest.mockClear();
  });

  afterEach(() => {
    // Clean up JSDOM environment using shared function
    cleanupJSDOM(dom);
  });

  describe('Constructor and Initialization', () => {
    test('should create Trel instance with app dependency', () => {
      expect(trel).toBeDefined();
      expect(trel.app).toBe(testApp);
    });

    test('should initialize with correct ck properties', () => {
      expect(trel.ck).toBeDefined();
      expect(trel.ck.id).toBe('g2t_trel');
      expect(trel.ck.errorPrefix).toBe('Trello API Error:');
      expect(trel.ck.unauthorizedError).toBe('Trello not authorized');
      expect(trel.ck.apiCallPrefix).toBe('Trello API call:');
    });

    test('bindEvents should be callable', () => {
      expect(() => trel.bindEvents()).not.toThrow();
    });
  });

  describe('API Key Management', () => {
    test('setApiKey should set API key', () => {
      const apiKey = 'test-api-key';
      trel.setApiKey(apiKey);
      expect(Trello.setKey).toHaveBeenCalledWith(apiKey);
    });

    test('getApiKey should return stored API key', () => {
      expect(trel.getApiKey()).toBe('test-api-key');
    });

    test('isAuthorized should return authorization status', () => {
      testApp.persist.trelloAuthorized = true;
      expect(trel.isAuthorized()).toBe(true);

      testApp.persist.trelloAuthorized = false;
      expect(trel.isAuthorized()).toBe(false);
    });
  });

  describe('Authorization Methods', () => {
    test('authorize should call Trello.authorize', () => {
      trel.authorize(true);
      expect(Trello.authorize).toHaveBeenCalled();
    });

    test('deauthorize should call Trello.deauthorize and update state', () => {
      testApp.persist.trelloAuthorized = true;
      testApp.persist.trelloData = { some: 'data' };

      trel.deauthorize();

      expect(testApp.persist.trelloAuthorized).toBe(false);
      expect(testApp.persist.trelloData).toBeNull();
      expect(Trello.deauthorize).toHaveBeenCalled();
    });

    test('deauthorize should update state even if Trello.deauthorize fails', () => {
      testApp.persist.trelloAuthorized = true;
      testApp.persist.trelloData = { some: 'data' };

      // Mock Trello.deauthorize to throw
      Trello.deauthorize.mockImplementation(() => {
        throw new Error('Trello not defined');
      });

      trel.deauthorize();

      expect(testApp.persist.trelloAuthorized).toBe(false);
      expect(testApp.persist.trelloData).toBeNull();
    });
  });

  describe('Core API Wrapper', () => {
    test('wrapApiCall should call Trello.rest when authorized', () => {
      testApp.persist.trelloAuthorized = true;

      const successCallback = jest.fn();
      const failureCallback = jest.fn();

      trel.wrapApiCall(
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
      expect(trel.isAuthorized()).toBe(false);

      const successCallback = jest.fn();
      const failureCallback = jest.fn();

      trel.wrapApiCall(
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
      Trello.rest.mockImplementation(() => {
        throw error;
      });

      const successCallback = jest.fn();
      const failureCallback = jest.fn();

      trel.wrapApiCall(
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
      trel.getUser();

      expect(Trello.rest).toHaveBeenCalledWith(
        'get',
        'members/me',
        {},
        expect.any(Function),
        expect.any(Function),
      );
    });

    test('getBoards should call wrapApiCall with correct parameters', () => {
      trel.getBoards();

      expect(Trello.rest).toHaveBeenCalledWith(
        'get',
        'members/me/boards',
        {},
        expect.any(Function),
        expect.any(Function),
      );
    });

    test('getLists should call wrapApiCall with board ID', () => {
      const boardId = 'board123';

      trel.getLists(boardId);

      expect(Trello.rest).toHaveBeenCalledWith(
        'get',
        `boards/${boardId}/lists`,
        {},
        expect.any(Function),
        expect.any(Function),
      );
    });

    test('getCards should call wrapApiCall with list ID', () => {
      const listId = 'list123';

      trel.getCards(listId);

      expect(Trello.rest).toHaveBeenCalledWith(
        'get',
        `lists/${listId}/cards`,
        {},
        expect.any(Function),
        expect.any(Function),
      );
    });

    test('getMembers should call wrapApiCall with board ID', () => {
      const boardId = 'board123';

      trel.getMembers(boardId);

      expect(Trello.rest).toHaveBeenCalledWith(
        'get',
        `boards/${boardId}/members`,
        {},
        expect.any(Function),
        expect.any(Function),
      );
    });

    test('getLabels should call wrapApiCall with board ID', () => {
      const boardId = 'board123';

      trel.getLabels(boardId);

      expect(Trello.rest).toHaveBeenCalledWith(
        'get',
        `boards/${boardId}/labels`,
        {},
        expect.any(Function),
        expect.any(Function),
      );
    });

    test('createCard should call wrapApiCall with card data', () => {
      const cardData = { name: 'Test Card', idList: 'list123' };

      trel.createCard(cardData);

      expect(Trello.rest).toHaveBeenCalledWith(
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

      trel.authorize_success(authData);

      expect(testApp.persist.trelloAuthorized).toBe(true);
      expect(testApp.persist.trelloData).toEqual(authData);
    });

    test('authorize_failure should update authorization state', () => {
      testApp.persist.trelloAuthorized = true;
      testApp.persist.trelloData = { some: 'data' };

      trel.authorize_failure('Auth failed');

      expect(testApp.persist.trelloAuthorized).toBe(false);
      expect(testApp.persist.trelloData).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    test('should integrate with app correctly', () => {
      expect(trel.app).toBe(testApp);
      expect(trel.app.events.emit).toBeDefined();
      expect(trel.app.persist.trelloAuthorized).toBeDefined();
      expect(trel.app.utils.log).toBeDefined();
    });

    test('should handle complete authorization flow', () => {
      // Start unauthorized
      expect(trel.isAuthorized()).toBe(false);

      // Authorize
      trel.authorize_success({ token: 'test-token' });
      expect(trel.isAuthorized()).toBe(true);

      // Make API call
      trel.getUser();
      expect(Trello.rest).toHaveBeenCalled();

      // Deauthorize
      trel.deauthorize();
      expect(trel.isAuthorized()).toBe(false);
    });
  });
});
