/**
 * Comprehensive Jest test suite for Model class
 * Tests all methods and functionality of the Model class using data-driven patterns
 */

// Import shared test utilities
const { _ts, testApp } = require('./test_shared');

// Load the REAL Trel class first - this will override the mock version
// The real Trel will use the mock dependencies from testApp
_ts.loadSourceFile('chrome_manifest_v3/class_trel.js');

// Load the REAL Model class - this will override the mock version
// The real Model will use the mock dependencies from testApp
_ts.loadSourceFile('chrome_manifest_v3/class_model.js');

// Data-driven test cases for authorization scenarios
const authorizationTests = [
  {
    name: 'successful authorization',
    data: { authorized: true },
    expectedAuthorized: true,
    method: 'checkTrelloAuthorized_success',
  },
  {
    name: 'failed authorization',
    data: { authorized: false },
    expectedAuthorized: false,
    method: 'checkTrelloAuthorized_failure',
  },
  {
    name: 'popup failure',
    data: { authorized: false },
    expectedAuthorized: false,
    method: 'checkTrelloAuthorized_popup_failure',
  },
];

// Data-driven test cases for user data scenarios
const userDataTests = [
  {
    name: 'valid user data',
    data: { id: '123', fullName: 'Test User', username: 'testuser' },
    expectedUser: { id: '123', fullName: 'Test User', username: 'testuser' },
  },
  {
    name: 'minimal user data',
    data: { id: '456', fullName: 'Minimal User' },
    expectedUser: { id: '456', fullName: 'Minimal User' },
  },
  {
    name: 'empty user data',
    data: {},
    expectedUser: {},
  },
];

// Data-driven test cases for boards data scenarios
const boardsDataTests = [
  {
    name: 'single board',
    data: [{ id: '1', name: 'Board 1', closed: false }],
    expectedBoards: [{ id: '1', name: 'Board 1', closed: false }],
  },
  {
    name: 'multiple boards',
    data: [
      { id: '1', name: 'Board 1', closed: false },
      { id: '2', name: 'Board 2', closed: false },
      { id: '3', name: 'Board 3', closed: true },
    ],
    expectedBoards: [
      { id: '1', name: 'Board 1', closed: false },
      { id: '2', name: 'Board 2', closed: false },
      { id: '3', name: 'Board 3', closed: true },
    ],
  },
  {
    name: 'empty boards array',
    data: [],
    expectedBoards: [],
  },
];

// Data-driven test cases for lists data scenarios
const listsDataTests = [
  {
    name: 'single list',
    data: [{ id: '1', name: 'List 1', idBoard: 'board1' }],
    expectedLists: [{ id: '1', name: 'List 1', idBoard: 'board1' }],
  },
  {
    name: 'multiple lists',
    data: [
      { id: '1', name: 'To Do', idBoard: 'board1' },
      { id: '2', name: 'In Progress', idBoard: 'board1' },
      { id: '3', name: 'Done', idBoard: 'board1' },
    ],
    expectedLists: [
      { id: '1', name: 'To Do', idBoard: 'board1' },
      { id: '2', name: 'In Progress', idBoard: 'board1' },
      { id: '3', name: 'Done', idBoard: 'board1' },
    ],
  },
  {
    name: 'empty lists',
    data: [],
    expectedLists: [],
  },
];

// Data-driven test cases for cards data scenarios
const cardsDataTests = [
  {
    name: 'single card',
    data: [{ id: '1', name: 'Card 1', idList: 'list1' }],
    expectedCards: [{ id: '1', name: 'Card 1', idList: 'list1' }],
  },
  {
    name: 'multiple cards',
    data: [
      { id: '1', name: 'Task 1', idList: 'list1' },
      { id: '2', name: 'Task 2', idList: 'list1' },
      { id: '3', name: 'Task 3', idList: 'list1' },
    ],
    expectedCards: [
      { id: '1', name: 'Task 1', idList: 'list1' },
      { id: '2', name: 'Task 2', idList: 'list1' },
      { id: '3', name: 'Task 3', idList: 'list1' },
    ],
  },
  {
    name: 'empty cards',
    data: [],
    expectedCards: [],
  },
];

