const { loadSourceFile, debugOut } = require('./test_shared');

describe('loadSourceFile Test', () => {
  test('should load Utils class and make G2T.Utils available', () => {
    // Load the Utils class using the new function
    const result = loadSourceFile('chrome_manifest_v3/class_utils.js');
    
    // Check that G2T is available globally
    expect(global.G2T).toBeDefined();
    expect(global.G2T.Utils).toBeDefined();
    
    // Check that we can create an instance
    const utils = new global.G2T.Utils({ app: {} });
    expect(utils).toBeDefined();
    
    // Test a simple method
    const markdownResult = utils.markdownify('<p>Test</p>', true, {});
    expect(markdownResult).toBe('Test');
    
    // ⚠️ CONSOLE.LOG IS OVERRIDEN BY JEST! Use debugOut() instead of console.log() ⚠️
    debugOut('✅ loadSourceFile test passed!');
  });
}); 