# Test Refactor Plan: Moving Shared Code from test_markdownify.js to test_shared.js


## Overview
The goal is to refactor `test_markdownify.js` (GOLD STANDARD) and `test_class_app.js` to properly share code through `test_shared.js`. Currently, `test_markdownify.js` has 55 passing tests and `test_class_app.js` has 3 failing tests out of 46 total.

## Current State Analysis


### test_markdownify.js (GOLD STANDARD) ✅
- [x] All 55 tests passing
- [x] Uses JSDOM for proper DOM environment
- [x] Has sophisticated jQuery mocking that handles `$(selector, context)` pattern
- [x] Loads actual Utils class and tests real markdownify functionality
- [x] Has comprehensive test coverage for markdown conversion

- [x] Creates HTML elements directly for testing

### test_shared.js (NEEDS ENHANCEMENT)
- [x] Contains basic mocks but missing key functionality
- [x] Has basic jQuery mock but doesn't handle `$(selector, context)` properly
- [x] Missing proper JSDOM setup

- [x] Missing proper Utils class loading mechanism
- [x] Has mock instances but they're not comprehensive enough

### test_class_app.js (NEEDS FIXING) ❌
- [x] 3 tests failing out of 46 total
- [x] Uses shared.js but missing proper setup
- [x] Failing tests indicate missing proper initialization and event handling
- [x] May not create HTML elements directly like markdownify tests

## Refactoring Plan

### Phase 1: Enhance test_shared.js with test_markdownify.js patterns

#### Step 1.1: Add JSDOM setup to shared.js
- [x] Add JSDOM import and configuration
- [x] Create proper DOM environment setup function
- [x] Add cleanup function
- [x] **Testing**: Run test_markdownify.js to ensure it still passes

#### Step 1.2: Enhance jQuery mocking
- [x] Copy the sophisticated jQuery mock from test_markdownify.js
- [x] Ensure it handles `$(selector, context)` pattern correctly
- [x] Add proper element wrapping and text extraction
- [x] **Testing**: Run test_markdownify.js to ensure it still passes

#### Step 1.3: Add Utils class loading mechanism
- [x] Copy the Utils class loading pattern from test_markdownify.js
- [x] Add proper eval-based loading for Chrome extension compatibility
- [x] Add mock application setup
- [x] **Testing**: Run test_markdownify.js to ensure it still passes

#### Step 1.4: Add proper test environment setup/teardown
- [x] Create beforeEach/afterEach functions
- [x] Ensure proper cleanup between tests
- [x] **Testing**: Run test_markdownify.js to ensure it still passes

**Phase 1 Testing**: ✅ Run test_markdownify.js to ensure all 55 tests still pass

### Phase 2: Refactor test_markdownify.js to use shared.js

#### Step 2.1: Replace local setup with shared.js imports
- [x] Import setup functions from shared.js
- [x] Remove duplicate code
- [x] Ensure all functionality is preserved
- [x] **Testing**: Run test_markdownify.js to ensure all 55 tests still pass

#### Step 2.2: Update test structure
- [x] Use shared beforeEach/afterEach
- [x] Use shared jQuery mock
- [x] Use shared Utils loading
- [x] **Testing**: Run test_markdownify.js to ensure all 55 tests still pass

**Phase 2 Testing**: ✅ Run test_markdownify.js to ensure all 55 tests still pass

### Phase 3: Fix test_class_app.js to use enhanced shared.js

#### Step 3.1: Update test_class_app.js imports
- [x] Import enhanced shared.js functions
- [x] Use proper JSDOM setup
- [x] **Testing**: Run test_class_app.js to check current state

#### Step 3.2: Fix failing tests
- [x] Fix `app.persist.trelloUser` initialization (should be `null` not `undefined`)
- [x] Fix `app.temp.attachments` initialization (should be `[]` not `undefined`)
- [x] Fix `this.events.emit` mock (add proper emit function)
- [x] **Testing**: Run test_class_app.js to ensure all tests pass

#### Step 3.3: Add missing functionality
- [x] Ensure proper App class initialization
- [x] Add proper event handling mocks
- [x] Add proper state management
- [x] **Testing**: Run test_class_app.js to ensure all tests pass