// Data-driven test cases for members data scenarios
const membersDataTests = [
  {
    name: 'single member',
    data: [{ id: '1', fullName: 'John Doe', username: 'johndoe' }],
    expectedMembers: [{ id: '1', fullName: 'John Doe', username: 'johndoe' }],
  },
  {
    name: 'multiple members',
    data: [
      { id: '1', fullName: 'John Doe', username: 'johndoe' },
      { id: '2', fullName: 'Jane Smith', username: 'janesmith' },
      { id: '3', fullName: 'Bob Johnson', username: 'bobjohnson' },
    ],
    expectedMembers: [
      { id: '1', fullName: 'John Doe', username: 'johndoe' },
      { id: '2', fullName: 'Jane Smith', username: 'janesmith' },
      { id: '3', fullName: 'Bob Johnson', username: 'bobjohnson' },
    ],
  },
  {
    name: 'empty members',
    data: [],
    expectedMembers: [],
  },
];

// Data-driven test cases for labels data scenarios
const labelsDataTests = [
  {
    name: 'single label',
    data: [{ id: '1', name: 'Bug', color: 'red' }],
    expectedLabels: [{ id: '1', name: 'Bug', color: 'red' }],
  },
  {
    name: 'multiple labels',
    data: [
      { id: '1', name: 'Bug', color: 'red' },
      { id: '2', name: 'Feature', color: 'green' },
      { id: '3', name: 'Enhancement', color: 'blue' },
    ],
    expectedLabels: [
      { id: '1', name: 'Bug', color: 'red' },
      { id: '2', name: 'Feature', color: 'green' },
      { id: '3', name: 'Enhancement', color: 'blue' },
    ],
  },
  {
    name: 'empty labels',
    data: [],
    expectedLabels: [],
  },
];

// Data-driven test cases for card submission scenarios
const cardSubmissionTests = [
  {
    name: 'basic card data',
    data: {
      title: 'Test Card',
      description: 'Test Description',
      listId: 'test-list-id',
    },
    shouldThrow: false,
  },
  {
    name: 'card with attachments',
    data: {
      title: 'Card with Attachments',
      description: 'Description with files',
      listId: 'test-list-id',
      attachments: [{ name: 'test.txt', value: 'test-content' }],
    },
    shouldThrow: false,
  },
  {
    name: 'card with members',
    data: {
      title: 'Card with Members',
      description: 'Description with members',
      listId: 'test-list-id',
      members: ['member1', 'member2'],
    },
    shouldThrow: false,
  },
  {
    name: 'card with labels',
    data: {
      title: 'Card with Labels',
      description: 'Description with labels',
      listId: 'test-list-id',
      labels: ['label1', 'label2'],
    },
    shouldThrow: false,
  },
  {
    name: 'empty card data',
    data: {},
    shouldThrow: false,
  },
  {
    name: 'null card data',
    data: null,
    shouldThrow: false,
  },
];

// Data-driven test cases for email mapping scenarios
const emailMappingTests = [
  {
    name: 'existing mapping',
    keyValue: { email: 'test@example.com' },
    existingMap: [
      {
        email: 'test@example.com',
        boardId: 123,
        listId: 456,
        cardId: 789,
        timestamp: Date.now(),
      },
    ],
    expectedResult: {
      email: 'test@example.com',
      boardId: 123,
      listId: 456,
      cardId: 789,
    },
  },
  {
    name: 'new mapping',
    keyValue: {
      email: 'new@example.com',
      boardId: 999,
      listId: 888,
      cardId: 777,
    },
    existingMap: [],
    expectedResult: {
      email: 'new@example.com',
      boardId: 999,
      listId: 888,
      cardId: 777,
    },
  },
  {
    name: 'update existing mapping',
    keyValue: {
      email: 'update@example.com',
      boardId: 'new-board',
      listId: 'new-list',
    },
    existingMap: [
      {
        email: 'update@example.com',
        boardId: 'old-board',
        listId: 'old-list',
        timestamp: Date.now(),
      },
    ],
    expectedResult: {
      email: 'update@example.com',
      boardId: 'new-board',
      listId: 'new-list',
      cardId: 0, // Default value when not provided
    },
  },
];

