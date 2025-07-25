/**
 * Comprehensive Jest test suite for EventTarget class
 * Tests all methods and functionality of the EventTarget class
 */

// Mock jQuery for testing
global.$ = jest.fn();

// Mock chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
  },
};

// Mock console for testing
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock G2T global object
global.G2T = {};

// Import the EventTarget class
const EventTarget = require('../chrome_manifest_v3/class_eventTarget.js');

describe('EventTarget Class', () => {
  let eventTarget;
  let mockApp;

  beforeEach(() => {
    // Create mock app
    mockApp = {
      utils: {
        log: jest.fn(),
      },
    };

    // Create a fresh EventTarget instance for each test
    eventTarget = new EventTarget({ app: mockApp });

    // Reset all mocks
    $.mockClear();
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
    chrome.runtime.sendMessage.mockClear();
    console.log.mockClear();
    console.error.mockClear();
    console.warn.mockClear();
  });

  describe('Constructor and Initialization', () => {
    test('should create EventTarget instance with app dependency', () => {
      expect(eventTarget).toBeInstanceOf(EventTarget);
      expect(eventTarget.app).toBe(mockApp);
    });

    test('should initialize with empty listeners object', () => {
      expect(eventTarget._listeners).toEqual({});
    });

    test('should handle constructor with no arguments', () => {
      const defaultEventTarget = new EventTarget();
      expect(defaultEventTarget).toBeInstanceOf(EventTarget);
      expect(defaultEventTarget.app).toBeUndefined();
    });

    test('ck static getter should return correct value', () => {
      expect(EventTarget.ck).toEqual({ id: 'g2t_eventtarget' });
    });

    test('ck getter should return correct value', () => {
      expect(eventTarget.ck).toEqual({ id: 'g2t_eventtarget' });
    });
  });

  describe('Event Listener Management', () => {
    test('addListener should add listener for new event type', () => {
      const listener = jest.fn();
      eventTarget.addListener('testEvent', listener);

      expect(eventTarget._listeners.testEvent).toEqual([listener]);
    });

    test('addListener should add listener to existing event type', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventTarget.addListener('testEvent', listener1);
      eventTarget.addListener('testEvent', listener2);

      expect(eventTarget._listeners.testEvent).toEqual([listener1, listener2]);
    });

    test('addListener should handle multiple event types', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventTarget.addListener('event1', listener1);
      eventTarget.addListener('event2', listener2);

      expect(eventTarget._listeners.event1).toEqual([listener1]);
      expect(eventTarget._listeners.event2).toEqual([listener2]);
    });

    test('addListener should handle same listener multiple times', () => {
      const listener = jest.fn();

      eventTarget.addListener('testEvent', listener);
      eventTarget.addListener('testEvent', listener);

      expect(eventTarget._listeners.testEvent).toEqual([listener, listener]);
    });
  });

  describe('Event Firing', () => {
    test('fire should call listeners for event type', () => {
      const listener = jest.fn();
      eventTarget.addListener('testEvent', listener);

      const event = { type: 'testEvent' };
      const params = { data: 'test' };

      eventTarget.fire(event, params);

      expect(listener).toHaveBeenCalledWith(event, params);
    });

    test('fire should call multiple listeners for same event type', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventTarget.addListener('testEvent', listener1);
      eventTarget.addListener('testEvent', listener2);

      const event = { type: 'testEvent' };
      const params = { data: 'test' };

      eventTarget.fire(event, params);

      expect(listener1).toHaveBeenCalledWith(event, params);
      expect(listener2).toHaveBeenCalledWith(event, params);
    });

    test('fire should handle string event type', () => {
      const listener = jest.fn();
      eventTarget.addListener('testEvent', listener);

      const params = { data: 'test' };

      eventTarget.fire('testEvent', params);

      expect(listener).toHaveBeenCalledWith(
        { type: 'testEvent', target: eventTarget },
        params
      );
    });

    test('fire should set target on event object', () => {
      const listener = jest.fn();
      eventTarget.addListener('testEvent', listener);

      const event = { type: 'testEvent' };

      eventTarget.fire(event);

      expect(event.target).toBe(eventTarget);
    });

    test('fire should not override existing target', () => {
      const listener = jest.fn();
      eventTarget.addListener('testEvent', listener);

      const existingTarget = {};
      const event = { type: 'testEvent', target: existingTarget };

      eventTarget.fire(event);

      expect(event.target).toBe(existingTarget);
    });

    test('fire should throw error for event without type', () => {
      const event = {};

      expect(() => eventTarget.fire(event)).toThrow(
        "Event object missing 'type' property."
      );
    });

    test('fire should handle falsy event type', () => {
      const event = { type: '' };

      expect(() => eventTarget.fire(event)).toThrow(
        "Event object missing 'type' property."
      );
    });

    test('fire should handle null event type', () => {
      const event = { type: null };

      expect(() => eventTarget.fire(event)).toThrow(
        "Event object missing 'type' property."
      );
    });

    test('fire should handle undefined event type', () => {
      const event = { type: undefined };

      expect(() => eventTarget.fire(event)).toThrow(
        "Event object missing 'type' property."
      );
    });

    test('fire should handle event type with no listeners', () => {
      const event = { type: 'noListeners' };

      expect(() => eventTarget.fire(event)).not.toThrow();
    });

    test('fire should call listeners with correct context', () => {
      const listener = jest.fn();
      eventTarget.addListener('testEvent', listener);

      const event = { type: 'testEvent' };

      eventTarget.fire(event);

      expect(listener).toHaveBeenCalledWith(event, undefined);
      expect(listener.mock.instances[0]).toBe(eventTarget);
    });
  });

  describe('Event Listener Removal', () => {
    test('removeListener should remove specific listener', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventTarget.addListener('testEvent', listener1);
      eventTarget.addListener('testEvent', listener2);

      eventTarget.removeListener('testEvent', listener1);

      expect(eventTarget._listeners.testEvent).toEqual([listener2]);
    });

    test('removeListener should remove first occurrence of duplicate listener', () => {
      const listener = jest.fn();

      eventTarget.addListener('testEvent', listener);
      eventTarget.addListener('testEvent', listener);

      eventTarget.removeListener('testEvent', listener);

      expect(eventTarget._listeners.testEvent).toEqual([listener]);
    });

    test('removeListener should handle non-existent listener', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventTarget.addListener('testEvent', listener1);
      eventTarget.removeListener('testEvent', listener2);

      expect(eventTarget._listeners.testEvent).toEqual([listener1]);
    });

    test('removeListener should handle non-existent event type', () => {
      const listener = jest.fn();

      expect(() =>
        eventTarget.removeListener('nonExistent', listener)
      ).not.toThrow();
    });

    test('removeListener should handle empty listeners array', () => {
      const listener = jest.fn();

      eventTarget._listeners.testEvent = [];
      eventTarget.removeListener('testEvent', listener);

      expect(eventTarget._listeners.testEvent).toEqual([]);
    });
  });

  describe('Complex Event Scenarios', () => {
    test('should handle multiple event types with multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();

      eventTarget.addListener('event1', listener1);
      eventTarget.addListener('event1', listener2);
      eventTarget.addListener('event2', listener3);

      eventTarget.fire('event1', { data: 'event1' });
      eventTarget.fire('event2', { data: 'event2' });

      expect(listener1).toHaveBeenCalledWith(
        { type: 'event1', target: eventTarget },
        { data: 'event1' }
      );
      expect(listener2).toHaveBeenCalledWith(
        { type: 'event1', target: eventTarget },
        { data: 'event1' }
      );
      expect(listener3).toHaveBeenCalledWith(
        { type: 'event2', target: eventTarget },
        { data: 'event2' }
      );
    });

    test('should handle adding and removing listeners dynamically', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventTarget.addListener('testEvent', listener1);
      eventTarget.fire('testEvent');

      eventTarget.addListener('testEvent', listener2);
      eventTarget.fire('testEvent');

      eventTarget.removeListener('testEvent', listener1);
      eventTarget.fire('testEvent');

      expect(listener1).toHaveBeenCalledTimes(2);
      expect(listener2).toHaveBeenCalledTimes(2);
    });

    test('should handle listeners that modify event object', () => {
      const listener = jest.fn(event => {
        event.modified = true;
      });

      eventTarget.addListener('testEvent', listener);

      const event = { type: 'testEvent' };
      eventTarget.fire(event);

      expect(listener).toHaveBeenCalledWith(event, undefined);
      expect(event.modified).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle listeners that throw errors', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = jest.fn();

      eventTarget.addListener('testEvent', errorListener);
      eventTarget.addListener('testEvent', normalListener);

      expect(() => eventTarget.fire('testEvent')).toThrow('Listener error');
      expect(normalListener).not.toHaveBeenCalled();
    });

    test('should handle null listener in addListener', () => {
      expect(() => eventTarget.addListener('testEvent', null)).not.toThrow();
      expect(eventTarget._listeners.testEvent).toEqual([null]);
    });

    test('should handle undefined listener in addListener', () => {
      expect(() =>
        eventTarget.addListener('testEvent', undefined)
      ).not.toThrow();
      expect(eventTarget._listeners.testEvent).toEqual([undefined]);
    });

    test('should handle non-function listener in addListener', () => {
      expect(() =>
        eventTarget.addListener('testEvent', 'not a function')
      ).not.toThrow();
      expect(eventTarget._listeners.testEvent).toEqual(['not a function']);
    });
  });

  describe('Performance Tests', () => {
    test('should handle many listeners efficiently', () => {
      const listeners = Array.from({ length: 100 }, () => jest.fn());

      const startTime = Date.now();
      listeners.forEach(listener => {
        eventTarget.addListener('testEvent', listener);
      });
      const addTime = Date.now();

      eventTarget.fire('testEvent');
      const fireTime = Date.now();

      expect(addTime - startTime).toBeLessThan(100); // Should add within 100ms
      expect(fireTime - addTime).toBeLessThan(100); // Should fire within 100ms
      expect(listeners.every(listener => listener.mock.calls.length > 0)).toBe(
        true
      );
    });

    test('should handle many event types efficiently', () => {
      const eventTypes = Array.from({ length: 50 }, (_, i) => `event${i}`);
      const listener = jest.fn();

      const startTime = Date.now();
      eventTypes.forEach(type => {
        eventTarget.addListener(type, listener);
      });
      const addTime = Date.now();

      eventTypes.forEach(type => {
        eventTarget.fire(type);
      });
      const fireTime = Date.now();

      expect(addTime - startTime).toBeLessThan(100);
      expect(fireTime - addTime).toBeLessThan(100);
      expect(listener).toHaveBeenCalledTimes(50);
    });
  });

  describe('Integration Tests', () => {
    test('should integrate with app correctly', () => {
      expect(eventTarget.app).toBe(mockApp);
      expect(eventTarget.app.utils).toBeDefined();
    });

    test('should work with G2T namespace', () => {
      expect(G2T.EventTarget).toBe(EventTarget);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty string event type', () => {
      const listener = jest.fn();
      eventTarget.addListener('', listener);

      expect(() => eventTarget.fire('')).toThrow(
        "Event object missing 'type' property."
      );
    });

    test('should handle numeric event type', () => {
      const listener = jest.fn();
      eventTarget.addListener(123, listener);

      expect(() => eventTarget.fire(123)).toThrow(
        "Event object missing 'type' property."
      );
    });

    test('should handle object event type', () => {
      const listener = jest.fn();
      eventTarget.addListener({}, listener);

      expect(() => eventTarget.fire({})).toThrow(
        "Event object missing 'type' property."
      );
    });

    test('should handle listeners that return values', () => {
      const listener = jest.fn(() => 'return value');
      eventTarget.addListener('testEvent', listener);

      expect(() => eventTarget.fire('testEvent')).not.toThrow();
      expect(listener).toHaveBeenCalled();
    });

    test('should handle listeners that are async functions', () => {
      const asyncListener = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      eventTarget.addListener('testEvent', asyncListener);

      expect(() => eventTarget.fire('testEvent')).not.toThrow();
      expect(asyncListener).toHaveBeenCalled();
    });
  });

  describe('Memory Management', () => {
    test('should not leak memory when removing listeners', () => {
      const listener = jest.fn();

      eventTarget.addListener('testEvent', listener);
      expect(eventTarget._listeners.testEvent).toHaveLength(1);

      eventTarget.removeListener('testEvent', listener);
      expect(eventTarget._listeners.testEvent).toHaveLength(0);
    });

    test('should handle circular references in event objects', () => {
      const listener = jest.fn();
      eventTarget.addListener('testEvent', listener);

      const event = { type: 'testEvent' };
      event.self = event; // Circular reference

      expect(() => eventTarget.fire(event)).not.toThrow();
      expect(listener).toHaveBeenCalledWith(event, undefined);
    });
  });
});
