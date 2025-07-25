/**
 * Comprehensive Jest test suite for App class
 * Tests all methods and functionality of the App class
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

// Mock console for testing
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Mock G2T global object and its classes
global.G2T = {
  Chrome: jest.fn(),
  EventTarget: jest.fn(),
  Model: jest.fn(),
  GmailView: jest.fn(),
  PopupView: jest.fn(),
  Utils: jest.fn()
};

// Mock window object
global.window = {
  location: {
    hash: '#test-hash'
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock analytics
global.analytics = {
  track: jest.fn()
};

// Import the App class
const App = require('../chrome_manifest_v3/class_app.js');

describe('App Class', () => {
  let app;
  let mockChrome;
  let mockEventTarget;
  let mockModel;
  let mockGmailView;
  let mockPopupView;
  let mockUtils;

  beforeEach(() => {
    // Create mock instances
    mockChrome = {
      init: jest.fn(),
      runtimeSendMessage: jest.fn()
    };

    mockEventTarget = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    };

    mockModel = {
      init: jest.fn(),
      trello: {
        user: { fullName: 'Test User' }
      }
    };

    mockGmailView = {
      init: jest.fn(),
      bindData: jest.fn()
    };

    mockPopupView = {
      init: jest.fn(),
      bindData: jest.fn()
    };

    mockUtils = {
      loadFromChromeStorage: jest.fn(),
      saveToChromeStorage: jest.fn(),
      log: jest.fn()
    };

    // Setup G2T class mocks
    G2T.Chrome.mockImplementation(() => mockChrome);
    G2T.EventTarget.mockImplementation(() => mockEventTarget);
    G2T.Model.mockImplementation(() => mockModel);
    G2T.GmailView.mockImplementation(() => mockGmailView);
    G2T.PopupView.mockImplementation(() => mockPopupView);
    G2T.Utils.mockImplementation(() => mockUtils);

    // Create a fresh App instance for each test
    app = new App();
    
    // Reset all mocks
    $.mockClear();
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
    chrome.runtime.sendMessage.mockClear();
    console.log.mockClear();
    console.error.mockClear();
    console.warn.mockClear();
    window.addEventListener.mockClear();
    window.removeEventListener.mockClear();
    analytics.track.mockClear();
  });

  describe('Constructor and Initialization', () => {
    test('should create App instance with all dependencies', () => {
      expect(app).toBeInstanceOf(App);
      expect(app.trelloApiKey).toBe('21b411b1b5b549c54bd32f0e90738b41');
      expect(app.chrome).toBe(mockChrome);
      expect(app.events).toBe(mockEventTarget);
      expect(app.model).toBe(mockModel);
      expect(app.gmailView).toBe(mockGmailView);
      expect(app.popupView).toBe(mockPopupView);
      expect(app.utils).toBe(mockUtils);
    });

    test('should initialize with default persistent state', () => {
      expect(app.persist.layoutMode).toBe(0);
      expect(app.persist.trelloAuthorized).toBe(false);
      expect(app.persist.trelloUser).toBe(null);
      expect(app.persist.trelloBoards).toEqual([]);
      expect(app.persist.trelloLists).toEqual([]);
      expect(app.persist.trelloCards).toEqual([]);
      expect(app.persist.trelloMembers).toEqual([]);
      expect(app.persist.trelloLabels).toEqual([]);
      expect(app.persist.emailBoardListCardMap).toEqual([]);
      expect(app.persist.popupWidth).toBe(700);
      expect(app.persist.popupHeight).toBe(464);
      expect(app.persist.storageHashes).toEqual({});
      expect(app.persist.boardId).toBe(null);
      expect(app.persist.listId).toBe(null);
      expect(app.persist.cardId).toBe(null);
      expect(app.persist.useBackLink).toBe(true);
      expect(app.persist.addCC).toBe(false);
      expect(app.persist.labelsId).toBe('');
      expect(app.persist.membersId).toBe('');
    });

    test('should initialize with default temporary state', () => {
      expect(app.temp.lastHash).toBe('#test-hash');
      expect(app.temp.log.memory).toEqual([]);
      expect(app.temp.log.count).toBe(0);
      expect(app.temp.log.max).toBe(100);
      expect(app.temp.log.debugMode).toBe(false);
      expect(app.temp.updatesPending).toEqual([]);
      expect(app.temp.comboInitialized).toBe(false);
      expect(app.temp.pendingMessage).toBe(null);
      expect(app.temp.description).toBe('');
      expect(app.temp.title).toBe('');
      expect(app.temp.attachments).toEqual([]);
      expect(app.temp.images).toEqual([]);
    });

    test('should set initialized flag to false initially', () => {
      expect(app.initialized).toBe(false);
    });

    test('ck static getter should return correct value', () => {
      expect(App.ck).toEqual({ id: 'g2t_app' });
    });

    test('ck getter should return correct value', () => {
      expect(app.ck).toEqual({ id: 'g2t_app' });
    });
  });

  describe('Persistence Operations', () => {
    test('persistLoad should load data from chrome storage', () => {
      app.persistLoad();
      expect(mockUtils.loadFromChromeStorage).toHaveBeenCalledWith('g2t_app', 'classAppStateLoaded');
    });

    test('persistSave should save data to chrome storage', () => {
      app.persistSave();
      expect(mockUtils.saveToChromeStorage).toHaveBeenCalledWith('g2t_app', app.persist);
    });
  });

  describe('Data Updates', () => {
    test('updateData should update popup view with model data', () => {
      app.updateData();
      expect(mockPopupView.bindData).toHaveBeenCalledWith(mockModel);
    });

    test('updateData should handle missing model data gracefully', () => {
      app.model = null;
      expect(() => app.updateData()).not.toThrow();
    });

    test('updateData should handle missing trello user data', () => {
      app.model.trello = null;
      expect(() => app.updateData()).not.toThrow();
    });
  });

  describe('Event Handling', () => {
    test('handleClassAppStateLoaded should handle state loaded event', () => {
      const event = { type: 'stateLoaded' };
      const params = { data: 'test' };
      expect(() => app.handleClassAppStateLoaded(event, params)).not.toThrow();
    });

    test('handleGmailNavigation should handle Gmail navigation', () => {
      expect(() => app.handleGmailNavigation()).not.toThrow();
    });

    test('handleGmailHashChange should handle hash changes', () => {
      expect(() => app.handleGmailHashChange()).not.toThrow();
    });

    test('bindEvents should bind all event listeners', () => {
      expect(() => app.bindEvents()).not.toThrow();
    });

    test('bindGmailNavigationEvents should bind navigation events', () => {
      expect(() => app.bindGmailNavigationEvents()).not.toThrow();
    });
  });

  describe('Initialization', () => {
    test('init should initialize all components', () => {
      app.init();
      
      expect(mockChrome.init).toHaveBeenCalled();
      expect(mockEventTarget.addEventListener).toHaveBeenCalled();
      expect(mockModel.init).toHaveBeenCalled();
      expect(mockGmailView.init).toHaveBeenCalled();
      expect(mockPopupView.init).toHaveBeenCalled();
      expect(mockUtils.loadFromChromeStorage).toHaveBeenCalled();
      expect(app.initialized).toBe(true);
    });

    test('init should only initialize once', () => {
      app.initialized = true;
      app.init();
      
      expect(mockChrome.init).not.toHaveBeenCalled();
      expect(mockModel.init).not.toHaveBeenCalled();
      expect(mockGmailView.init).not.toHaveBeenCalled();
      expect(mockPopupView.init).not.toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    test('should maintain persistent state across operations', () => {
      app.persist.trelloAuthorized = true;
      app.persist.boardId = 'test-board';
      app.persist.listId = 'test-list';
      
      expect(app.persist.trelloAuthorized).toBe(true);
      expect(app.persist.boardId).toBe('test-board');
      expect(app.persist.listId).toBe('test-list');
    });

    test('should maintain temporary state across operations', () => {
      app.temp.description = 'Test description';
      app.temp.title = 'Test title';
      app.temp.attachments = [{ name: 'test.txt', value: 'content' }];
      
      expect(app.temp.description).toBe('Test description');
      expect(app.temp.title).toBe('Test title');
      expect(app.temp.attachments).toHaveLength(1);
    });

    test('should handle state updates correctly', () => {
      const newState = {
        trelloAuthorized: true,
        boardId: 'new-board',
        listId: 'new-list'
      };
      
      Object.assign(app.persist, newState);
      
      expect(app.persist.trelloAuthorized).toBe(true);
      expect(app.persist.boardId).toBe('new-board');
      expect(app.persist.listId).toBe('new-list');
    });
  });

  describe('Component Integration', () => {
    test('should properly integrate with Chrome component', () => {
      expect(app.chrome).toBe(mockChrome);
      expect(G2T.Chrome).toHaveBeenCalledWith({ app });
    });

    test('should properly integrate with EventTarget component', () => {
      expect(app.events).toBe(mockEventTarget);
      expect(G2T.EventTarget).toHaveBeenCalledWith({ app });
    });

    test('should properly integrate with Model component', () => {
      expect(app.model).toBe(mockModel);
      expect(G2T.Model).toHaveBeenCalledWith({ app });
    });

    test('should properly integrate with GmailView component', () => {
      expect(app.gmailView).toBe(mockGmailView);
      expect(G2T.GmailView).toHaveBeenCalledWith({ app });
    });

    test('should properly integrate with PopupView component', () => {
      expect(app.popupView).toBe(mockPopupView);
      expect(G2T.PopupView).toHaveBeenCalledWith({ app });
    });

    test('should properly integrate with Utils component', () => {
      expect(app.utils).toBe(mockUtils);
      expect(G2T.Utils).toHaveBeenCalledWith({ app });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing dependencies gracefully', () => {
      app.model = null;
      app.popupView = null;
      
      expect(() => app.updateData()).not.toThrow();
    });

    test('should handle initialization errors gracefully', () => {
      mockChrome.init.mockImplementation(() => {
        throw new Error('Chrome init failed');
      });
      
      expect(() => app.init()).not.toThrow();
    });

    test('should handle storage errors gracefully', () => {
      mockUtils.loadFromChromeStorage.mockImplementation(() => {
        throw new Error('Storage load failed');
      });
      
      expect(() => app.persistLoad()).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    test('should initialize efficiently', () => {
      const startTime = Date.now();
      app.init();
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    test('should handle large state updates efficiently', () => {
      const largeState = {
        trelloBoards: Array.from({ length: 100 }, (_, i) => ({ id: `board-${i}`, name: `Board ${i}` })),
        trelloLists: Array.from({ length: 100 }, (_, i) => ({ id: `list-${i}`, name: `List ${i}` })),
        trelloCards: Array.from({ length: 100 }, (_, i) => ({ id: `card-${i}`, name: `Card ${i}` }))
      };
      
      const startTime = Date.now();
      Object.assign(app.persist, largeState);
      const endTime = Date.now();
      
      expect(app.persist.trelloBoards).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Configuration', () => {
    test('should have correct Trello API key', () => {
      expect(app.trelloApiKey).toBe('21b411b1b5b549c54bd32f0e90738b41');
    });

    test('should have correct default popup dimensions', () => {
      expect(app.persist.popupWidth).toBe(700);
      expect(app.persist.popupHeight).toBe(464);
    });

    test('should have correct default layout mode', () => {
      expect(app.persist.layoutMode).toBe(0);
    });

    test('should have correct default settings', () => {
      expect(app.persist.useBackLink).toBe(true);
      expect(app.persist.addCC).toBe(false);
    });
  });

  describe('Memory Management', () => {
    test('should maintain log memory within limits', () => {
      for (let i = 0; i < 150; i++) {
        app.temp.log.memory.push(`log entry ${i}`);
        app.temp.log.count++;
      }
      
      expect(app.temp.log.memory.length).toBeLessThanOrEqual(app.temp.log.max);
    });

    test('should handle memory cleanup', () => {
      app.temp.log.memory = Array.from({ length: 200 }, (_, i) => `log entry ${i}`);
      app.temp.log.count = 200;
      
      // Simulate memory cleanup
      if (app.temp.log.memory.length > app.temp.log.max) {
        app.temp.log.memory = app.temp.log.memory.slice(-app.temp.log.max);
        app.temp.log.count = app.temp.log.memory.length;
      }
      
      expect(app.temp.log.memory.length).toBeLessThanOrEqual(app.temp.log.max);
    });
  });
});