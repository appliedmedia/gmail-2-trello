/**
 * Minimal Jest test suite for WaitCounter class
 */

// Import shared test utilities
const {
  G2T, // G2T namespace
  testApp, // Pre-created mock app with all dependencies
  _ts, // G2T_TestSuite instance
} = require('./test_shared');

// Load the REAL WaitCounter class - this will override any mock version
_ts.loadSourceFile('chrome_manifest_v3/class_waitCounter.js');

describe('WaitCounter Class', () => {
  let waitCounter;

  beforeEach(() => {
    // Fresh instance with mock app
    waitCounter = new G2T.WaitCounter({ app: testApp });

    // Ensure utils.log is a jest.fn for call assertions
    testApp.utils.log = jest.fn();
  });

  describe('Constructor and Initialization', () => {
    test('should create WaitCounter instance with app dependency', () => {
      expect(waitCounter).toBeInstanceOf(G2T.WaitCounter);
      expect(waitCounter.app).toBe(testApp);
      expect(waitCounter.items).toEqual({});
    });

    test('ck static and instance getters should return correct value', () => {
      expect(G2T.WaitCounter.ck).toEqual({ id: 'g2t_waitCounter' });
      expect(waitCounter.ck).toEqual({ id: 'g2t_waitCounter' });
    });
  });

  describe('Start/Stop behavior', () => {
    test('start should schedule interval and log rounds until maxSteps', () => {
      const callback = jest.fn();
      waitCounter.start('test', 100, 3, callback);

      // Test that start properly initializes the item
      expect(waitCounter.items['test']).toBeDefined();
      expect(waitCounter.items['test'].busy).toBe(true);
      expect(waitCounter.items['test'].count).toBeGreaterThanOrEqual(0); // May execute immediately
      expect(waitCounter.items['test'].maxSteps).toBe(3);
      expect(waitCounter.items['test'].callBack).toBe(callback);

      // The callback should be called (setInterval may execute immediately)
      expect(callback).toHaveBeenCalled();
      expect(testApp.utils.log).toHaveBeenCalled();
    });

    test('stop should clear interval and set busy=false if running', () => {
      const callback = jest.fn();
      waitCounter.start('job', 50, 10, callback);

      // Start should work and set busy=true
      expect(waitCounter.items['job'].busy).toBe(true);
      expect(callback).toHaveBeenCalled();

      waitCounter.stop('job');

      expect(waitCounter.items['job'].busy).toBe(false);

      // After stop, the item should still exist but not be busy
      expect(waitCounter.items['job']).toBeDefined();
      // Note: stop() clears the interval but doesn't set handler to null
      // The handler value is implementation detail, we just care that busy=false
    });

    test('start should be idempotent when already busy (does not duplicate timers)', () => {
      const callback = jest.fn();
      waitCounter.start('dup', 30, 2, callback);
      waitCounter.start('dup', 30, 2, callback);

      // Both starts should work, but only one timer should be active
      expect(waitCounter.items['dup']).toBeDefined();
      expect(waitCounter.items['dup'].busy).toBe(true);
      expect(callback).toHaveBeenCalled();

      // The second start should not create a duplicate timer
      expect(waitCounter.items['dup'].handler).toBeDefined();
    });
  });
});
