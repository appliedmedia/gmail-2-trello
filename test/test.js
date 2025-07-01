// Basic test suite for Gmail-2-Trello extension
// This is a simple test framework for manual testing

const TestSuite = {
  tests: [],

  addTest(name, testFunction) {
    this.tests.push({ name, testFunction });
  },

  async runTests() {
    console.log('🧪 Running Gmail-2-Trello Tests...\n');

    let passed = 0;
    let failed = 0;

    for (const test of this.tests) {
      try {
        console.log(`📋 Testing: ${test.name}`);
        await test.testFunction();
        console.log(`✅ PASS: ${test.name}\n`);
        passed++;
      } catch (error) {
        console.log(`❌ FAIL: ${test.name}`);
        console.log(`   Error: ${error.message}\n`);
        failed++;
      }
    }

    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    return { passed, failed };
  },
};

// Test: Check if extension is loaded
TestSuite.addTest('Extension Loaded', () => {
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    throw new Error('Chrome extension API not available');
  }

  if (!chrome.runtime.getManifest) {
    throw new Error('Extension manifest not accessible');
  }

  const manifest = chrome.runtime.getManifest();
  if (manifest.name !== 'Gmail-2-Trello') {
    throw new Error('Extension name mismatch');
  }
});

// Test: Check if Gmail is available
TestSuite.addTest('Gmail Detection', () => {
  const hostname = window.location.hostname;
  if (!hostname.startsWith('mail.google.') && hostname !== 'mail.google.com') {
    throw new Error(`Not on Gmail domain: ${hostname}`);
  }
});

// Test: Check if Trello API is available
TestSuite.addTest('Trello API Available', () => {
  if (typeof Trello === 'undefined') {
    throw new Error('Trello API not loaded');
  }
});

// Test: Check if jQuery is available
TestSuite.addTest('jQuery Available', () => {
  if (typeof $ === 'undefined') {
    throw new Error('jQuery not loaded');
  }
});

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.TestSuite = TestSuite;
}

// Run tests if this file is executed directly (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TestSuite;

  // Run tests if called directly
  if (require.main === module) {
    TestSuite.runTests().then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    });
  }
}
