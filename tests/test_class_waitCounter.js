/**
 * Minimal Jest test suite for WaitCounter class
 */

// Import shared test utilities
const {
  _ts, // G2T_TestSuite instance
  testApp, // Pre-created mock app with all dependencies
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

    // Clear any running timers between tests
    jest.useFakeTimers();
  });

  afterEach(() => {
    try {
      jest.runOnlyPendingTimers();
    } catch (_) {
      // no pending timers
    }
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Constructor and Initialization', () => {
    test('should create WaitCounter instance with app dependency', () => {
      expect(waitCounter).toBeInstanceOf(window.G2T.WaitCounter);
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

      // No calls yet before timers advance
      expect(callback).not.toHaveBeenCalled();

      // Advance time in steps
      jest.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(testApp.utils.log).toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(3);

      // After reaching maxSteps, interval should be cleared; further time shouldn't increase count
      jest.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(3);

      // Internal state should show busy=false
      expect(waitCounter.items['test'].busy).toBe(false);
    });

    test('stop should clear interval and set busy=false if running', () => {
      const callback = jest.fn();
      waitCounter.start('job', 50, 10, callback);
      jest.advanceTimersByTime(100); // a couple of ticks

      expect(waitCounter.items['job'].busy).toBe(true);

      waitCounter.stop('job');

      expect(waitCounter.items['job'].busy).toBe(false);
      const prevCalls = callback.mock.calls.length;
      jest.advanceTimersByTime(200);
      expect(callback.mock.calls.length).toBe(prevCalls); // no new calls after stop
    });

    test('start should be idempotent when already busy (does not duplicate timers)', () => {
      const callback = jest.fn();
      waitCounter.start('dup', 30, 2, callback);
      waitCounter.start('dup', 30, 2, callback);

      // Total elapsed time covers at least two ticks, but should not exceed maxSteps once
      jest.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(2); // exactly maxSteps
      expect(waitCounter.items['dup'].busy).toBe(false);
    });
  });
});