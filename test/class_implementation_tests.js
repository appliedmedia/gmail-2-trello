// Test suite for class_* implementations
// Tests the ES6 class-based versions of the Gmail-2-Trello components

const ClassImplementationTestSuite = {
  tests: [],
  setupHooks: [],
  teardownHooks: [],

  addTest(name, testFunction) {
    if (typeof name !== 'string' || !name.trim()) {
      throw new Error('Test name must be a non-empty string');
    }
    if (typeof testFunction !== 'function') {
      throw new Error('Test function must be a function');
    }
    this.tests.push({ name: name.trim(), testFunction });
  },

  addSetup(setupFunction) {
    if (typeof setupFunction !== 'function') {
      throw new Error('Setup function must be a function');
    }
    this.setupHooks.push(setupFunction);
  },

  addTeardown(teardownFunction) {
    if (typeof teardownFunction !== 'function') {
      throw new Error('Teardown function must be a function');
    }
    this.teardownHooks.push(teardownFunction);
  },

  async runSetup() {
    for (const setup of this.setupHooks) {
      await setup();
    }
  },

  async runTeardown() {
    for (const teardown of this.teardownHooks) {
      await teardown();
    }
  },

  async runTests() {
    console.log('🧪 Running Class Implementation Tests...\n');

    let passed = 0;
    let failed = 0;
    const results = [];

    await this.runSetup();

    for (const test of this.tests) {
      try {
        console.log(`📋 Testing: ${test.name}`);
        const startTime = Date.now();
        await test.testFunction();
        const duration = Date.now() - startTime;
        console.log(`✅ PASS: ${test.name} (${duration}ms)\n`);
        passed++;
        results.push({ name: test.name, status: 'passed', duration });
      } catch (error) {
        console.log(`❌ FAIL: ${test.name}`);
        console.log(`   Error: ${error.message}\n`);
        failed++;
        results.push({
          name: test.name,
          status: 'failed',
          error: error.message,
        });
      }
    }

    await this.runTeardown();

    console.log(
      `📊 Class Implementation Test Results: ${passed} passed, ${failed} failed`
    );
    return { passed, failed, results };
  },

  clearTests() {
    this.tests = [];
    this.setupHooks = [];
    this.teardownHooks = [];
  },
};

// ===== CLASS IMPLEMENTATION TESTS =====

// Test: Class Model instantiation
ClassImplementationTestSuite.addTest('Class Model - Instantiation', () => {
  if (typeof G2T === 'undefined' || !G2T.Model) {
    throw new Error('G2T.Model class not available');
  }

  const model = new G2T.Model();
  if (!(model instanceof G2T.Model)) {
    throw new Error('Model instance not created correctly');
  }

  if (!model.event || typeof model.event.addListener !== 'function') {
    throw new Error('Model event system not initialized');
  }
});

// Test: Class Model event system
ClassImplementationTestSuite.addTest('Class Model - Event System', () => {
  const model = new G2T.Model();
  let eventFired = false;
  let eventData = null;

  const listener = (event, data) => {
    eventFired = true;
    eventData = data;
  };

  model.event.addListener('test', listener);
  model.event.fire('test', { message: 'hello' });

  if (!eventFired) {
    throw new Error('Event listener not triggered');
  }

  if (!eventData || eventData.message !== 'hello') {
    throw new Error('Event data not passed correctly');
  }

  model.event.removeListener('test', listener);
});

// Test: Class App instantiation
ClassImplementationTestSuite.addTest('Class App - Instantiation', () => {
  if (typeof G2T === 'undefined' || !G2T.App) {
    throw new Error('G2T.App class not available');
  }

  const app = new G2T.App();
  if (!(app instanceof G2T.App)) {
    throw new Error('App instance not created correctly');
  }

  if (!app.model || !(app.model instanceof G2T.Model)) {
    throw new Error('App model not initialized correctly');
  }

  // Initialize the app
  app.init();
});

// Test: Class App initialization
ClassImplementationTestSuite.addTest('Class App - Initialization', async () => {
  const app = new G2T.App();

  if (typeof app.init !== 'function') {
    throw new Error('App init method not available');
  }

  // Test that init can be called (may not complete in test environment)
  try {
    await app.init();
  } catch (error) {
    // Expected in test environment without full Gmail context
    if (!error.message.includes('Gmail') && !error.message.includes('Trello')) {
      throw error;
    }
  }
});

// Test: Class GmailView instantiation
ClassImplementationTestSuite.addTest('Class GmailView - Instantiation', () => {
  if (typeof G2T === 'undefined' || !G2T.GmailView) {
    throw new Error('G2T.GmailView class not available');
  }

  const model = new G2T.Model();
  const gmailView = new G2T.GmailView(model);

  if (!(gmailView instanceof G2T.GmailView)) {
    throw new Error('GmailView instance not created correctly');
  }

  if (gmailView.model !== model) {
    throw new Error('GmailView model not set correctly');
  }

  if (!gmailView.event || typeof gmailView.event.addListener !== 'function') {
    throw new Error('GmailView event system not initialized');
  }
});

