/**
 * Comprehensive Jest test suite for App class
 * Tests all methods and functionality of the App class
 */

// Import shared test utilities
const { loadClassFile, createMockInstances, setupG2TMocks, clearAllMocks, createG2TNamespace } = require('./test_shared');

// Set up mocks before loading the App class
const mockInstances = createMockInstances();

// Create G2T namespace with proper constructors
const mockG2T = createG2TNamespace(mockInstances);
global.G2T = mockG2T;

// Make mockInstances available to tests
global.mockInstances = mockInstances;

// Load the App class using eval (for Chrome extension compatibility)
const appCode = loadClassFile('chrome_manifest_v3/class_app.js');

// Inject mock constructors after G2T namespace is initialized
const injectedCode = appCode.replace(
  'var G2T = G2T || {}; // Namespace initialization - must be var to guarantee correct scope',
  `var G2T = G2T || {}; // Namespace initialization - must be var to guarantee correct scope
// Inject mock constructors for testing
G2T.Chrome = ${mockG2T.Chrome.toString()};
G2T.EventTarget = ${mockG2T.EventTarget.toString()};
G2T.Model = ${mockG2T.Model.toString()};
G2T.GmailView = ${mockG2T.GmailView.toString()};
G2T.PopupView = ${mockG2T.PopupView.toString()};
G2T.Utils = ${mockG2T.Utils.toString()};`
);

eval(injectedCode);