// Data-driven test cases for error handling scenarios
const errorHandlingTests = [
  {
    name: 'null input',
    input: null,
    method: 'submit',
    shouldThrow: false,
  },
  {
    name: 'undefined input',
    input: undefined,
    method: 'submit',
    shouldThrow: false,
  },
  {
    name: 'empty object',
    input: {},
    method: 'submit',
    shouldThrow: false,
  },
  {
    name: 'null input for createCard',
    input: null,
    method: 'createCard',
    shouldThrow: true,
  },
  {
    name: 'undefined input for uploadAttachment',
    input: undefined,
    method: 'uploadAttachment',
    shouldThrow: false,
  },
];

// Data-driven test cases for performance scenarios
const performanceTests = [
  {
    name: 'large boards dataset',
    dataSize: 100,
    dataType: 'boards',
    methodName: 'loadTrelloBoards_success',
    maxDuration: 100,
  },
  {
    name: 'large lists dataset',
    dataSize: 50,
    dataType: 'lists',
    methodName: 'loadTrelloLists_success',
    maxDuration: 50,
  },
  {
    name: 'large cards dataset',
    dataSize: 200,
    dataType: 'cards',
    methodName: 'loadTrelloCards_success',
    maxDuration: 100,
  },
  {
    name: 'large members dataset',
    dataSize: 75,
    dataType: 'members',
    methodName: 'loadTrelloMembers_success',
    maxDuration: 75,
  },
  {
    name: 'large labels dataset',
    dataSize: 25,
    dataType: 'labels',
    methodName: 'loadTrelloLabels_success',
    maxDuration: 25,
  },
];