**Phase 3 Testing**: ✅ Run test_class_app.js to ensure all 46 tests pass

### Phase 4: Validation and cleanup

#### Step 4.1: Run both test suites
- [x] Ensure test_markdownify.js still passes (55 tests)
- [x] Ensure test_class_app.js passes (46 tests)
- [x] **Testing**: Run both test suites to verify

#### Step 4.2: Verify shared functionality
- [x] Confirm both test files use the same shared code
- [x] Verify no duplication between files
- [x] **Testing**: Code review and verification

**Phase 4 Testing**: ✅ Run both test suites to ensure all 101 tests pass

## Notes
- Move class app tests to the pattern markdownify tests use (create HTML elements directly)
- Abstract duplicate tests into shared tests with shared setup
- Maintain Chrome extension compatibility with eval-based loading
- Preserve all existing functionality while improving code sharing

## Success Criteria
- [x] test_markdownify.js: 55 tests passing

- [x] test_class_app.js: 46 tests passing  
- [x] Total: 101 tests passing
- [x] No code duplication between test files
- [x] Proper shared functionality in test_shared.js

---

# Test Refactor Plan: Refactoring test_class_utils.js to Use Shared Code

## Overview
The goal is to refactor `test_class_utils.js` to follow the same patterns as the successful refactors of `test_markdownify.js` (GOLD STANDARD) and `test_class_app.js` (SILVER STANDARD). Currently, `test_class_utils.js` has 48 failing tests out of 48 total due to improper class loading.

## Current State Analysis

### test_class_utils.js (NEEDS COMPLETE REFACTOR) ❌
- [x] All 48 tests failing
- [x] Uses direct require() which doesn't work with Chrome extension classes
- [x] Missing proper JSDOM setup
- [x] Missing proper G2T namespace initialization
- [x] Missing proper mock application setup
- [x] Uses basic mocks instead of shared enhanced mocks

### test_markdownify.js (GOLD STANDARD) ✅
- [x] All 55 tests passing
- [x] Uses proper eval-based loading for Chrome extension compatibility
- [x] Uses JSDOM for proper DOM environment
- [x] Uses enhanced shared mocks and utilities
- [x] Creates HTML elements directly for testing

### test_class_app.js (SILVER STANDARD) ✅
- [x] All 46 tests passing
- [x] Uses proper eval-based loading with G2T namespace injection
- [x] Uses JSDOM for proper DOM environment
- [x] Uses enhanced shared mocks and utilities
- [x] Proper mock constructor injection pattern

## Refactoring Plan for test_class_utils.js

### Phase 1: Update test_class_utils.js to use shared.js patterns

#### Step 1.1: Replace direct require with eval-based loading
- [ ] Import shared utilities from test_shared.js
- [ ] Replace `const Utils = require('../chrome_manifest_v3/class_utils.js')` with eval-based loading
- [ ] Add proper G2T namespace initialization
- [ ] **Testing**: Run test_class_utils.js to check loading status

#### Step 1.2: Add JSDOM setup and proper test environment
- [ ] Add JSDOM setup using shared function
- [ ] Add proper beforeEach/afterEach with cleanup
- [ ] Add proper mock application setup
- [ ] **Testing**: Run test_class_utils.js to check environment setup

#### Step 1.3: Replace basic mocks with enhanced shared mocks
- [ ] Remove local mock definitions
- [ ] Use shared chrome API mocks
- [ ] Use shared console mocks
- [ ] Use shared jQuery mocks
- [ ] **Testing**: Run test_class_utils.js to check mock functionality

#### Step 1.4: Add proper Utils class initialization
- [ ] Create proper mock application instance
- [ ] Initialize Utils with proper app dependency
- [ ] Ensure all Utils methods have access to app context
- [ ] **Testing**: Run test_class_utils.js to check Utils initialization

