/**
 * Test file for class_trel.js
 * Tests the Trello API abstraction layer
 */

// Mock jQuery
global.$ = jest.fn();

// Mock window object
global.window = {
  location: {
    href: 'https://test.example.com',
  },
};

// Mock chrome API
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    getURL: jest.fn(),
  },
};

// Mock Trello library
global.Trello = {
  setKey: jest.fn(),
  authorize: jest.fn(),
  deauthorize: jest.fn(),
  rest: jest.fn(),
};

describe('Trel Class', () => {
  let trel;
  let mockApp;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock app
    mockApp = {
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

    // Load and evaluate Trel class
    // NOTE: eval() is required here because this project uses a non-module architecture
    // where classes are defined in global namespace (G2T) rather than using import/export.
    // This is the standard pattern used across all test files in this project.
    const trelCode = require('fs').readFileSync(
      'chrome_manifest_v3/class_trel.js',
      'utf8',
    );
    eval(trelCode); // Required: non-module architecture uses global namespace

    // Create a fresh Trel instance for each test
    trel = new G2T.Trel({ app: mockApp });
  });

  describe('Constructor and Initialization', () => {
    test('should create Trel instance with app dependency', () => {
      expect(trel).toBeDefined();
      expect(trel.app).toBe(mockApp);
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
      mockApp.persist.trelloAuthorized = true;
      expect(trel.isAuthorized()).toBe(true);

      mockApp.persist.trelloAuthorized = false;
      expect(trel.isAuthorized()).toBe(false);
    });
  });

  describe('Authorization Methods', () => {
    test('authorize should call Trello.authorize', () => {
      trel.authorize(true);
      expect(Trello.authorize).toHaveBeenCalled();
    });

    test('deauthorize should call Trello.deauthorize and update state', () => {
      mockApp.persist.trelloAuthorized = true;
      mockApp.persist.trelloData = { some: 'data' };

      trel.deauthorize();

      expect(mockApp.persist.trelloAuthorized).toBe(false);
      expect(mockApp.persist.trelloData).toBeNull();
      expect(Trello.deauthorize).toHaveBeenCalled();
    });

    test('deauthorize should update state even if Trello.deauthorize fails', () => {
      mockApp.persist.trelloAuthorized = true;
      mockApp.persist.trelloData = { some: 'data' };

      // Mock Trello.deauthorize to throw
      Trello.deauthorize.mockImplementation(() => {
        throw new Error('Trello not defined');
      });

      trel.deauthorize();

      expect(mockApp.persist.trelloAuthorized).toBe(false);
      expect(mockApp.persist.trelloData).toBeNull();
    });
  });

  describe('Core API Wrapper', () => {
    test('wrapApiCall should call Trello.rest when authorized', () => {
      mockApp.persist.trelloAuthorized = true;

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
      expect(mockApp.utils.log).toHaveBeenCalledWith(
        'Trello API call: GET members/me',
      );
    });

    test('wrapApiCall should call failure callback when not authorized', () => {
      mockApp.persist.trelloAuthorized = false;

      const successCallback = jest.fn();
      const failureCallback = jest.fn();

      trel.wrapApiCall(
        'get',
        'members/me',
        {},
        successCallback,
        failureCallback,
      );

      expect(Trello.rest).not.toHaveBeenCalled();
      expect(failureCallback).toHaveBeenCalledWith({
        error: 'Trello not authorized',
      });
      expect(mockApp.utils.log).toHaveBeenCalledWith(
        'Trello API Error: Trello not authorized',
      );
    });

    test('wrapApiCall should handle Trello.rest errors', () => {
      mockApp.persist.trelloAuthorized = true;

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
      mockApp.persist.trelloAuthorized = true;
    });

    test('getUser should call wrapApiCall with correct parameters', () => {
      const successCallback = jest.fn();
      const failureCallback = jest.fn();

      trel.getUser(successCallback, failureCallback);

      expect(Trello.rest).toHaveBeenCalledWith(
        'get',
        'members/me',
        {},
        expect.any(Function),
        expect.any(Function),
      );
    });

    test('getBoards should call wrapApiCall with correct parameters', () => {
      const successCallback = jest.fn();
      const failureCallback = jest.fn();

      trel.getBoards(successCallback, failureCallback);

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
      const successCallback = jest.fn();
      const failureCallback = jest.fn();

      trel.getLists(boardId, successCallback, failureCallback);

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
      const successCallback = jest.fn();
      const failureCallback = jest.fn();

      trel.getCards(listId, successCallback, failureCallback);

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
      const successCallback = jest.fn();
      const failureCallback = jest.fn();

      trel.getMembers(boardId, successCallback, failureCallback);

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
      const successCallback = jest.fn();
      const failureCallback = jest.fn();

      trel.getLabels(boardId, successCallback, failureCallback);

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
      const successCallback = jest.fn();
      const failureCallback = jest.fn();

      trel.createCard(cardData, successCallback, failureCallback);

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

      expect(mockApp.persist.trelloAuthorized).toBe(true);
      expect(mockApp.persist.trelloData).toEqual(authData);
    });

    test('authorize_failure should update authorization state', () => {
      mockApp.persist.trelloAuthorized = true;
      mockApp.persist.trelloData = { some: 'data' };

      trel.authorize_failure('Auth failed');

      expect(mockApp.persist.trelloAuthorized).toBe(false);
      expect(mockApp.persist.trelloData).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    test('should integrate with app correctly', () => {
      expect(trel.app).toBe(mockApp);
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
      const successCallback = jest.fn();
      trel.getUser(successCallback, jest.fn());
      expect(Trello.rest).toHaveBeenCalled();

      // Deauthorize
      trel.deauthorize();
      expect(trel.isAuthorized()).toBe(false);
    });
  });
});