describe('Model Class', () => {
  let model;

  beforeEach(() => {
    // Create a fresh real Model instance with the pre-created mock app
    // The real Model class was loaded above, overriding the mock version
    // Model constructor expects { parent, app } where parent is a Trel instance
    const mockTrel = new G2T.Trel({ app: testApp });
    model = new G2T.Model({ parent: mockTrel, app: testApp });

    // Clear all mocks
    _ts.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    // Data-driven tests for constructor properties
    const constructorTests = {
      'app reference': {
        property: 'app',
        expected: testApp,
      },
      'parent reference': {
        property: 'parent',
        expected: expect.any(G2T.Trel),
      },
      'trel property': {
        property: 'trel',
        expected: expect.any(G2T.Trel),
      },
      'emailBoardListCardMap property': {
        property: 'emailBoardListCardMap',
        expected: expect.any(Object),
      },
    };

    Object.entries(constructorTests).forEach(
      ([testName, { property, expected }]) => {
        test(`should have correct ${testName}`, () => {
          expect(model[property]).toStrictEqual(expected);
        });
      },
    );

    // Data-driven tests for static and instance ck properties
    const ckTests = [
      {
        name: 'static ck.id',
        accessor: () => G2T.Model.ck.id,
        expected: 'g2t_model',
      },
      {
        name: 'instance ck.id',
        accessor: () => model.ck.id,
        expected: 'g2t_model',
      },
    ];

    ckTests.forEach(({ name, accessor, expected }) => {
      test(`should have correct ${name}`, () => {
        expect(accessor()).toBe(expected);
      });
    });

    test('should initialize with default state', () => {
      // Data-driven test using centralized expected values
      const expectedDefaults = {
        'app.persist.trelloAuthorized': false,
        'app.temp.boards': [],
        'app.temp.lists': [],
        'app.temp.cards': [],
        'app.temp.members': [],
        'app.temp.labels': [],
      };

      Object.entries(expectedDefaults).forEach(([path, expected]) => {
        const value = path.split('.').reduce((obj, key) => obj[key], model);
        expect(value).toEqual(expected);
      });
    });

    test('init should initialize the model', () => {
      expect(() => model.init()).not.toThrow();
    });
  });

  describe('Trello Authorization', () => {
    test('checkTrelloAuthorized should check authorization status', () => {
      expect(() => model.checkTrelloAuthorized()).not.toThrow();
    });

    // Data-driven tests for authorization scenarios
    authorizationTests.forEach(({ name, data, expectedAuthorized, method }) => {
      test(`${method} should handle ${name}`, () => {
        // Reset authorization state before each test
        model.app.persist.trelloAuthorized = false;
        model[method](data);
        expect(model.app.persist.trelloAuthorized).toBe(expectedAuthorized);
      });
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

    // Data-driven tests for user data scenarios
    userDataTests.forEach(({ name, data, expectedUser }) => {
      test(`loadTrelloUser_success should handle ${name}`, () => {
        model.loadTrelloUser_success(data);
        expect(model.app.persist.user).toEqual(expectedUser);
      });
    });

    test('loadTrelloBoards should load Trello boards data', () => {
      expect(() => model.loadTrelloBoards()).not.toThrow();
    });

    // Data-driven tests for boards data scenarios
    boardsDataTests.forEach(({ name, data, expectedBoards }) => {
      test(`loadTrelloBoards_success should handle ${name}`, () => {
        model.loadTrelloBoards_success(data);
        expect(model.app.temp.boards).toEqual(expectedBoards);
      });
    });

    test('loadTrelloUser_failure should handle user loading failure', () => {
      const data = { error: 'Failed to load user data' };
      expect(() => model.loadTrelloUser_failure(data)).not.toThrow();
    });

    test('loadTrelloBoards_failure should handle boards loading failure', () => {
      const data = { error: 'Failed to load boards data' };
      expect(() => model.loadTrelloBoards_failure(data)).not.toThrow();
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

    // Data-driven tests for lists data scenarios
    listsDataTests.forEach(({ name, data, expectedLists }) => {
      test(`loadTrelloLists_success should handle ${name}`, () => {
        model.loadTrelloLists_success(data);
        expect(model.app.temp.lists).toEqual(expectedLists);
      });
    });

    test('loadTrelloLists_failure should handle lists loading failure', () => {
      const data = { error: 'Failed to load lists' };
      expect(() => model.loadTrelloLists_failure(data)).not.toThrow();
    });
  });

  describe('Trello Cards Loading', () => {
    test('loadTrelloCards should load cards for a list', () => {
      const listId = 'test-list-id';
      expect(() => model.loadTrelloCards(listId)).not.toThrow();
    });

    // Data-driven tests for cards data scenarios
    cardsDataTests.forEach(({ name, data, expectedCards }) => {
      test(`loadTrelloCards_success should handle ${name}`, () => {
        model.loadTrelloCards_success(data);
        expect(model.app.temp.cards).toEqual(expectedCards);
      });
    });

    test('loadTrelloCards_failure should handle cards loading failure', () => {
      const data = { error: 'Failed to load cards' };
      expect(() => model.loadTrelloCards_failure(data)).not.toThrow();
    });
  });

  describe('Trello Members Loading', () => {
    test('loadTrelloMembers should load members for a board', () => {
      const boardId = 'test-board-id';
      expect(() => model.loadTrelloMembers(boardId)).not.toThrow();
    });

    // Data-driven tests for members data scenarios
    membersDataTests.forEach(({ name, data, expectedMembers }) => {
      test(`loadTrelloMembers_success should handle ${name}`, () => {
        model.loadTrelloMembers_success(data);
        expect(model.app.temp.members).toEqual(expectedMembers);
      });
    });

    test('loadTrelloMembers_failure should handle members loading failure', () => {
      const data = { error: 'Failed to load members' };
      expect(() => model.loadTrelloMembers_failure(data)).not.toThrow();
    });
  });

  describe('Trello Labels Loading', () => {
    test('loadTrelloLabels should load labels for a board', () => {
      const boardId = 'test-board-id';
      expect(() => model.loadTrelloLabels(boardId)).not.toThrow();
    });

    // Data-driven tests for labels data scenarios
    labelsDataTests.forEach(({ name, data, expectedLabels }) => {
      test(`loadTrelloLabels_success should handle ${name}`, () => {
        model.loadTrelloLabels_success(data);
        expect(model.app.temp.labels).toEqual(expectedLabels);
      });
    });

    test('loadTrelloLabels_failure should handle labels loading failure', () => {
      const data = { error: 'Failed to load labels' };
      expect(() => model.loadTrelloLabels_failure(data)).not.toThrow();
    });
  });

  describe('Card Creation and Submission', () => {
    // Data-driven tests for card submission scenarios
    cardSubmissionTests.forEach(({ name, data, shouldThrow }) => {
      test(`submit should handle ${name}`, () => {
        // Mock Trello authorization
        model.app.persist.trelloAuthorized = true;

        if (shouldThrow) {
          expect(() => model.submit(data)).toThrow();
        } else {
          expect(() => model.submit(data)).not.toThrow();
        }
      });
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
    test('emailBoardListCardMapLookup should handle existing mapping', () => {
      // Set up existing mapping
      const existingMap = [
        {
          email: 'test@example.com',
          boardId: 123,
          listId: 456,
          cardId: 789,
          timestamp: Date.now(),
        },
      ];
      model.app.persist.emailBoardListCardMap = existingMap;

      const result = model.emailBoardListCardMapLookup({ email: 'test@example.com' });
      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(result.boardId).toBe(123);
      expect(result.listId).toBe(456);
      expect(result.cardId).toBe(789);
    });

    test('emailBoardListCardMapUpdate should add new mapping', () => {
      // Start with empty map
      model.app.persist.emailBoardListCardMap = [];

      const keyValue = {
        email: 'new@example.com',
        boardId: 999,
        listId: 888,
        cardId: 777,
      };

      expect(() => model.emailBoardListCardMapUpdate(keyValue)).not.toThrow();
      
      // Verify the mapping was added
      const result = model.emailBoardListCardMapLookup({ email: 'new@example.com' });
      expect(result).toBeDefined();
      expect(result.email).toBe('new@example.com');
      expect(result.boardId).toBe(999);
      expect(result.listId).toBe(888);
      expect(result.cardId).toBe(777);
    });

    test('emailBoardListCardMapUpdate should add new mapping even if email exists', () => {
      // Set up existing mapping
      const existingMap = [
        {
          email: 'update@example.com',
          boardId: 'old-board',
          listId: 'old-list',
          timestamp: Date.now(),
        },
      ];
      model.app.persist.emailBoardListCardMap = existingMap;

      const keyValue = {
        email: 'update@example.com',
        boardId: 'new-board',
        listId: 'new-list',
      };

      expect(() => model.emailBoardListCardMapUpdate(keyValue)).not.toThrow();
      
      // Verify that a new entry was added (the map doesn't update existing entries)
      const results = model.app.persist.emailBoardListCardMap.filter(
        entry => entry.email === 'update@example.com'
      );
      expect(results.length).toBe(2); // Should have both old and new entries
      
      // The lookup should return the first match (old entry)
      const result = model.emailBoardListCardMapLookup({ email: 'update@example.com' });
      expect(result).toBeDefined();
      expect(result.email).toBe('update@example.com');
      expect(result.boardId).toBe('old-board'); // First match in the array
      expect(result.listId).toBe('old-list');
    });
  });

  describe('Event Handling', () => {
    // Data-driven tests for event handling scenarios
    const eventHandlingTests = [
      {
        name: 'state loaded event',
        method: 'handleClassModelStateLoaded',
        event: { type: 'stateLoaded' },
        params: { data: 'test-data' },
      },
      {
        name: 'form submission',
        method: 'handleSubmittedFormShownComplete',
        target: { id: 'test-form' },
        params: { data: 'test-data' },
      },
      {
        name: 'upload completion',
        method: 'handlePostCardCreateUploadDisplayDone',
        target: { id: 'test-upload' },
        params: { data: 'test-data' },
      },
      {
        name: 'board change',
        method: 'handleBoardChanged',
        target: { id: 'test-board' },
        params: { boardId: 'test-board-id' },
      },
      {
        name: 'list change',
        method: 'handleListChanged',
        target: { id: 'test-list' },
        params: { listId: 'test-list-id' },
      },
    ];

    eventHandlingTests.forEach(({ name, method, event, target, params }) => {
      test(`${method} should handle ${name}`, () => {
        if (event) {
          expect(() => model[method](event, params)).not.toThrow();
        } else {
          expect(() => model[method](target, params)).not.toThrow();
        }
      });
    });

    test('bindEvents should bind event listeners', () => {
      expect(() => model.bindEvents()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    // Data-driven tests for error handling scenarios
    errorHandlingTests.forEach(({ name, input, method, shouldThrow }) => {
      test(`should handle ${name} for ${method}`, () => {
        if (shouldThrow) {
          expect(() => model[method](input)).toThrow();
        } else {
          expect(() => model[method](input)).not.toThrow();
        }
      });
    });
  });

  describe('Performance Tests', () => {
    // Data-driven tests for performance scenarios
    performanceTests.forEach(({ name, dataSize, dataType, methodName, maxDuration }) => {
      test(`should handle ${name} efficiently`, () => {
        const largeData = Array.from({ length: dataSize }, (_, i) => ({
          id: `${dataType}-${i}`,
          name: `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} ${i}`,
        }));

        const startTime = Date.now();
        
        // Call the appropriate success method
        expect(model[methodName]).toBeDefined();
        model[methodName](largeData);
        
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Verify the data was set correctly
        const expectedProperty = `app.temp.${dataType}`;
        const actualData = expectedProperty.split('.').reduce((obj, key) => obj[key], model);
        expect(actualData).toEqual(largeData);
        
        // Performance check
        expect(duration).toBeLessThan(maxDuration);
      });
    });

    test('should handle many event handlers efficiently', () => {
      const startTime = Date.now();
      expect(() => model.bindEvents()).not.toThrow();
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(50); // Should bind events quickly
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete workflow from authorization to card creation', () => {
      // Step 1: Authorize
      model.checkTrelloAuthorized_success({ authorized: true });
      expect(model.app.persist.trelloAuthorized).toBe(true);

      // Step 2: Load user
      model.loadTrelloUser_success({ id: '123', fullName: 'Test User' });
      expect(model.app.persist.user).toEqual({ id: '123', fullName: 'Test User' });

      // Step 3: Load boards
      model.loadTrelloBoards_success([{ id: '1', name: 'Test Board' }]);
      expect(model.app.temp.boards).toEqual([{ id: '1', name: 'Test Board' }]);

      // Step 4: Load lists
      model.loadTrelloLists_success([{ id: '1', name: 'Test List' }]);
      expect(model.app.temp.lists).toEqual([{ id: '1', name: 'Test List' }]);

      // Step 5: Create card
      const cardData = { title: 'Test Card', description: 'Test Description', listId: '1' };
      expect(() => model.submit(cardData)).not.toThrow();
    });

    test('should handle error recovery gracefully', () => {
      // Simulate a failure scenario
      model.loadTrelloBoards_failure({ error: 'Network error' });
      // Note: failure doesn't clear the boards array, it just emits an error event

      // Should be able to retry
      model.loadTrelloBoards_success([{ id: '1', name: 'Recovery Board' }]);
      expect(model.app.temp.boards).toEqual([{ id: '1', name: 'Recovery Board' }]);
    });
  });
});