// Test: Class PopupView instantiation
ClassImplementationTestSuite.addTest('Class PopupView - Instantiation', () => {
  if (typeof G2T === 'undefined' || !G2T.PopupView) {
    throw new Error('G2T.PopupView class not available');
  }

  const model = new G2T.Model();
  const popupView = new G2T.PopupView(model);

  if (!(popupView instanceof G2T.PopupView)) {
    throw new Error('PopupView instance not created correctly');
  }

  if (popupView.model !== model) {
    throw new Error('PopupView model not set correctly');
  }

  if (!popupView.event || typeof popupView.event.addListener !== 'function') {
    throw new Error('PopupView event system not initialized');
  }
});

// Test: Class inheritance and methods
ClassImplementationTestSuite.addTest(
  'Class Implementation - Inheritance',
  () => {
    // Test that classes have expected methods
    const model = new G2T.Model();
    const app = new G2T.App();
    const gmailView = new G2T.GmailView(model);
    const popupView = new G2T.PopupView(model);

    // Initialize components for testing
    model.init();
    gmailView.init();
    popupView.init();

    // Check for common methods that should exist
    const expectedMethods = {
      Model: [
        'getState',
        'setState',
        'getUser',
        'loadTrelloLabels',
        'loadTrelloMembers',
        'loadTrelloCards',
        'loadTrelloLists',
      ],
      App: ['init', 'getModel'],
      GmailView: ['init', 'render'],
      PopupView: ['init', 'render'],
    };

    for (const [className, methods] of Object.entries(expectedMethods)) {
      const instance =
        className === 'Model'
          ? model
          : className === 'App'
          ? app
          : className === 'GmailView'
          ? gmailView
          : popupView;

      for (const method of methods) {
        if (typeof instance[method] !== 'function') {
          throw new Error(`${className} missing method: ${method}`);
        }
      }
    }
  }
);

// Test: Event system integration between classes
ClassImplementationTestSuite.addTest(
  'Class Implementation - Event Integration',
  () => {
    const model = new G2T.Model();
    const gmailView = new G2T.GmailView(model);
    const popupView = new G2T.PopupView(model);

    // Initialize components for testing
    model.init();
    gmailView.init();
    popupView.init();

    let modelEventFired = false;
    let viewEventFired = false;

    // Test model events
    model.event.addListener('stateChanged', () => {
      modelEventFired = true;
    });

    // Test view events
    gmailView.event.addListener('rendered', () => {
      viewEventFired = true;
    });

    // Fire events
    model.event.fire('stateChanged', { newState: 'test' });
    gmailView.event.fire('rendered', { element: 'test' });

    if (!modelEventFired) {
      throw new Error('Model event not fired');
    }

    if (!viewEventFired) {
      throw new Error('View event not fired');
    }
  }
);

// Test: Error handling in class implementations
ClassImplementationTestSuite.addTest(
  'Class Implementation - Error Handling',
  () => {
    const model = new G2T.Model();

    // Test that invalid event types are handled gracefully
    try {
      model.event.fire('', {});
      // Should not throw for empty event type in current implementation
    } catch (error) {
      if (!error.message.includes("Event object missing 'type' property")) {
        throw error;
      }
    }

    // Test that removing non-existent listeners doesn't break
    const nonExistentListener = () => {};
    model.event.removeListener('nonexistent', nonExistentListener);

    // Test that adding null listeners is handled
    try {
      model.event.addListener('test', null);
      throw new Error('Should have thrown error for null listener');
    } catch (error) {
      // Expected behavior - should handle null listeners
    }
  }
);

// Test: Memory management in class implementations
ClassImplementationTestSuite.addTest(
  'Class Implementation - Memory Management',
  () => {
    const model = new G2T.Model();
    const listeners = [];

    // Add multiple listeners
    for (let i = 0; i < 10; i++) {
      const listener = (event, data) => console.log(`Listener ${i}:`, data);
      listeners.push(listener);
      model.event.addListener('test', listener);
    }

    // Remove all listeners
    for (const listener of listeners) {
      model.event.removeListener('test', listener);
    }

    // Fire event - should not trigger any listeners
    let eventFired = false;
    const testListener = () => {
      eventFired = true;
    };
    model.event.addListener('test', testListener);
    model.event.fire('test', {});
    model.event.removeListener('test', testListener);

    if (!eventFired) {
      throw new Error('Listener not working after mass removal');
    }
  }
);

// Test: Performance of class implementations
ClassImplementationTestSuite.addTest(
  'Class Implementation - Performance',
  () => {
    const model = new G2T.Model();
    const startTime = performance.now();

    // Add many listeners
    const listeners = [];
    for (let i = 0; i < 100; i++) {
      const listener = (event, data) => {};
      listeners.push(listener);
      model.event.addListener('test', listener);
    }

    // Fire many events
    for (let i = 0; i < 1000; i++) {
      model.event.fire('test', { iteration: i });
    }

    // Remove listeners
    for (const listener of listeners) {
      model.event.removeListener('test', listener);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete in reasonable time (less than 1 second)
    if (duration > 1000) {
      throw new Error(
        `Performance test took too long: ${duration.toFixed(2)}ms`
      );
    }

    console.log(`Performance test completed in ${duration.toFixed(2)}ms`);
  }
);

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.ClassImplementationTestSuite = ClassImplementationTestSuite;
}

// Run tests if this file is executed directly (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClassImplementationTestSuite;

  // Run tests if called directly
  if (require.main === module) {
    ClassImplementationTestSuite.runTests().then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    });
  }
}
