/**
 * Test for loadSourceFile utility function
 */

const { _ts } = require('./test_shared');

describe('loadSourceFile Test', () => {
  test('should have loadSourceFile function available', () => {
    expect(_ts.loadSourceFile).toBeDefined();
    expect(typeof _ts.loadSourceFile).toBe('function');
  });

  test('should have G2T namespace available', () => {
    expect(global.G2T).toBeDefined();
  });
}); 