**Phase 1 Testing**: 
- [ ] Run test_class_utils.js to ensure proper loading and basic functionality
- [ ] **CRITICAL**: If shared.js was modified, run test_markdownify.js to ensure all 55 tests still pass
- [ ] **CRITICAL**: If shared.js was modified, run test_class_app.js to ensure all 46 tests still pass
- [ ] Success criteria: Utils class loads without errors, basic constructor works, no shared.js regressions

### Phase 2: Fix Utils class dependency issues

#### Step 2.1: Fix app dependency in Utils constructor
- [ ] Ensure Utils constructor receives proper app object
- [ ] Mock app.chrome.storageSyncGet for debug mode
- [ ] Mock app.temp.log for logging functionality
- [ ] **Testing**: Run test_class_utils.js to check constructor functionality

#### Step 2.2: Fix storage operations
- [ ] Mock app.chrome.storageLocalGet for loadFromChromeStorage
- [ ] Mock app.chrome.storageLocalSet for saveToChromeStorage
- [ ] Ensure proper async/await handling
- [ ] **Testing**: Run test_class_utils.js to check storage operations

#### Step 2.3: Fix logging and debug functionality
- [ ] Mock app.temp.log structure properly
- [ ] Ensure debug mode works correctly
- [ ] Fix log memory management
- [ ] **Testing**: Run test_class_utils.js to check logging functionality

**Phase 2 Testing**: 
- [ ] Run test_class_utils.js to ensure core Utils functionality works
- [ ] **CRITICAL**: If shared.js was modified, run test_markdownify.js to ensure all 55 tests still pass
- [ ] **CRITICAL**: If shared.js was modified, run test_class_app.js to ensure all 46 tests still pass
- [ ] Success criteria: Constructor works, storage operations work, logging works, no shared.js regressions

### Phase 3: Fix individual method tests

#### Step 3.1: Fix string manipulation tests
- [ ] Fix escapeRegExp tests
- [ ] Fix replacer tests
- [ ] Fix replacer_onEach tests
- [ ] **Testing**: Run test_class_utils.js to check string manipulation

#### Step 3.2: Fix URI and URL handling tests
- [ ] Fix uriForDisplay tests
- [ ] Fix url_add_var tests
- [ ] **Testing**: Run test_class_utils.js to check URI/URL handling

#### Step 3.3: Fix hash and data processing tests
- [ ] Fix djb2Hash tests
- [ ] Fix excludeFields tests
- [ ] **Testing**: Run test_class_utils.js to check hash/data processing

#### Step 3.4: Fix email processing tests
- [ ] Fix splitEmailDomain tests
- [ ] **Testing**: Run test_class_utils.js to check email processing

#### Step 3.5: Fix string formatting tests
- [ ] Fix addChar tests
- [ ] Fix addSpace tests
- [ ] Fix addCRLF tests
- [ ] **Testing**: Run test_class_utils.js to check string formatting

#### Step 3.6: Fix text processing tests
- [ ] Fix truncate tests
- [ ] Fix midTruncate tests
- [ ] Fix bookend tests
- [ ] **Testing**: Run test_class_utils.js to check text processing

#### Step 3.7: Fix HTML entity processing tests
- [ ] Fix encodeEntities tests
- [ ] Fix decodeEntities tests
- [ ] **Testing**: Run test_class_utils.js to check HTML entity processing

#### Step 3.8: Fix event handling tests
- [ ] Fix modKey tests
- [ ] **Testing**: Run test_class_utils.js to check event handling

#### Step 3.9: Fix avatar URL generation tests
- [ ] Fix makeAvatarUrl tests
- [ ] **Testing**: Run test_class_utils.js to check avatar URL generation

#### Step 3.10: Fix lifecycle method tests
- [ ] Fix bindEvents tests
- [ ] Fix init tests
- [ ] **Testing**: Run test_class_utils.js to check lifecycle methods

**Phase 3 Testing**: 
- [ ] Run test_class_utils.js to ensure all method tests pass
- [ ] **CRITICAL**: If shared.js was modified, run test_markdownify.js to ensure all 55 tests still pass
- [ ] **CRITICAL**: If shared.js was modified, run test_class_app.js to ensure all 46 tests still pass
- [ ] Success criteria: All 48+ method tests pass, no shared.js regressions