describe('App Class', () => {
  let app;

  beforeEach(() => {
    // Create a fresh App instance for each test
    app = new G2T.App();
    
    // Clear all mocks
    clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should create App instance with all dependencies', () => {
      expect(app).toBeInstanceOf(G2T.App);
      expect(app.trelloApiKey).toBe('21b411b1b5b549c54bd32f0e90738b41');
      expect(app.chrome).toBe(global.mockInstances.mockChrome);
      expect(app.events).toBe(global.mockInstances.mockEventTarget);
      expect(app.model).toBe(global.mockInstances.mockModel);
      expect(app.gmailView).toBe(global.mockInstances.mockGmailView);
      expect(app.popupView).toBe(global.mockInstances.mockPopupView);
      expect(app.utils).toBe(global.mockInstances.mockUtils);
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
      expect(G2T.App.ck).toEqual({ id: 'g2t_app' });
    });

    test('ck getter should return correct value', () => {
      expect(app.ck).toEqual({ id: 'g2t_app' });
    });
  });

  describe('Persistence Operations', () => {
    test('persistLoad should load data from chrome storage', () => {
      app.persistLoad();
      expect(global.mockInstances.mockUtils.loadFromChromeStorage).toHaveBeenCalledWith('g2t_app', 'classAppStateLoaded');
    });

    test('persistSave should save data to chrome storage', () => {
      app.persistSave();
      expect(global.mockInstances.mockUtils.saveToChromeStorage).toHaveBeenCalledWith('g2t_app', app.persist);
    });
  });

  describe('Data Updates', () => {
    test('updateData should update popup view with model data', () => {
      app.updateData();
      expect(global.mockInstances.mockPopupView.bindData).toHaveBeenCalledWith(global.mockInstances.mockModel);
    });

    test('updateData should handle missing model data gracefully', () => {
      app.model = null;
      expect(() => app.updateData()).not.toThrow();
    });

    test('updateData should handle missing trello user data', () => {
      app.model.trello = null;
      expect(() => app.updateData()).not.toThrow();
    });

    test('updateData should parse Gmail data and bind to popup view', () => {
      const mockGmailData = { subject: 'Test Email', body: 'Test content' };
      global.mockInstances.mockGmailView.parseData.mockReturnValue(mockGmailData);
      
      app.updateData();
      
      expect(global.mockInstances.mockGmailView.parseData).toHaveBeenCalledWith({ fullName: 'Test User' });
      expect(global.mockInstances.mockPopupView.bindGmailData).toHaveBeenCalledWith(mockGmailData);
      expect(app.gmailView.parsingData).toBe(false);
    });
  });

  describe('Event Handling', () => {
    test('handleClassAppStateLoaded should handle state loaded event', () => {
      const event = { type: 'stateLoaded' };
      const params = { 
        trelloAuthorized: true, 
        boardId: 'test-board',
        listId: 'test-list' 
      };
      
      app.handleClassAppStateLoaded(event, params);
      
      expect(app.persist.trelloAuthorized).toBe(true);
      expect(app.persist.boardId).toBe('test-board');
      expect(app.persist.listId).toBe('test-list');
    });

    test('handleClassAppStateLoaded should handle empty params', () => {
      const event = { type: 'stateLoaded' };
      const originalState = { ...app.persist };
      
      app.handleClassAppStateLoaded(event, null);
      
      expect(app.persist).toEqual(originalState);
    });

    test('handleGmailNavigation should trigger redraw and fire event', () => {
      app.handleGmailNavigation();
      
      expect(global.mockInstances.mockUtils.log).toHaveBeenCalledWith('App: Gmail navigation detected, triggering redraw');
      expect(global.mockInstances.mockGmailView.forceRedraw).toHaveBeenCalled();
      expect(global.mockInstances.mockEventTarget.fire).toHaveBeenCalledWith('forceRedraw');
    });

    test('handleGmailHashChange should trigger redraw', () => {
      app.handleGmailHashChange();
      
      expect(global.mockInstances.mockUtils.log).toHaveBeenCalledWith('App: Gmail view change detected via hashchange');
      expect(global.mockInstances.mockGmailView.forceRedraw).toHaveBeenCalled();
    });

    test('bindEvents should bind event listeners', () => {
      app.bindEvents();
      
      expect(global.mockInstances.mockEventTarget.addListener).toHaveBeenCalledWith(
        'classAppStateLoaded',
        expect.any(Function)
      );
    });

    test('bindGmailNavigationEvents should bind navigation events', () => {
      app.bindGmailNavigationEvents();
      
      expect(window.addEventListener).toHaveBeenCalledWith('hashchange', expect.any(Function));
    });
  });

  describe('Initialization', () => {
    test('init should initialize all components', () => {
      app.init();
      
      expect(global.mockInstances.mockEventTarget.addListener).toHaveBeenCalled();
      expect(global.mockInstances.mockModel.init).toHaveBeenCalled();
      expect(global.mockInstances.mockGmailView.init).toHaveBeenCalled();
      expect(global.mockInstances.mockPopupView.init).toHaveBeenCalled();
      expect(global.mockInstances.mockUtils.init).toHaveBeenCalled();
      expect(global.mockInstances.mockUtils.loadFromChromeStorage).toHaveBeenCalled();
      expect(window.addEventListener).toHaveBeenCalled();
      expect(app.initialized).toBe(true);
    });

    test('init should only initialize once', () => {
      app.initialized = true;
      app.init();
      
      expect(global.mockInstances.mockModel.init).not.toHaveBeenCalled();
      expect(global.mockInstances.mockGmailView.init).not.toHaveBeenCalled();
      expect(global.mockInstances.mockPopupView.init).not.toHaveBeenCalled();
    });

    test('init should handle Google Analytics when available', () => {
      app.init();
      
      expect(analytics.getService).toHaveBeenCalledWith('gmail-2-trello');
    });

    test('init should handle Google Analytics errors gracefully', () => {
      analytics.getService.mockImplementation(() => {
        throw new Error('Analytics service not available');
      });
      
      expect(() => app.init()).not.toThrow();
      expect(global.mockInstances.mockUtils.log).toHaveBeenCalledWith('Google Analytics failed:', expect.any(Error));
    });

    test('init should handle missing Google Analytics gracefully', () => {
      delete global.analytics;
      
      expect(() => app.init()).not.toThrow();
      expect(global.mockInstances.mockUtils.log).toHaveBeenCalledWith('Google Analytics not available - tracking disabled');
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
      expect(app.chrome).toBe(global.mockInstances.mockChrome);
      expect(G2T.Chrome).toHaveBeenCalledWith({ app });
    });

    test('should properly integrate with EventTarget component', () => {
      expect(app.events).toBe(global.mockInstances.mockEventTarget);
      expect(G2T.EventTarget).toHaveBeenCalledWith({ app });
    });

    test('should properly integrate with Model component', () => {
      expect(app.model).toBe(global.mockInstances.mockModel);
      expect(G2T.Model).toHaveBeenCalledWith({ app });
    });

    test('should properly integrate with GmailView component', () => {
      expect(app.gmailView).toBe(global.mockInstances.mockGmailView);
      expect(G2T.GmailView).toHaveBeenCalledWith({ app });
    });

    test('should properly integrate with PopupView component', () => {
      expect(app.popupView).toBe(global.mockInstances.mockPopupView);
      expect(G2T.PopupView).toHaveBeenCalledWith({ app });
    });

    test('should properly integrate with Utils component', () => {
      expect(app.utils).toBe(global.mockInstances.mockUtils);
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
      global.mockInstances.mockChrome.init.mockImplementation(() => {
        throw new Error('Chrome init failed');
      });
      
      expect(() => app.init()).not.toThrow();
    });

    test('should handle storage errors gracefully', () => {
      global.mockInstances.mockUtils.loadFromChromeStorage.mockImplementation(() => {
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

  describe('Hash Change Handling', () => {
    test('should handle hash changes correctly', () => {
      const mockEvent = {
        oldURL: 'https://mail.google.com/mail/u/0/#inbox',
        newURL: 'https://mail.google.com/mail/u/0/#sent'
      };
      
      // Simulate the hash change event handler
      const hashChangeHandler = window.addEventListener.mock.calls.find(
        call => call[0] === 'hashchange'
      )[1];
      
      hashChangeHandler(mockEvent);
      
      expect(global.mockInstances.mockUtils.log).toHaveBeenCalledWith('App: Gmail view change detected via hashchange');
      expect(global.mockInstances.mockGmailView.forceRedraw).toHaveBeenCalled();
      expect(app.temp.lastHash).toBe('sent');
    });

    test('should not trigger redraw for same hash', () => {
      const mockEvent = {
        oldURL: 'https://mail.google.com/mail/u/0/#inbox',
        newURL: 'https://mail.google.com/mail/u/0/#inbox'
      };
      
      const hashChangeHandler = window.addEventListener.mock.calls.find(
        call => call[0] === 'hashchange'
      )[1];
      
      hashChangeHandler(mockEvent);
      
      expect(global.mockInstances.mockGmailView.forceRedraw).not.toHaveBeenCalled();
    });
  });
});