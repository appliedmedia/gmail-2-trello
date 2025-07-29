/**
 * Comprehensive Jest test suite for Model class
 * Tests all methods and functionality of the Model class
 */

// Import shared utilities from test_shared.js
const {
  setupJSDOM,
  cleanupJSDOM,
  loadClassFile,
  setupModelForTesting,
  createMockInstances,
  clearAllMocks,
  injectJQueryAndMocks,
} = require('./test_shared.js');

// Set up mocks before loading the Model class
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

// Load the Model class using eval (for Chrome extension compatibility)
const modelCode = loadClassFile('chrome_manifest_v3/class_model.js');

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
};
G2T.Trel = function(args) {
  if (!(this instanceof G2T.Trel)) {
    return new G2T.Trel(args);
  }
  // Create a basic mock Trel instance
  const mockTrel = {
    app: args?.app,
    setApiKey: jest.fn(),
    getApiKey: jest.fn(),
    isAuthorized: jest.fn(),
    authorize: jest.fn(),
    deauthorize: jest.fn(),
    wrapApiCall: jest.fn(),
    getUser: jest.fn(),
    getBoards: jest.fn(),
    getLists: jest.fn(),
    getCards: jest.fn(),
    getMembers: jest.fn(),
    getLabels: jest.fn(),
    createCard: jest.fn(),
    authorize_success: jest.fn(),
    authorize_failure: jest.fn(),
  };
  Object.assign(this, mockTrel);
  return this;
};`;

// Use standardized injection function
const injectedCode = injectJQueryAndMocks(modelCode, mockConstructorsCode);
eval(injectedCode);

describe('Model Class', () => {
  let dom, window, model, mockApp;

  beforeEach(() => {
    // Setup JSDOM environment using shared function
    const jsdomSetup = setupJSDOM();
    dom = jsdomSetup.dom;
    window = jsdomSetup.window;

    // Create proper mock application for Model class
    mockApp = {
      utils: {
        log: jest.fn(),
      },
      events: {
        emit: jest.fn(),
        addListener: jest.fn(),
      },
      persist: {
        trelloAuthorized: false,
        trelloData: null,
        user: null,
        emailBoardListCardMap: [],
      },
      temp: {
        boards: [],
        lists: [],
        cards: [],
        members: [],
        labels: [],
      },
      trelloApiKey: 'test-api-key',
      chrome: {
        runtimeSendMessage: jest.fn(),
      },
    };

    // Create a fresh Model instance for each test
    model = new G2T.Model({ parent: {}, app: mockApp });

    // Clear all mocks
    clearAllMocks();
  });

  afterEach(() => {
    // Clean up JSDOM environment using shared function
    cleanupJSDOM(dom);
  });

  describe('Constructor and Initialization', () => {
    test('should create Model instance with app dependency', () => {
      expect(model).toBeDefined();
      expect(model.app).toBe(mockApp);
      expect(model.parent).toBeDefined();
    });

    test('should initialize with default state', () => {
      expect(model.app.persist.trelloAuthorized).toBe(false);
      expect(model.app.temp.boards).toEqual([]);
      expect(model.app.temp.lists).toEqual([]);
      expect(model.app.temp.cards).toEqual([]);
      expect(model.app.temp.members).toEqual([]);
      expect(model.app.temp.labels).toEqual([]);
    });

    test('init should initialize the model', () => {
      expect(() => model.init()).not.toThrow();
    });
  });

  describe('Trello Authorization', () => {
    test('checkTrelloAuthorized should check authorization status', () => {
      expect(() => model.checkTrelloAuthorized()).not.toThrow();
    });

    test('checkTrelloAuthorized_success should handle successful authorization', () => {
      const data = { authorized: true };
      model.checkTrelloAuthorized_success(data);
      expect(model.app.persist.trelloAuthorized).toBe(true);
    });

    test('checkTrelloAuthorized_failure should handle failed authorization', () => {
      const data = { authorized: false };
      model.checkTrelloAuthorized_failure(data);
      expect(model.app.persist.trelloAuthorized).toBe(false);
    });

    test('checkTrelloAuthorized_popup_failure should handle popup failure', () => {
      const data = { authorized: false };
      model.checkTrelloAuthorized_popup_failure(data);
      expect(model.app.persist.trelloAuthorized).toBe(false);
    });

    test('deauthorizeTrello should deauthorize Trello', () => {
      model.app.persist.trelloAuthorized = true;
      model.deauthorizeTrello();
      expect(model.app.persist.trelloAuthorized).toBe(false);
    });
  });

  describe('Trello Data Loading', () => {
    test('loadTrelloUser should load Trello user data', () => {
      expect(() => model.loadTrelloUser()).not.toThrow();
    });

    test('loadTrelloUser_success should handle user data success', () => {
      const data = { id: '123', name: 'Test User' };
      model.loadTrelloUser_success(data);
      expect(model.app.persist.user).toEqual(data);
    });

    test('loadTrelloBoards should load Trello boards data', () => {
      expect(() => model.loadTrelloBoards()).not.toThrow();
    });

    test('loadTrelloBoards_success should handle boards data success', () => {
      const data = [{ id: '1', name: 'Board 1' }];
      model.loadTrelloBoards_success(data);
      expect(model.app.temp.boards).toEqual(data);
    });

    test('loadTrelloUser_failure should handle user loading failure', () => {
      const data = { error: 'Failed to load user data' };
      model.loadTrelloUser_failure(data);
    });

    test('loadTrelloBoards_failure should handle boards loading failure', () => {
      const data = { error: 'Failed to load boards data' };
      model.loadTrelloBoards_failure(data);
    });

    test('handleTrelloUserReady should trigger boards loading', () => {
      const loadTrelloBoardsSpy = jest.spyOn(model, 'loadTrelloBoards');
      model.handleTrelloUserReady();
      expect(loadTrelloBoardsSpy).toHaveBeenCalled();
    });
  });

  describe('Trello Lists Loading', () => {
    test('loadTrelloLists should load lists for a board', () => {
      const boardId = 'test-board-id';
      expect(() => model.loadTrelloLists(boardId)).not.toThrow();
    });

    test('loadTrelloLists_success should handle lists loading success', () => {
      const data = { lists: [{ id: '1', name: 'List 1' }] };
      model.loadTrelloLists_success(data);
      expect(model.app.temp.lists).toEqual(data);
    });

    test('loadTrelloLists_failure should handle lists loading failure', () => {
      const data = { error: 'Failed to load lists' };
      model.loadTrelloLists_failure(data);
      expect(model.app.temp.lists).toEqual([]);
    });
  });

  describe('Trello Cards Loading', () => {
    test('loadTrelloCards should load cards for a list', () => {
      const listId = 'test-list-id';
      expect(() => model.loadTrelloCards(listId)).not.toThrow();
    });

    test('loadTrelloCards_success should handle cards loading success', () => {
      const data = { cards: [{ id: '1', name: 'Card 1' }] };
      model.loadTrelloCards_success(data);
      expect(model.app.temp.cards).toEqual(data);
    });

    test('loadTrelloCards_failure should handle cards loading failure', () => {
      const data = { error: 'Failed to load cards' };
      model.loadTrelloCards_failure(data);
      expect(model.app.temp.cards).toEqual([]);
    });
  });

  describe('Trello Members Loading', () => {
    test('loadTrelloMembers should load members for a board', () => {
      const boardId = 'test-board-id';
      expect(() => model.loadTrelloMembers(boardId)).not.toThrow();
    });

    test('loadTrelloMembers_success should handle members loading success', () => {
      const data = { members: [{ id: '1', name: 'Member 1' }] };
      model.loadTrelloMembers_success(data);
      expect(model.app.temp.members).toEqual(data);
    });

    test('loadTrelloMembers_failure should handle members loading failure', () => {
      const data = { error: 'Failed to load members' };
      model.loadTrelloMembers_failure(data);
      expect(model.app.temp.members).toEqual([]);
    });
  });

  describe('Trello Labels Loading', () => {
    test('loadTrelloLabels should load labels for a board', () => {
      const boardId = 'test-board-id';
      expect(() => model.loadTrelloLabels(boardId)).not.toThrow();
    });

    test('loadTrelloLabels_success should handle labels loading success', () => {
      const data = { labels: [{ id: '1', name: 'Label 1', color: 'red' }] };
      model.loadTrelloLabels_success(data);
      expect(model.app.temp.labels).toEqual(data);
    });

    test('loadTrelloLabels_failure should handle labels loading failure', () => {
      const data = { error: 'Failed to load labels' };
      model.loadTrelloLabels_failure(data);
      expect(model.app.temp.labels).toEqual([]);
    });
  });

  describe('Card Creation and Submission', () => {
    test('submit should submit card data', () => {
      // Mock Trello authorization
      model.app.persist.trelloAuthorized = true;

      const data = {
        title: 'Test Card',
        description: 'Test Description',
        listId: 'test-list-id',
      };

      expect(() => model.submit(data)).not.toThrow();
    });

    test('createCard should create a new card', () => {
      const data = { title: 'Test Card', description: 'Test Description' };
      expect(() => model.createCard(data)).not.toThrow();
    });

    test('uploadAttachment should upload attachments', () => {
      const data = {
        attachments: [{ name: 'test.txt', value: 'test-content' }],
      };
      expect(() => model.uploadAttachment(data)).not.toThrow();
    });
  });

  describe('Email Board List Card Mapping', () => {
    test('emailBoardListCardMapLookup should lookup mapping', () => {
      const keyValue = { email: 'test@example.com' };
      expect(() => model.emailBoardListCardMapLookup(keyValue)).not.toThrow();
    });

    test('emailBoardListCardMapUpdate should update mapping', () => {
      const keyValue = {
        email: 'test@example.com',
        boardId: '123',
        listId: '456',
      };
      expect(() => model.emailBoardListCardMapUpdate(keyValue)).not.toThrow();
    });
  });

  describe('Event Handling', () => {
    test('handleClassModelStateLoaded should handle state loaded event', () => {
      const event = { type: 'stateLoaded' };
      const params = { data: 'test-data' };
      expect(() =>
        model.handleClassModelStateLoaded(event, params),
      ).not.toThrow();
    });

    test('handleSubmittedFormShownComplete should handle form submission', () => {
      const target = { id: 'test-form' };
      const params = { data: 'test-data' };
      expect(() =>
        model.handleSubmittedFormShownComplete(target, params),
      ).not.toThrow();
    });

    test('handlePostCardCreateUploadDisplayDone should handle upload completion', () => {
      const target = { id: 'test-upload' };
      const params = { data: 'test-data' };
      expect(() =>
        model.handlePostCardCreateUploadDisplayDone(target, params),
      ).not.toThrow();
    });

    test('handleBoardChanged should handle board change', () => {
      const target = { id: 'test-board' };
      const params = { boardId: 'test-board-id' };
      expect(() => model.handleBoardChanged(target, params)).not.toThrow();
    });

    test('handleListChanged should handle list change', () => {
      const target = { id: 'test-list' };
      const params = { listId: 'test-list-id' };
      expect(() => model.handleListChanged(target, params)).not.toThrow();
    });

    test('bindEvents should bind event listeners', () => {
      expect(() => model.bindEvents()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle null/undefined inputs gracefully', () => {
      expect(() => model.submit(null)).not.toThrow();
      expect(() => model.submit(undefined)).not.toThrow();
    });

    test('should handle empty data objects', () => {
      expect(() => model.submit({})).not.toThrow();
      expect(() => model.createCard({})).not.toThrow();
      expect(() => model.uploadAttachment({})).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    test('should handle large data sets efficiently', () => {
      const largeData = {
        boards: Array.from({ length: 100 }, (_, i) => ({
          id: `board-${i}`,
          name: `Board ${i}`,
        })),
      };

      const startTime = Date.now();
      model.loadTrelloBoards_success(largeData);
      const endTime = Date.now();

      expect(model.app.temp.boards).toEqual(largeData);
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    test('should handle many event handlers efficiently', () => {
      expect(() => model.bindEvents()).not.toThrow();
    });
  });
});
