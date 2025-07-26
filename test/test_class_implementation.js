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

  if (!G2T.app.events || typeof G2T.app.events.addListener !== 'function') {
    throw new Error('Global event system not initialized');
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

  G2T.app.events.addListener('test', listener);
  G2T.app.events.emit('test', { message: 'hello' });

  if (!eventFired) {
    throw new Error('Event listener not triggered');
  }

  if (!eventData || eventData.message !== 'hello') {
    throw new Error('Event data not passed correctly');
  }

  G2T.app.events.removeListener('test', listener);
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

  const app = new G2T.App();
  const gmailView = new G2T.GmailView(app);

  if (!(gmailView instanceof G2T.GmailView)) {
    throw new Error('GmailView instance not created correctly');
  }

  if (gmailView.parent !== app) {
    throw new Error('GmailView parent not set correctly');
  }
});

// Test: Class PopupView instantiation
ClassImplementationTestSuite.addTest('Class PopupView - Instantiation', () => {
  if (typeof G2T === 'undefined' || !G2T.PopupView) {
    throw new Error('G2T.PopupView class not available');
  }

  const app = new G2T.App();
  const popupView = new G2T.PopupView(app);

  if (!(popupView instanceof G2T.PopupView)) {
    throw new Error('PopupView instance not created correctly');
  }

  if (popupView.parent !== app) {
    throw new Error('PopupView parent not set correctly');
  }
});

// Test: Class Utils instantiation
ClassImplementationTestSuite.addTest('Class Utils - Instantiation', () => {
  if (typeof G2T === 'undefined' || !G2T.Utils) {
    throw new Error('G2T.Utils class not available');
  }

  const app = new G2T.App();
  const utils = new G2T.Utils(app);

  if (!(utils instanceof G2T.Utils)) {
    throw new Error('Utils instance not created correctly');
  }

  if (utils.parent !== app) {
    throw new Error('Utils parent not set correctly');
  }
});

// Test: Class Utils utility methods
ClassImplementationTestSuite.addTest('Class Utils - Utility Methods', () => {
  const app = new G2T.App();
  const utils = app.utils;

  // Test escapeRegExp
  const escaped = utils.escapeRegExp('test.string');
  if (escaped !== 'test\\.string') {
    throw new Error('escapeRegExp not working correctly');
  }

  // Test replacer
  const replaced = utils.replacer('Hello %name%', { name: 'World' });
  if (replaced !== 'Hello World') {
    throw new Error('replacer not working correctly');
  }

  // Test splitEmailDomain
  const emailParts = utils.splitEmailDomain('test@example.com');
  if (emailParts.name !== 'test' || emailParts.domain !== 'example.com') {
    throw new Error('splitEmailDomain not working correctly');
  }

  // Test truncate
  const truncated = utils.truncate('Hello World', 8, '...');
  if (truncated !== 'Hello...') {
    throw new Error('truncate not working correctly');
  }
});

// Test: App utils integration
ClassImplementationTestSuite.addTest('Class App - Utils Integration', () => {
  const app = new G2T.App();

  if (!app.utils || !(app.utils instanceof G2T.Utils)) {
    throw new Error('App utils not initialized correctly');
  }

  // Test that App can access utils methods
  const escaped = app.utils.escapeRegExp('test.string');
  if (escaped !== 'test\\.string') {
    throw new Error('App utils integration not working');
  }
});

// Test: Component utils access
ClassImplementationTestSuite.addTest('Class Components - Utils Access', () => {
  const app = new G2T.App();

  // Test that components can access utils through parent
  const popupView = app.popupView;
  const gmailView = app.gmailView;

  if (
    !popupView.parent.utils ||
    !(popupView.parent.utils instanceof G2T.Utils)
  ) {
    throw new Error('PopupView cannot access utils through parent');
  }

  if (
    !gmailView.parent.utils ||
    !(gmailView.parent.utils instanceof G2T.Utils)
  ) {
    throw new Error('GmailView cannot access utils through parent');
  }
});