### Phase 4: Add comprehensive test coverage

#### Step 4.1: Add error handling tests
- [ ] Test null/undefined input handling
- [ ] Test edge cases in string operations
- [ ] **Testing**: Run test_class_utils.js to check error handling

#### Step 4.2: Add performance tests
- [ ] Test large string handling
- [ ] Test large object handling
- [ ] **Testing**: Run test_class_utils.js to check performance

#### Step 4.3: Add integration tests
- [ ] Test method interactions
- [ ] Test real-world scenarios
- [ ] **Testing**: Run test_class_utils.js to check integration

**Phase 4 Testing**: 
- [ ] Run test_class_utils.js to ensure comprehensive coverage
- [ ] **CRITICAL**: If shared.js was modified, run test_markdownify.js to ensure all 55 tests still pass
- [ ] **CRITICAL**: If shared.js was modified, run test_class_app.js to ensure all 46 tests still pass
- [ ] Success criteria: All comprehensive tests pass, no shared.js regressions

### Phase 5: Validation and cleanup

#### Step 5.1: Run all test suites
- [ ] Ensure test_markdownify.js still passes (55 tests)
- [ ] Ensure test_class_app.js still passes (46 tests)
- [ ] Ensure test_class_utils.js passes (48+ tests)
- [ ] **Testing**: Run all test suites to verify

#### Step 5.2: Verify shared functionality
- [ ] Confirm all test files use the same shared code
- [ ] Verify no duplication between files
- [ ] Ensure consistent patterns across all test files
- [ ] **Testing**: Code review and verification

**Phase 5 Testing**: 
- [ ] Run all test suites to ensure all tests pass
- [ ] **CRITICAL**: Run test_markdownify.js to ensure all 55 tests still pass
- [ ] **CRITICAL**: Run test_class_app.js to ensure all 46 tests still pass
- [ ] **CRITICAL**: Run test_class_utils.js to ensure all 48+ tests pass
- [ ] Success criteria: All 149+ tests pass across all test suites, no regressions

## Key Patterns to Follow

### Class Loading Pattern (from test_class_app.js)
```javascript
// Load the Utils class using eval (for Chrome extension compatibility)
const utilsCode = loadClassFile('chrome_manifest_v3/class_utils.js');

// Inject mock constructors after G2T namespace is initialized
const injectedCode = utilsCode.replace(
  'var G2T = G2T || {}; // must be var to guarantee correct scope',
  `var G2T = G2T || {}; // must be var to guarantee correct scope
// Inject mock constructors for testing
G2T.App = function(args) {
  if (!(this instanceof G2T.App)) {
    return new G2T.App(args);
  }
  Object.assign(this, mockApp);
  return this;
};`
);

eval(injectedCode);
```

### Test Environment Setup Pattern (from test_markdownify.js)
```javascript
describe('Utils Class', () => {
  let dom, window, utils, mockApp;

  beforeEach(() => {
    // Setup JSDOM environment using shared function
    const jsdomSetup = setupJSDOM();
    dom = jsdomSetup.dom;
    window = jsdomSetup.window;

    // Setup Utils class using shared function
    const utilsSetup = setupUtilsForTesting();
    utils = utilsSetup.utils;
    mockApp = utilsSetup.mockApp;
  });

  afterEach(() => {
    // Clean up JSDOM environment using shared function
    cleanupJSDOM(dom);
  });
});
```

### Mock Application Pattern (from test_shared.js)
```javascript
function setupUtilsForTesting() {
  const mockApp = {
    chrome: {
      storageSyncGet: jest.fn(),
      storageLocalGet: jest.fn(),
      storageLocalSet: jest.fn(),
    },
    temp: {
      log: {
        memory: [],
        count: 0,
        max: 100,
        debugMode: false,
        lastMessage: null,
        lastMessageCount: 0,
        lastMessageIndex: -1,
      },
    },
  };

  // Load and evaluate Utils class with mock app
  const utilsCode = loadClassFile('chrome_manifest_v3/class_utils.js');
  eval(utilsCode);
  
  const utils = new G2T.Utils({ app: mockApp });
  
  return { utils, mockApp };
}
```

