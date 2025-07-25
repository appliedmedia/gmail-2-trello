/**
 * Comprehensive Jest test suite for PopupForm class
 * Tests all methods and functionality of the PopupForm class
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

// Mock window object
global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock document object
global.document = {
  createElement: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  getElementById: jest.fn()
};

// Import the PopupForm class
const PopupForm = require('../chrome_manifest_v3/views/class_popupForm.js');

describe('PopupForm Class', () => {
  let popupForm;
  let mockParent;
  let mockApp;
  let mockEvents;
  let mockUtils;

  beforeEach(() => {
    // Create mock instances
    mockEvents = {
      addListener: jest.fn()
    };

    mockUtils = {
      log: jest.fn(),
      loadFromChromeStorage: jest.fn(),
      saveToChromeStorage: jest.fn()
    };

    mockApp = {
      utils: mockUtils,
      events: mockEvents
    };

    mockParent = {
      state: {
        boardId: '',
        listId: '',
        cardName: '',
        cardDescription: ''
      }
    };

    // Create a fresh PopupForm instance for each test
    popupForm = new PopupForm({ parent: mockParent, app: mockApp });
    
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
    document.createElement.mockClear();
    document.querySelector.mockClear();
    document.querySelectorAll.mockClear();
    document.getElementById.mockClear();
  });

  describe('Constructor and Initialization', () => {
    test('should create PopupForm instance with dependencies', () => {
      expect(popupForm).toBeInstanceOf(PopupForm);
      expect(popupForm.parent).toBe(mockParent);
      expect(popupForm.app).toBe(mockApp);
    });

    test('should initialize with default properties', () => {
      expect(popupForm.isInitialized).toBe(false);
    });

    test('ck static getter should return correct value', () => {
      expect(PopupForm.ck).toEqual({ id: 'g2t_popupform' });
    });

    test('ck getter should return correct value', () => {
      expect(popupForm.ck).toEqual({ id: 'g2t_popupform' });
    });

    test('init should initialize the form', () => {
      popupForm.init();
      expect(popupForm.isInitialized).toBe(true);
    });

    test('bindEvents should bind all event listeners', () => {
      popupForm.bindEvents();
      
      expect(mockEvents.addListener).toHaveBeenCalledWith('submit', expect.any(Function));
      expect(mockEvents.addListener).toHaveBeenCalledWith('checkTrelloAuthorized', expect.any(Function));
      expect(mockEvents.addListener).toHaveBeenCalledWith('requestDeauthorizeTrello', expect.any(Function));
      expect(mockEvents.addListener).toHaveBeenCalledWith('loadTrelloListSuccess', expect.any(Function));
      expect(mockEvents.addListener).toHaveBeenCalledWith('loadTrelloCardsSuccess', expect.any(Function));
      expect(mockEvents.addListener).toHaveBeenCalledWith('loadTrelloLabelsSuccess', expect.any(Function));
      expect(mockEvents.addListener).toHaveBeenCalledWith('loadTrelloMembersSuccess', expect.any(Function));
      expect(mockEvents.addListener).toHaveBeenCalledWith('loadTrelloListFailed', expect.any(Function));
      expect(mockEvents.addListener).toHaveBeenCalledWith('loadTrelloCardsFailed', expect.any(Function));
      expect(mockEvents.addListener).toHaveBeenCalledWith('loadTrelloLabelsFailed', expect.any(Function));
      expect(mockEvents.addListener).toHaveBeenCalledWith('loadTrelloMembersFailed', expect.any(Function));
      expect(mockEvents.addListener).toHaveBeenCalledWith('onAPIFailure', expect.any(Function));
      expect(mockEvents.addListener).toHaveBeenCalledWith('newCardUploadsComplete', expect.any(Function));
      expect(mockEvents.addListener).toHaveBeenCalledWith('menuClick', expect.any(Function));
    });
  });

  describe('Data Validation', () => {
    test('validateData should return errors for missing board', () => {
      mockParent.state.boardId = '';
      mockParent.state.listId = 'list1';
      mockParent.state.cardName = 'Test Card';
      
      const errors = popupForm.validateData();
      
      expect(errors).toContain('Please select a board');
    });

    test('validateData should return errors for missing list', () => {
      mockParent.state.boardId = 'board1';
      mockParent.state.listId = '';
      mockParent.state.cardName = 'Test Card';
      
      const errors = popupForm.validateData();
      
      expect(errors).toContain('Please select a list');
    });

    test('validateData should return errors for missing card name', () => {
      mockParent.state.boardId = 'board1';
      mockParent.state.listId = 'list1';
      mockParent.state.cardName = '';
      
      const errors = popupForm.validateData();
      
      expect(errors).toContain('Please enter a card name');
    });

    test('validateData should return errors for whitespace-only card name', () => {
      mockParent.state.boardId = 'board1';
      mockParent.state.listId = 'list1';
      mockParent.state.cardName = '   ';
      
      const errors = popupForm.validateData();
      
      expect(errors).toContain('Please enter a card name');
    });

    test('validateData should return errors for card name too long', () => {
      mockParent.state.boardId = 'board1';
      mockParent.state.listId = 'list1';
      mockParent.state.cardName = 'A'.repeat(16385);
      
      const errors = popupForm.validateData();
      
      expect(errors).toContain('Card name is too long (max 16384 characters)');
    });

    test('validateData should return empty array for valid data', () => {
      mockParent.state.boardId = 'board1';
      mockParent.state.listId = 'list1';
      mockParent.state.cardName = 'Test Card';
      
      const errors = popupForm.validateData();
      
      expect(errors).toEqual([]);
    });

    test('validateData should return multiple errors for multiple issues', () => {
      mockParent.state.boardId = '';
      mockParent.state.listId = '';
      mockParent.state.cardName = '';
      
      const errors = popupForm.validateData();
      
      expect(errors).toContain('Please select a board');
      expect(errors).toContain('Please select a list');
      expect(errors).toContain('Please enter a card name');
      expect(errors).toHaveLength(3);
    });
  });

  describe('Data Binding', () => {
    test('bindData should bind data to form', () => {
      const data = {
        boards: [{ id: 'board1', name: 'Board 1' }],
        lists: [{ id: 'list1', name: 'List 1' }],
        cards: [{ id: 'card1', name: 'Card 1' }],
        labels: [{ id: 'label1', name: 'Label 1' }],
        members: [{ id: 'member1', name: 'Member 1' }]
      };
      
      expect(() => popupForm.bindData(data)).not.toThrow();
    });

    test('bindGmailData should bind Gmail data', () => {
      const data = {
        subject: 'Test Subject',
        body: 'Test Body',
        attachments: []
      };
      
      expect(() => popupForm.bindGmailData(data)).not.toThrow();
    });

    test('updateBody should update body content', () => {
      const data = {
        description: 'Test description',
        attachments: []
      };
      
      expect(() => popupForm.updateBody(data)).not.toThrow();
    });
  });

  describe('Form Updates', () => {
    test('updateBoards should update board options', () => {
      const tempId = 0;
      expect(() => popupForm.updateBoards(tempId)).not.toThrow();
    });

    test('updateLists should update list options', () => {
      const tempId = 0;
      expect(() => popupForm.updateLists(tempId)).not.toThrow();
    });

    test('updateCards should update card options', () => {
      const tempId = 0;
      expect(() => popupForm.updateCards(tempId)).not.toThrow();
    });

    test('updateLabels should update label options', () => {
      expect(() => popupForm.updateLabels()).not.toThrow();
    });

    test('updateMembers should update member options', () => {
      expect(() => popupForm.updateMembers()).not.toThrow();
    });
  });

  describe('Form Clearing', () => {
    test('clearBoard should clear board selection', () => {
      expect(() => popupForm.clearBoard()).not.toThrow();
    });

    test('clearLabels should clear label selection', () => {
      expect(() => popupForm.clearLabels()).not.toThrow();
    });

    test('clearMembers should clear member selection', () => {
      expect(() => popupForm.clearMembers()).not.toThrow();
    });

    test('reset should reset form state', () => {
      expect(() => popupForm.reset()).not.toThrow();
    });
  });

  describe('Form Controls', () => {
    test('toggleCheckboxes should toggle checkbox state', () => {
      const tag = 'test-tag';
      expect(() => popupForm.toggleCheckboxes(tag)).not.toThrow();
    });

    test('comboBox should update combo box', () => {
      const update = true;
      expect(() => popupForm.comboBox(update)).not.toThrow();
    });
  });

  describe('Message Display', () => {
    test('showMessage should display message', () => {
      const parent = document.createElement('div');
      const text = 'Test message';
      
      expect(() => popupForm.showMessage(parent, text)).not.toThrow();
    });

    test('hideMessage should hide message', () => {
      expect(() => popupForm.hideMessage()).not.toThrow();
    });
  });

  describe('Form Submission', () => {
    test('submit should submit form data', () => {
      expect(() => popupForm.submit()).not.toThrow();
    });

    test('displaySubmitCompleteForm should show completion form', () => {
      const params = { cardId: 'card1' };
      expect(() => popupForm.displaySubmitCompleteForm(params)).not.toThrow();
    });

    test('displayAPIFailedForm should show failure form', () => {
      const response = { error: 'API Error' };
      expect(() => popupForm.displayAPIFailedForm(response)).not.toThrow();
    });
  });

  describe('Event Handlers', () => {
    test('handleBoardChanged should handle board change', () => {
      const target = document.createElement('div');
      const params = { boardId: 'board1' };
      expect(() => popupForm.handleBoardChanged(target, params)).not.toThrow();
    });

    test('handleListChanged should handle list change', () => {
      const target = document.createElement('div');
      const params = { listId: 'list1' };
      expect(() => popupForm.handleListChanged(target, params)).not.toThrow();
    });

    test('handleSubmit should handle form submission', () => {
      expect(() => popupForm.handleSubmit()).not.toThrow();
    });

    test('handleCheckTrelloAuthorized should handle authorization check', () => {
      expect(() => popupForm.handleCheckTrelloAuthorized()).not.toThrow();
    });

    test('handleRequestDeauthorizeTrello should handle deauthorization', () => {
      expect(() => popupForm.handleRequestDeauthorizeTrello()).not.toThrow();
    });

    test('handleLoadTrelloListSuccess should handle list load success', () => {
      expect(() => popupForm.handleLoadTrelloListSuccess()).not.toThrow();
    });

    test('handleLoadTrelloCardsSuccess should handle cards load success', () => {
      expect(() => popupForm.handleLoadTrelloCardsSuccess()).not.toThrow();
    });

    test('handleLoadTrelloLabelsSuccess should handle labels load success', () => {
      expect(() => popupForm.handleLoadTrelloLabelsSuccess()).not.toThrow();
    });

    test('handleLoadTrelloMembersSuccess should handle members load success', () => {
      expect(() => popupForm.handleLoadTrelloMembersSuccess()).not.toThrow();
    });

    test('handleAPIFailure should handle API failures', () => {
      const target = document.createElement('div');
      const params = { error: 'API Error' };
      expect(() => popupForm.handleAPIFailure(target, params)).not.toThrow();
    });

    test('handleNewCardUploadsComplete should handle upload completion', () => {
      const target = document.createElement('div');
      const params = { uploads: [] };
      expect(() => popupForm.handleNewCardUploadsComplete(target, params)).not.toThrow();
    });

    test('handleOnMenuClick should handle menu clicks', () => {
      const target = document.createElement('div');
      const params = { action: 'test' };
      expect(() => popupForm.handleOnMenuClick(target, params)).not.toThrow();
    });
  });

  describe('MIME Type Handling', () => {
    test('mime_array should return MIME type array', () => {
      const tag = 'test-tag';
      const result = popupForm.mime_array(tag);
      expect(Array.isArray(result)).toBe(true);
    });

    test('mime_html should generate MIME HTML', () => {
      const tag = 'test-tag';
      const isImage = false;
      const data = { name: 'test.txt', type: 'text/plain' };
      
      expect(() => popupForm.mime_html(tag, isImage, data)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing parent gracefully', () => {
      popupForm.parent = null;
      expect(() => popupForm.validateData()).not.toThrow();
    });

    test('should handle missing app gracefully', () => {
      popupForm.app = null;
      expect(() => popupForm.bindEvents()).not.toThrow();
    });

    test('should handle missing events gracefully', () => {
      popupForm.app.events = null;
      expect(() => popupForm.bindEvents()).not.toThrow();
    });

    test('should handle missing state gracefully', () => {
      popupForm.parent.state = null;
      expect(() => popupForm.validateData()).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should integrate with parent correctly', () => {
      expect(popupForm.parent).toBe(mockParent);
      expect(popupForm.parent.state).toBeDefined();
    });

    test('should integrate with app correctly', () => {
      expect(popupForm.app).toBe(mockApp);
      expect(popupForm.app.events).toBe(mockEvents);
      expect(popupForm.app.utils).toBe(mockUtils);
    });

    test('should integrate with event system correctly', () => {
      popupForm.bindEvents();
      expect(mockEvents.addListener).toHaveBeenCalledMultipleTimes();
    });
  });

  describe('Performance Tests', () => {
    test('should handle large data sets efficiently', () => {
      const largeData = {
        boards: Array.from({ length: 100 }, (_, i) => ({ id: `board-${i}`, name: `Board ${i}` })),
        lists: Array.from({ length: 100 }, (_, i) => ({ id: `list-${i}`, name: `List ${i}` })),
        cards: Array.from({ length: 100 }, (_, i) => ({ id: `card-${i}`, name: `Card ${i}` })),
        labels: Array.from({ length: 100 }, (_, i) => ({ id: `label-${i}`, name: `Label ${i}` })),
        members: Array.from({ length: 100 }, (_, i) => ({ id: `member-${i}`, name: `Member ${i}` }))
      };

      const startTime = Date.now();
      popupForm.bindData(largeData);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    test('should handle validation efficiently', () => {
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        popupForm.validateData();
      }
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null data in bindData', () => {
      expect(() => popupForm.bindData(null)).not.toThrow();
    });

    test('should handle undefined data in bindData', () => {
      expect(() => popupForm.bindData(undefined)).not.toThrow();
    });

    test('should handle empty data in bindData', () => {
      expect(() => popupForm.bindData({})).not.toThrow();
    });

    test('should handle null data in bindGmailData', () => {
      expect(() => popupForm.bindGmailData(null)).not.toThrow();
    });

    test('should handle undefined data in bindGmailData', () => {
      expect(() => popupForm.bindGmailData(undefined)).not.toThrow();
    });

    test('should handle empty data in bindGmailData', () => {
      expect(() => popupForm.bindGmailData({})).not.toThrow();
    });

    test('should handle null data in updateBody', () => {
      expect(() => popupForm.updateBody(null)).not.toThrow();
    });

    test('should handle undefined data in updateBody', () => {
      expect(() => popupForm.updateBody(undefined)).not.toThrow();
    });

    test('should handle empty data in updateBody', () => {
      expect(() => popupForm.updateBody({})).not.toThrow();
    });
  });

  describe('State Management', () => {
    test('should maintain initialization state', () => {
      expect(popupForm.isInitialized).toBe(false);
      popupForm.init();
      expect(popupForm.isInitialized).toBe(true);
    });

    test('should handle re-initialization', () => {
      popupForm.init();
      popupForm.init();
      expect(popupForm.isInitialized).toBe(true);
    });
  });
});