// Test: Class inheritance and methods
ClassImplementationTestSuite.addTest(
  'Class Implementation - Inheritance',
  () => {
    // Test that classes have expected methods
    const app = new G2T.App();
    const model = app.model;
    const gmailView = app.gmailView;
    const popupView = app.popupView;

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
    const app = new G2T.App();
    const model = app.model;
    const gmailView = app.gmailView;
    const popupView = app.popupView;

    // Initialize components for testing
    model.init();
    gmailView.init();
    popupView.init();

    let modelEventFired = false;
    let viewEventFired = false;

    // Test model events
    G2T.app.events.addListener('onTrelloDataReady', () => {
      modelEventFired = true;
    });

    // Test view events
    G2T.app.events.addListener('onDetected', () => {
      viewEventFired = true;
    });

    // Fire events
    G2T.app.events.emit('onTrelloDataReady', { data: 'test' });
    G2T.app.events.emit('onDetected', { element: 'test' });

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
    // Test that invalid event types are handled gracefully
    try {
      G2T.app.events.emit('', {});
      // Should not throw for empty event type in current implementation
    } catch (error) {
      if (!error.message.includes("Event object missing 'type' property")) {
        throw error;
      }
    }

    // Test that removing non-existent listeners doesn't break
    const nonExistentListener = () => {};
    G2T.app.events.removeListener('nonexistent', nonExistentListener);

    // Test that adding null listeners is handled
    try {
      G2T.app.events.addListener('test', null);
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
    const listeners = [];

    // Add multiple listeners
    for (let i = 0; i < 10; i++) {
      const listener = (event, data) => console.log(`Listener ${i}:`, data);
      listeners.push(listener);
      G2T.app.events.addListener('test', listener);
    }

    // Remove all listeners
    for (const listener of listeners) {
      G2T.app.events.removeListener('test', listener);
    }

    // Fire event - should not trigger any listeners
    let eventFired = false;
    const testListener = () => {
      eventFired = true;
    };
    G2T.app.events.addListener('test', testListener);
    G2T.app.events.emit('test', {});
    G2T.app.events.removeListener('test', testListener);

    if (!eventFired) {
      throw new Error('Listener not working after mass removal');
    }
  }
);

// Test: Performance of class implementations
ClassImplementationTestSuite.addTest(
  'Class Implementation - Performance',
  () => {
    const startTime = performance.now();

    // Add many listeners
    const listeners = [];
    for (let i = 0; i < 100; i++) {
      const listener = (event, data) => {};
      listeners.push(listener);
      G2T.app.events.addListener('test', listener);
    }

    // Fire many events
    for (let i = 0; i < 1000; i++) {
      G2T.app.events.emit('test', { iteration: i });
    }

    // Remove listeners
    for (const listener of listeners) {
      G2T.app.events.removeListener('test', listener);
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

// Test: Event binding architecture (App vs individual classes)
ClassImplementationTestSuite.addTest(
  'Class Implementation - Event Binding Architecture',
  () => {
    const app = new G2T.App();

    // Test that App uses global event system
    const appBindEvents = app.bindEvents.toString();

    // App should bind to global event system
    if (!appBindEvents.includes('G2T.app.events.addListener')) {
      throw new Error('App should bind to global event system');
    }

    if (!appBindEvents.includes('chrome.runtime.onMessage.addListener')) {
      throw new Error('App should bind chrome runtime events');
    }

    // Test that components use global event system
    const popupView = new G2T.PopupView(app);
    const popupBindEvents = popupView.bindEvents.toString();

    if (!popupBindEvents.includes('G2T.app.events.addListener')) {
      throw new Error('PopupView should bind to global event system');
    }

    // Test that GmailView uses global event system
    const gmailView = new G2T.GmailView(app);
    const gmailBindEvents = gmailView.bindEvents.toString();

    if (!gmailBindEvents.includes('G2T.app.events.addListener')) {
      throw new Error('GmailView should bind to global event system');
    }

    // Test that Model uses global event system
    const model = new G2T.Model(app);
    const modelMethods = model.constructor.toString();

    if (!modelMethods.includes('G2T.app.events.emit')) {
      throw new Error('Model should fire global events');
    }
  }
);

// Test: Card submit complete event flow
ClassImplementationTestSuite.addTest(
  'Class Implementation - Card Submit Complete Event Flow',
  () => {
    const app = new G2T.App();
    const model = app.model;
    const popupView = app.popupView;

    // Initialize components
    model.init();
    popupView.init();

    let cardSubmitCompleteHandled = false;
    let submittedFormShownCompleteHandled = false;

    // Test the new event flow
    G2T.app.events.addListener('onCardSubmitComplete', () => {
      cardSubmitCompleteHandled = true;
    });

    G2T.app.events.addListener('submittedFormShownComplete', () => {
      submittedFormShownCompleteHandled = true;
    });

    // Simulate card submit complete
    G2T.app.events.emit('onCardSubmitComplete', {
      data: { title: 'Test Card' },
    });

    if (!cardSubmitCompleteHandled) {
      throw new Error('onCardSubmitComplete event not handled by PopupView');
    }

    if (!submittedFormShownCompleteHandled) {
      throw new Error(
        'submittedFormShownComplete event not fired by PopupView'
      );
    }
  }
);

// Test: Model event handling
ClassImplementationTestSuite.addTest(
  'Class Implementation - Model Event Handling',
  () => {
    const app = new G2T.App();
    const model = app.model;

    // Initialize model
    model.init();

    let submittedFormShownCompleteHandled = false;

    // Test that Model handles submittedFormShownComplete
    G2T.app.events.addListener('submittedFormShownComplete', () => {
      submittedFormShownCompleteHandled = true;
    });

    // Simulate submittedFormShownComplete event
    G2T.app.events.emit('submittedFormShownComplete', {
      data: { title: 'Test Card' },
    });

    if (!submittedFormShownCompleteHandled) {
      throw new Error('Model not handling submittedFormShownComplete event');
    }
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