## Success Criteria
- [ ] test_markdownify.js: 55 tests passing (maintain gold standard)
- [ ] test_class_app.js: 46 tests passing (maintain silver standard)
- [ ] test_class_utils.js: 48+ tests passing (achieve bronze standard)
- [ ] Total: 149+ tests passing
- [ ] No code duplication between test files
- [ ] Proper shared functionality in test_shared.js
- [ ] Consistent patterns across all test files
- [ ] Chrome extension compatibility maintained

## Notes
- Follow the exact patterns established in test_markdownify.js and test_class_app.js
- Never reduce any shared code, only add to it
- **CRITICAL**: Always check that all old tests (markdownify, class_app) are completely passing at all times
- **CRITICAL**: If shared.js is modified, immediately run test_markdownify.js and test_class_app.js to verify no regressions
- Maintain Chrome extension compatibility with eval-based loading
- Preserve all existing functionality while improving code sharing
- Use proper JSDOM setup for DOM-dependent tests
- Create HTML elements directly for testing when needed

## Testing Requirements When Modifying Shared Code

### Mandatory Test Execution After Shared.js Changes
Whenever `test_shared.js` is modified, the following tests MUST be run to ensure no regressions:

1. **test_markdownify.js** (GOLD STANDARD)
   - Command: `npm test -- test/test_markdownify.js`
   - Expected: All 55 tests passing
   - Purpose: Ensure gold standard functionality is preserved

2. **test_class_app.js** (SILVER STANDARD)
   - Command: `npm test -- test/test_class_app.js`
   - Expected: All 46 tests passing
   - Purpose: Ensure silver standard functionality is preserved

3. **test_class_utils.js** (BRONZE STANDARD - when applicable)
   - Command: `npm test -- test/test_class_utils.js`
   - Expected: All 48+ tests passing (after refactor)
   - Purpose: Ensure bronze standard functionality works

### Success Criteria for Each Phase

#### Phase 1 Success Criteria
- [ ] Utils class loads without "Utils is not a constructor" errors
- [ ] Basic constructor works with mock app dependency
- [ ] JSDOM environment is properly set up
- [ ] All shared mocks are working correctly
- [ ] **CRITICAL**: No regressions in test_markdownify.js (55 tests pass)
- [ ] **CRITICAL**: No regressions in test_class_app.js (46 tests pass)

#### Phase 2 Success Criteria
- [ ] Utils constructor receives and uses proper app object
- [ ] Storage operations (loadFromChromeStorage, saveToChromeStorage) work
- [ ] Logging functionality works with debug mode
- [ ] Log memory management works correctly
- [ ] **CRITICAL**: No regressions in test_markdownify.js (55 tests pass)
- [ ] **CRITICAL**: No regressions in test_class_app.js (46 tests pass)

#### Phase 3 Success Criteria
- [ ] All 48+ method tests pass (string manipulation, URI handling, etc.)
- [ ] Each method category has at least one passing test
- [ ] Error handling works for edge cases
- [ ] **CRITICAL**: No regressions in test_markdownify.js (55 tests pass)
- [ ] **CRITICAL**: No regressions in test_class_app.js (46 tests pass)

#### Phase 4 Success Criteria
- [ ] All comprehensive test coverage passes
- [ ] Error handling tests pass
- [ ] Performance tests pass
- [ ] Integration tests pass
- [ ] **CRITICAL**: No regressions in test_markdownify.js (55 tests pass)
- [ ] **CRITICAL**: No regressions in test_class_app.js (46 tests pass)

#### Phase 5 Success Criteria
- [ ] All 149+ tests pass across all test suites
- [ ] No code duplication between test files
- [ ] Consistent patterns across all test files
- [ ] Chrome extension compatibility maintained
- [ ] **CRITICAL**: test_markdownify.js: 55 tests passing (gold standard maintained)
- [ ] **CRITICAL**: test_class_app.js: 46 tests passing (silver standard maintained)
- [ ] **CRITICAL**: test_class_utils.js: 48+ tests passing (bronze standard achieved)