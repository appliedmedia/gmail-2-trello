/**
 * Comprehensive Jest test suite for Model class
 * Tests all methods and functionality of the Model class
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
    sendMessage: jest.fn()
  }
};

// Mock Trello API
global.Trello = {
  key: jest.fn(() => 'test-key'),
  token: jest.fn(() => 'test-token'),
  authorize: jest.fn(),
  deauthorize: jest.fn(),
  get: jest.fn()
};

// Mock console for testing
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Mock G2T global object
global.G2T = {};

// Import the Model class
const Model = require('../chrome_manifest_v3/class_model.js');

describe('Model Class', () => {
  let model;
  let mockApp;
  let mockUtils;

  beforeEach(() => {
    // Create mock dependencies
    mockUtils = {
      log: jest.fn(),
      loadFromChromeStorage: jest.fn(),
      saveToChromeStorage: jest.fn()
    };

    mockApp = {
      utils: mockUtils,
      chrome: {
        runtimeSendMessage: jest.fn()
      },
      eventTarget: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      }
    };

    // Create a fresh Model instance for each test
    model = new Model({ app: mockApp });
    
    // Reset all mocks
    $.mockClear();
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
    chrome.runtime.sendMessage.mockClear();
    console.log.mockClear();
    console.error.mockClear();
    console.warn.mockClear();
    Trello.key.mockClear();
    Trello.token.mockClear();
    Trello.authorize.mockClear();
    Trello.deauthorize.mockClear();
    Trello.get.mockClear();
  });

  describe('Constructor and Initialization', () => {
    test('should create Model instance with app dependency', () => {
      expect(model).toBeInstanceOf(Model);
      expect(model.app).toBe(mockApp);
    });

    test('should initialize with default state', () => {
      expect(model.trelloAuthorized).toBe(false);
      expect(model.trelloDataReady).toBe(false);
      expect(model.boards).toEqual([]);
      expect(model.lists).toEqual([]);
      expect(model.cards).toEqual([]);
      expect(model.members).toEqual([]);
      expect(model.labels).toEqual([]);
    });

    test('should handle constructor with no arguments', () => {
      const defaultModel = new Model();
      expect(defaultModel).toBeInstanceOf(Model);
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
      expect(model.trelloAuthorized).toBe(true);
    });

    test('checkTrelloAuthorized_failure should handle failed authorization', () => {
      const data = { authorized: false };
      model.checkTrelloAuthorized_failure(data);
      expect(model.trelloAuthorized).toBe(false);
    });

    test('checkTrelloAuthorized_popup_success should handle popup success', () => {
      const data = { authorized: true };
      model.checkTrelloAuthorized_popup_success(data);
      expect(model.trelloAuthorized).toBe(true);
    });

    test('checkTrelloAuthorized_popup_failure should handle popup failure', () => {
      const data = { authorized: false };
      model.checkTrelloAuthorized_popup_failure(data);
      expect(model.trelloAuthorized).toBe(false);
    });

    test('initTrello should initialize Trello', () => {
      expect(() => model.initTrello()).not.toThrow();
    });

    test('deauthorizeTrello should deauthorize Trello', () => {
      model.trelloAuthorized = true;
      model.deauthorizeTrello();
      expect(model.trelloAuthorized).toBe(false);
    });
  });

  describe('Trello Data Loading', () => {
    test('loadTrelloData should load Trello data', () => {
      expect(() => model.loadTrelloData()).not.toThrow();
    });

    test('loadTrelloData_user_success should handle user data success', () => {
      const data = { user: { id: '123', name: 'Test User' } };
      model.loadTrelloData_user_success(data);
      expect(model.user).toEqual(data.user);
    });

    test('loadTrelloData_boards_success should handle boards data success', () => {
      const data = { boards: [{ id: '1', name: 'Board 1' }] };
      model.loadTrelloData_boards_success(data);
      expect(model.boards).toEqual(data.boards);
    });

    test('loadTrelloData_failure should handle data loading failure', () => {
      const data = { error: 'Failed to load data' };
      model.loadTrelloData_failure(data);
      expect(model.trelloDataReady).toBe(false);
    });

    test('checkTrelloDataReady should check if data is ready', () => {
      model.user = { id: '123' };
      model.boards = [{ id: '1' }];
      expect(model.checkTrelloDataReady()).toBe(true);
    });

    test('checkTrelloDataReady should return false when data is not ready', () => {
      expect(model.checkTrelloDataReady()).toBe(false);
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
      expect(model.lists).toEqual(data.lists);
    });

    test('loadTrelloLists_failure should handle lists loading failure', () => {
      const data = { error: 'Failed to load lists' };
      model.loadTrelloLists_failure(data);
      expect(model.lists).toEqual([]);
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
      expect(model.cards).toEqual(data.cards);
    });

    test('loadTrelloCards_failure should handle cards loading failure', () => {
      const data = { error: 'Failed to load cards' };
      model.loadTrelloCards_failure(data);
      expect(model.cards).toEqual([]);
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
      expect(model.members).toEqual(data.members);
    });

    test('loadTrelloMembers_failure should handle members loading failure', () => {
      const data = { error: 'Failed to load members' };
      model.loadTrelloMembers_failure(data);
      expect(model.members).toEqual([]);
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
      expect(model.labels).toEqual(data.labels);
    });

    test('loadTrelloLabels_failure should handle labels loading failure', () => {
      const data = { error: 'Failed to load labels' };
      model.loadTrelloLabels_failure(data);
      expect(model.labels).toEqual([]);
    });
  });

  describe('Card Creation and Submission', () => {
    test('submit should submit card data', () => {
      const data = { title: 'Test Card', description: 'Test Description' };
      expect(() => model.submit(data)).not.toThrow();
    });

    test('createCard should create a new card', () => {
      const data = { title: 'Test Card', description: 'Test Description' };
      expect(() => model.createCard(data)).not.toThrow();
    });

    test('uploadAttachments should upload attachments', () => {
      const data = { attachments: [{ name: 'test.txt', value: 'test-content' }] };
      expect(() => model.uploadAttachments(data)).not.toThrow();
    });
  });

  describe('Email Board List Card Mapping', () => {
    test('emailBoardListCardMapLookup should lookup mapping', () => {
      const keyValue = { email: 'test@example.com' };
      expect(() => model.emailBoardListCardMapLookup(keyValue)).not.toThrow();
    });

    test('emailBoardListCardMapUpdate should update mapping', () => {
      const keyValue = { email: 'test@example.com', boardId: '123', listId: '456' };
      expect(() => model.emailBoardListCardMapUpdate(keyValue)).not.toThrow();
    });
  });

  describe('Event Handling', () => {
    test('handleClassModelStateLoaded should handle state loaded event', () => {
      const event = { type: 'stateLoaded' };
      const params = { data: 'test' };
      expect(() => model.handleClassModelStateLoaded(event, params)).not.toThrow();
    });

    test('handleSubmittedFormShownComplete should handle form submission', () => {
      const target = document.createElement('div');
      const params = { formData: 'test' };
      expect(() => model.handleSubmittedFormShownComplete(target, params)).not.toThrow();
    });

    test('handleTrelloCardCreateSuccess should handle card creation success', () => {
      const target = document.createElement('div');
      const params = { card: { id: '123', name: 'Test Card' } };
      expect(() => model.handleTrelloCardCreateSuccess(target, params)).not.toThrow();
    });

    test('handlePostCardCreateUploadDisplayDone should handle upload completion', () => {
      const target = document.createElement('div');
      const params = { uploads: [] };
      expect(() => model.handlePostCardCreateUploadDisplayDone(target, params)).not.toThrow();
    });

    test('handleBoardChanged should handle board change', () => {
      const target = document.createElement('div');
      const params = { boardId: '123' };
      expect(() => model.handleBoardChanged(target, params)).not.toThrow();
    });

    test('handleListChanged should handle list change', () => {
      const target = document.createElement('div');
      const params = { listId: '123' };
      expect(() => model.handleListChanged(target, params)).not.toThrow();
    });

    test('bindEvents should bind event listeners', () => {
      expect(() => model.bindEvents()).not.toThrow();
    });
  });

  describe('Uploader Class', () => {
    let uploader;

    beforeEach(() => {
      uploader = new G2T.Uploader({ parent: model, app: mockApp });
    });

    test('should create Uploader instance', () => {
      expect(uploader).toBeDefined();
      expect(uploader.parent).toBe(model);
      expect(uploader.app).toBe(mockApp);
    });

    test('should initialize with empty itemsForUpload array', () => {
      expect(uploader.itemsForUpload).toEqual([]);
    });

    test('init should initialize uploader', () => {
      expect(() => uploader.init()).not.toThrow();
    });

    test('bindEvents should bind uploader events', () => {
      expect(() => uploader.bindEvents()).not.toThrow();
    });

    test('attachments getter should return correct value', () => {
      expect(uploader.attachments).toBe('attachments');
    });

    test('add should add valid attachment to queue', () => {
      const attachment = {
        name: 'test.txt',
        value: 'test-content',
        property: 'attachments'
      };
      
      const result = uploader.add(attachment);
      expect(uploader.itemsForUpload).toHaveLength(1);
      expect(uploader.itemsForUpload[0]).toEqual({
        ...attachment,
        property: 'cards/undefined/attachments'
      });
      expect(result).toBe(uploader);
    });

    test('add should not add invalid attachment', () => {
      const invalidAttachment = {
        name: '',
        value: null,
        property: ''
      };
      
      uploader.add(invalidAttachment);
      expect(uploader.itemsForUpload).toHaveLength(0);
    });

    test('attach should handle file upload', () => {
      const method = 'POST';
      const property = 'cards/123/attachments';
      const upload1 = { value: 'https://example.com/file.txt', name: 'file.txt' };
      const success = jest.fn();
      const failure = jest.fn();

      uploader.cardId = '123';
      uploader.attach(method, property, upload1, success, failure);

      expect(mockApp.chrome.runtimeSendMessage).toHaveBeenCalled();
    });

    test('attach should not process invalid upload', () => {
      const method = 'POST';
      const property = 'short'; // Too short
      const upload1 = { value: 'short', name: 'file.txt' }; // Too short
      const success = jest.fn();
      const failure = jest.fn();

      uploader.attach(method, property, upload1, success, failure);

      expect(mockApp.chrome.runtimeSendMessage).not.toHaveBeenCalled();
    });

    test('upload should process upload queue', () => {
      const data = { cardId: '123' };
      uploader.cardId = '123';
      uploader.itemsForUpload = [
        { name: 'test1.txt', value: 'content1', property: 'cards/123/attachments' },
        { name: 'test2.txt', value: 'content2', property: 'cards/123/attachments' }
      ];

      expect(() => uploader.upload(data)).not.toThrow();
    });
  });

  describe('EmailBoardListCardMap Class', () => {
    let map;

    beforeEach(() => {
      map = new G2T.EmailBoardListCardMap();
    });

    test('should create EmailBoardListCardMap instance', () => {
      expect(map).toBeDefined();
    });

    test('ck static getter should return correct value', () => {
      expect(G2T.EmailBoardListCardMap.ck).toBeDefined();
    });

    test('ck getter should return correct value', () => {
      expect(map.ck).toBeDefined();
    });

    test('constructor should initialize with arguments', () => {
      const args = { test: 'value' };
      const mapWithArgs = new G2T.EmailBoardListCardMap(args);
      expect(mapWithArgs).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle null/undefined inputs gracefully', () => {
      expect(() => model.submit(null)).not.toThrow();
      expect(() => model.submit(undefined)).not.toThrow();
      expect(() => model.createCard(null)).not.toThrow();
      expect(() => model.createCard(undefined)).not.toThrow();
    });

    test('should handle empty data objects', () => {
      expect(() => model.submit({})).not.toThrow();
      expect(() => model.createCard({})).not.toThrow();
      expect(() => model.uploadAttachments({})).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    test('should handle large data sets efficiently', () => {
      const largeData = {
        boards: Array.from({ length: 100 }, (_, i) => ({ id: `board-${i}`, name: `Board ${i}` })),
        lists: Array.from({ length: 100 }, (_, i) => ({ id: `list-${i}`, name: `List ${i}` })),
        cards: Array.from({ length: 100 }, (_, i) => ({ id: `card-${i}`, name: `Card ${i}` }))
      };

      const startTime = Date.now();
      model.loadTrelloData_boards_success(largeData);
      const endTime = Date.now();

      expect(model.boards).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    test('should handle many event handlers efficiently', () => {
      const startTime = Date.now();
      model.bindEvents();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});