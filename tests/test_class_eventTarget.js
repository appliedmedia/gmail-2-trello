/**
 * Comprehensive Jest test suite for EventTarget class
 * Tests all methods and functionality of the EventTarget class
 */

// Import shared test utilities
const {
  G2T, // G2T namespace
  testApp, // Pre-created mock app with all dependencies
  _ts, // G2T_TestSuite instance
  debugOut,
} = require('./test_shared');

// Load the REAL EventTarget class - this will override the mock version
// The real EventTarget will use the mock dependencies from testApp
_ts.loadSourceFile('chrome_manifest_v3/class_eventTarget.js');

describe('EventTarget Class', () => {
  let eventTarget;

  beforeEach(() => {
    // Create a fresh real EventTarget instance with the pre-created mock dependencies
    // The real EventTarget class was loaded above, and will use mock dependencies from testApp
    eventTarget = new G2T.EventTarget({ app: testApp });

    // Clear all mocks
    _ts.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should create EventTarget instance with app dependency', () => {
      expect(eventTarget).toBeInstanceOf(window.G2T.EventTarget);
      expect(eventTarget.app).toBe(testApp);
    });

    test('should initialize with empty listeners object', () => {
      expect(eventTarget._listeners).toEqual({});
    });

    test('should handle constructor with no arguments', () => {
      const defaultEventTarget = new G2T.EventTarget({});
      expect(defaultEventTarget).toBeInstanceOf(window.G2T.EventTarget);
      expect(defaultEventTarget.app).toBeUndefined();
    });

    test('ck static getter should return correct value', () => {
      expect(window.G2T.EventTarget.ck).toEqual({ id: 'g2t_eventtarget' });
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

    test('removeListener should remove specific listener', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventTarget.addListener('testEvent', listener1);
      eventTarget.addListener('testEvent', listener2);
      eventTarget.removeListener('testEvent', listener1);

      expect(eventTarget._listeners.testEvent).toEqual([listener2]);
    });

    test('removeListener should handle non-existent listener', () => {
      const listener = jest.fn();
      eventTarget.addListener('testEvent', listener);
      eventTarget.removeListener('testEvent', jest.fn());

      expect(eventTarget._listeners.testEvent).toEqual([listener]);
    });

    test('removeListener should handle non-existent event type', () => {
      const listener = jest.fn();
      eventTarget.removeListener('nonExistentEvent', listener);

      expect(eventTarget._listeners.nonExistentEvent).toBeUndefined();
    });

    test('removeListener should remove all listeners for event type', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventTarget.addListener('testEvent', listener1);
      eventTarget.addListener('testEvent', listener2);
      eventTarget.removeListener('testEvent', listener1);
      eventTarget.removeListener('testEvent', listener2);

      expect(eventTarget._listeners.testEvent).toEqual([]);
    });
  });

  describe('Event Dispatching', () => {
    test('emit should call all listeners for event type', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const eventData = { message: 'test' };

      eventTarget.addListener('testEvent', listener1);
      eventTarget.addListener('testEvent', listener2);
      eventTarget.emit('testEvent', eventData);

      expect(listener1).toHaveBeenCalledWith({ type: 'testEvent', target: eventTarget }, eventData);
      expect(listener2).toHaveBeenCalledWith({ type: 'testEvent', target: eventTarget }, eventData);
    });

    test('emit should handle event type with no listeners', () => {
      expect(() => eventTarget.emit('noListenersEvent', {})).not.toThrow();
    });

    test('emit should pass event data to listeners', () => {
      const listener = jest.fn();
      const eventData = { id: 123, name: 'test' };

      eventTarget.addListener('testEvent', listener);
      eventTarget.emit('testEvent', eventData);

      expect(listener).toHaveBeenCalledWith({ type: 'testEvent', target: eventTarget }, eventData);
    });

    test('emit should handle multiple event types independently', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventTarget.addListener('event1', listener1);
      eventTarget.addListener('event2', listener2);

      eventTarget.emit('event1', { data: 'event1' });
      eventTarget.emit('event2', { data: 'event2' });

      expect(listener1).toHaveBeenCalledWith({ type: 'event1', target: eventTarget }, { data: 'event1' });
      expect(listener2).toHaveBeenCalledWith({ type: 'event2', target: eventTarget }, { data: 'event2' });
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    test('emit should handle event object with existing target', () => {
      const listener = jest.fn();
      const existingTarget = {};
      const event = { type: 'testEvent', target: existingTarget };

      eventTarget.addListener('testEvent', listener);
      eventTarget.emit(event);

      expect(listener).toHaveBeenCalledWith(event, undefined);
    });

    test('emit should throw error for event without type', () => {
      expect(() => eventTarget.emit({})).toThrow("Event object missing 'type' property.");
    });
  });



  describe('Integration Tests', () => {
    test('should integrate with app correctly', () => {
      expect(eventTarget.app).toBe(testApp);
      expect(eventTarget.app.utils).toBeDefined();
    });

    test('should handle complex event scenarios', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();

      // Add listeners to different events
      eventTarget.addListener('event1', listener1);
      eventTarget.addListener('event2', listener2);
      eventTarget.addListener('event2', listener3);

      // Emit events
      eventTarget.emit('event1', { data: 'event1' });
      eventTarget.emit('event2', { data: 'event2' });

      // Verify listeners were called
      expect(listener1).toHaveBeenCalledWith({ type: 'event1', target: eventTarget }, { data: 'event1' });
      expect(listener2).toHaveBeenCalledWith({ type: 'event2', target: eventTarget }, { data: 'event2' });
      expect(listener3).toHaveBeenCalledWith({ type: 'event2', target: eventTarget }, { data: 'event2' });

      // Remove one listener
      eventTarget.removeListener('event2', listener2);

      // Emit event again
      eventTarget.emit('event2', { data: 'event2_updated' });

      // Verify only remaining listener was called
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener3).toHaveBeenCalledWith({ type: 'event2', target: eventTarget }, { data: 'event2_updated' });
    });
  });

  describe('Error Handling', () => {
    test('should handle listener that throws error', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Test error');
      });
      const normalListener = jest.fn();

      eventTarget.addListener('testEvent', errorListener);
      eventTarget.addListener('testEvent', normalListener);

      // Should throw when listener throws error
      expect(() => eventTarget.emit('testEvent', {})).toThrow('Test error');
      expect(normalListener).not.toHaveBeenCalled();
    });

    test('should handle null or undefined listeners gracefully', () => {
      expect(() => eventTarget.addListener('testEvent', null)).not.toThrow();
      expect(() => eventTarget.addListener('testEvent', undefined)).not.toThrow();
    });
  });
});
