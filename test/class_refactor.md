# Test Refactor Plan: Refactoring test_class_chrome.js to Use Shared Code

## Overview
The goal is to refactor `test_class_chrome.js` to follow the same patterns as the successful refactors of `test_markdownify.js` (GOLD STANDARD), `test_class_app.js` (SILVER STANDARD), and `test_class_utils.js` (BRONZE STANDARD). Currently, `test_class_chrome.js` has 39 failing tests out of 39 total due to improper class loading.

## Current State Analysis

### test_class_chrome.js (NEEDS COMPLETE REFACTOR) ❌
- [x] All 39 tests failing
- [x] Uses direct require() which doesn't work with Chrome extension classes
- [x] Missing proper JSDOM setup
- [x] Missing proper G2T namespace initialization
- [x] Missing proper mock application setup
- [x] Uses basic mocks instead of shared enhanced mocks
- [x] Missing proper Chrome API mocking (storage.onChanged.addListener)

### test_markdownify.js (GOLD STANDARD) ✅
- [x] All 55 tests passing (RETIRED - functionality moved to Utils tests)
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

### test_class_utils.js (BRONZE STANDARD) ✅
- [x] All 118 tests passing
- [x] Uses proper eval-based loading with G2T namespace injection
- [x] Uses JSDOM for proper DOM environment
- [x] Uses enhanced shared mocks and utilities
- [x] Proper mock constructor injection pattern
- [x] Includes comprehensive markdownify functionality (55 tests)

## Refactoring Plan for test_class_chrome.js

### Phase 1: Update test_class_chrome.js to use shared.js patterns (COMPLETED) ✅

#### Step 1.1: Replace direct require with eval-based loading
- [x] Import shared utilities from test_shared.js
- [x] Replace `const Chrome = require('../chrome_manifest_v3/class_chrome.js')` with eval-based loading
- [x] Add proper G2T namespace initialization
- [x] **Testing**: Run test_class_chrome.js to check loading status

#### Step 1.2: Add JSDOM setup and proper test environment
- [x] Add JSDOM setup using shared function
- [x] Add proper beforeEach/afterEach with cleanup
- [x] Add proper mock application setup
- [x] **Testing**: Run test_class_chrome.js to check environment setup

#### Step 1.3: Replace basic mocks with enhanced shared mocks
- [x] Remove local mock definitions
- [x] Use shared chrome API mocks
- [x] Use shared console mocks
- [x] Use shared jQuery mocks
- [x] Add missing chrome.storage.onChanged.addListener mock
- [x] **Testing**: Run test_class_chrome.js to check mock functionality

#### Step 1.4: Add proper Chrome class initialization
- [x] Create proper mock application instance
- [x] Initialize Chrome with proper app dependency
- [x] Ensure all Chrome methods have access to app context
- [x] **Testing**: Run test_class_chrome.js to check Chrome initialization

**Phase 1 Testing**:
- [x] Run test_class_chrome.js to ensure proper loading and basic functionality
- [x] **CRITICAL**: If shared.js was modified, run test_class_app.js to ensure all 46 tests still pass
- [x] **CRITICAL**: If shared.js was modified, run test_class_utils.js to ensure all 118 tests still pass
- [x] Success criteria: Chrome class loads without errors, basic constructor works, no shared.js regressions

### Phase 2: Fix Chrome class dependency issues (COMPLETED) ✅

#### Step 2.1: Fix app dependency in Chrome constructor
- [x] Ensure Chrome constructor receives proper app object
- [x] Mock app.utils.refreshDebugMode for storage change handling
- [x] Mock app.popupView.displayExtensionInvalidReload for error handling
- [x] **Testing**: Run test_class_chrome.js to check constructor functionality

#### Step 2.2: Fix storage operations
- [x] Mock chrome.storage.sync.get for storageSyncGet
- [x] Mock chrome.storage.sync.set for storageSyncSet
- [x] Mock chrome.storage.onChanged.addListener for bindEvents
- [x] Ensure proper async/await handling
- [x] **Testing**: Run test_class_chrome.js to check storage operations

#### Step 2.3: Fix runtime operations
- [x] Mock chrome.runtime.sendMessage for runtimeSendMessage
- [x] Mock chrome.runtime.getURL for runtimeGetURL
- [x] Ensure proper callback handling
- [x] **Testing**: Run test_class_chrome.js to check runtime operations

**Phase 2 Testing**:
- [x] Run test_class_chrome.js to ensure core Chrome functionality works
- [x] **CRITICAL**: If shared.js was modified, run test_class_app.js to ensure all 46 tests still pass
- [x] **CRITICAL**: If shared.js was modified, run test_class_utils.js to ensure all 118 tests still pass
- [x] Success criteria: Constructor works, storage operations work, runtime operations work, no shared.js regressions

### Phase 3: Fix individual method tests (IN PROGRESS)

#### Step 3.1: Fix constructor and initialization tests
- [x] Fix Chrome instance creation tests
- [x] Fix static ck getter tests
- [x] Fix instance ck getter tests
- [x] **Testing**: Run test_class_chrome.js to check constructor tests

#### Step 3.2: Fix event binding tests
- [x] Fix bindEvents tests
- [x] Fix storage change listener tests
- [x] Fix debug mode change handling tests
- [x] **Testing**: Run test_class_chrome.js to check event binding

#### Step 3.3: Fix API call wrapping tests
- [x] Fix wrapApiCall tests
- [x] Fix error handling in API calls
- [x] Fix callback handling
- [x] **Testing**: Run test_class_chrome.js to check API wrapping

#### Step 3.4: Fix error handling tests
- [x] Fix handleChromeError tests
- [x] Fix context invalidation handling
- [x] Fix user confirmation handling
- [x] **Testing**: Run test_class_chrome.js to check error handling

#### Step 3.5: Fix context invalid message display tests
- [x] Fix showContextInvalidMessage tests
- [x] Fix popup view integration
- [x] Fix notification creation
- [x] **Testing**: Run test_class_chrome.js to check message display

#### Step 3.6: Fix storage operations tests
- [x] Fix storageSyncGet tests
- [x] Fix storageSyncSet tests
- [x] Fix callback handling in storage operations
- [x] **Testing**: Run test_class_chrome.js to check storage operations

#### Step 3.7: Fix runtime operations tests
- [x] Fix runtimeSendMessage tests
- [x] Fix runtimeGetURL tests
- [x] Fix callback handling in runtime operations
- [x] **Testing**: Run test_class_chrome.js to check runtime operations

#### Step 3.8: Fix error recovery tests
- [x] Fix missing app handling
- [x] Fix missing popup view handling
- [x] Fix missing utils handling
- [x] **Testing**: Run test_class_chrome.js to check error recovery

#### Step 3.9: Fix integration tests
- [x] Fix app utils integration
- [x] Fix popup view integration
- [x] Fix chrome API integration
- [x] **Testing**: Run test_class_chrome.js to check integration

#### Step 3.10: Fix performance tests
- [x] Fix API call efficiency tests
- [x] Fix error processing efficiency tests
- [x] **Testing**: Run test_class_chrome.js to check performance

#### Step 3.11: Fix edge cases tests
- [x] Fix null/undefined error handling
- [x] Fix empty error message handling
- [x] Fix null/undefined storage changes
- [x] **Testing**: Run test_class_chrome.js to check edge cases

**Phase 3 Testing**:
- [x] Run test_class_chrome.js to ensure all method tests pass
- [x] **CRITICAL**: If shared.js was modified, run test_class_app.js to ensure all 46 tests still pass
- [x] **CRITICAL**: If shared.js was modified, run test_class_utils.js to ensure all 118 tests still pass
- [x] Success criteria: All 39+ method tests pass, no shared.js regressions

### Phase 4: Add comprehensive test coverage

#### Step 4.1: Add error handling tests
- [x] Test null/undefined input handling
- [x] Test edge cases in API operations
- [x] **Testing**: Run test_class_chrome.js to check error handling

#### Step 4.2: Add performance tests
- [x] Test large data handling
- [x] Test multiple API calls
- [x] **Testing**: Run test_class_chrome.js to check performance

#### Step 4.3: Add integration tests
- [x] Test method interactions
- [x] Test real-world scenarios
- [x] **Testing**: Run test_class_chrome.js to check integration

**Phase 4 Testing**:
- [x] Run test_class_chrome.js to ensure comprehensive coverage
- [x] **CRITICAL**: If shared.js was modified, run test_class_app.js to ensure all 46 tests still pass
- [x] **CRITICAL**: If shared.js was modified, run test_class_utils.js to ensure all 118 tests still pass
- [x] Success criteria: All comprehensive tests pass, no shared.js regressions

### Phase 5: Validation and cleanup

#### Step 5.1: Run all test suites
- [x] Ensure test_class_app.js still passes (46 tests)
- [x] Ensure test_class_utils.js still passes (118 tests)
- [x] Ensure test_class_chrome.js passes (39+ tests)
- [x] **Testing**: Run all test suites to verify

#### Step 5.2: Verify shared functionality
- [x] Confirm all test files use the same shared code
- [x] Verify no duplication between files
- [x] Ensure consistent patterns across all test files
- [x] **Testing**: Code review and verification

**Phase 5 Testing**:
- [x] Run all test suites to ensure all tests pass
- [x] **CRITICAL**: Run test_class_app.js to ensure all 46 tests still pass
- [x] **CRITICAL**: Run test_class_utils.js to ensure all 118 tests still pass
- [x] **CRITICAL**: Run test_class_chrome.js to ensure all 39+ tests pass
- [x] Success criteria: All 203+ tests pass across all test suites, no regressions

## Key Patterns to Follow

### Class Loading Pattern (from test_class_app.js)

```javascript
// Load the Chrome class using eval (for Chrome extension compatibility)
const chromeCode = loadClassFile('chrome_manifest_v3/class_chrome.js');

// Inject mock constructors after G2T namespace is initialized
const injectedCode = chromeCode.replace(
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
describe('Chrome Class', () => {
  let dom, window, chromeInstance, mockApp;

  beforeEach(() => {
    // Setup JSDOM environment using shared function
    const jsdomSetup = setupJSDOM();
    dom = jsdomSetup.dom;
    window = jsdomSetup.window;

    // Setup Chrome class using shared function
    const chromeSetup = setupChromeForTesting();
    chromeInstance = chromeSetup.chromeInstance;
    mockApp = chromeSetup.mockApp;
  });

  afterEach(() => {
    // Clean up JSDOM environment using shared function
    cleanupJSDOM(dom);
  });
});
```

### Mock Application Pattern (from test_shared.js)

```javascript
function setupChromeForTesting() {
  const mockApp = {
    utils: {
      refreshDebugMode: jest.fn(),
      log: jest.fn()
    },
    popupView: {
      displayExtensionInvalidReload: jest.fn()
    }
  };

  // Load and evaluate Chrome class with mock app
  const chromeCode = loadClassFile('chrome_manifest_v3/class_chrome.js');
  eval(chromeCode);
  
  const chromeInstance = new G2T.ChromeAPI({ app: mockApp });
  
  return { chromeInstance, mockApp };
}
```

## Success Criteria
- [x] test_class_app.js: 46 tests passing (maintain silver standard) ✅
- [x] test_class_utils.js: 118 tests passing (maintain bronze standard) ✅
- [x] test_class_chrome.js: 39+ tests passing (achieve chrome standard) ✅
- [x] Total: 203+ tests passing ✅
- [x] No code duplication between test files
- [x] Proper shared functionality in test_shared.js
- [x] Consistent patterns across all test files
- [x] Chrome extension compatibility maintained
- [x] **NEW**: Chrome API functionality fully integrated into Chrome tests ✅

## Notes
- Follow the exact patterns established in test_class_app.js and test_class_utils.js
- Never reduce any shared code, only add to it
- **CRITICAL**: Always check that all old tests (class_app, class_utils) are completely passing at all times
- **CRITICAL**: If shared.js is modified, immediately run test_class_app.js and test_class_utils.js to verify no regressions
- **NEW**: Chrome API functionality has been fully integrated into test_class_chrome.js
- Maintain Chrome extension compatibility with eval-based loading
- Preserve all existing functionality while improving code sharing
- Use proper JSDOM setup for DOM-dependent tests
- Create HTML elements directly for testing when needed

## Testing Requirements When Modifying Shared Code

### Mandatory Test Execution After Shared.js Changes
Whenever `test_shared.js` is modified, the following tests MUST be run to ensure no regressions:

1. **test_class_app.js** (SILVER STANDARD)
   - Command: `npm test -- test/test_class_app.js`
   - Expected: All 46 tests passing
   - Purpose: Ensure silver standard functionality is preserved

2. **test_class_utils.js** (BRONZE STANDARD)
   - Command: `npm test -- test/test_class_utils.js`
   - Expected: All 118 tests passing
   - Purpose: Ensure bronze standard functionality is preserved

3. **test_class_chrome.js** (CHROME STANDARD - when applicable)
   - Command: `npm test -- test/test_class_chrome.js`
   - Expected: All 39+ tests passing (after refactor)
   - Purpose: Ensure chrome standard functionality works

### Success Criteria for Each Phase

#### Phase 1 Success Criteria
- [x] Chrome class loads without "Chrome is not a constructor" errors
- [x] Basic constructor works with mock app dependency
- [x] JSDOM environment is properly set up
- [x] All shared mocks are working correctly
- [x] **CRITICAL**: No regressions in test_class_app.js (46 tests pass)
- [x] **CRITICAL**: No regressions in test_class_utils.js (118 tests pass)

#### Phase 2 Success Criteria
- [x] Chrome constructor receives and uses proper app object
- [x] Storage operations (storageSyncGet, storageSyncSet) work
- [x] Runtime operations (runtimeSendMessage, runtimeGetURL) work
- [x] Event binding works correctly
- [x] **CRITICAL**: No regressions in test_class_app.js (46 tests pass)
- [x] **CRITICAL**: No regressions in test_class_utils.js (118 tests pass)

#### Phase 3 Success Criteria
- [x] All 39+ method tests pass (constructor, events, API wrapping, etc.)
- [x] Each method category has at least one passing test
- [x] Error handling works for edge cases
- [x] **CRITICAL**: No regressions in test_class_app.js (46 tests pass)
- [x] **CRITICAL**: No regressions in test_class_utils.js (118 tests pass)

#### Phase 4 Success Criteria
- [x] All comprehensive test coverage passes
- [x] Error handling tests pass
- [x] Performance tests pass
- [x] Integration tests pass
- [x] **CRITICAL**: No regressions in test_class_app.js (46 tests pass)
- [x] **CRITICAL**: No regressions in test_class_utils.js (118 tests pass)

#### Phase 5 Success Criteria
- [x] All 203+ tests pass across all test suites
- [x] No code duplication between test files
- [x] Consistent patterns across all test files
- [x] Chrome extension compatibility maintained
- [x] **CRITICAL**: test_class_app.js: 46 tests passing (silver standard maintained)
- [x] **CRITICAL**: test_class_utils.js: 118 tests passing (bronze standard maintained)
- [x] **CRITICAL**: test_class_chrome.js: 39+ tests passing (chrome standard achieved)

---

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

## Test Refactor Plan: Refactoring test_class_utils.js to Use Shared Code

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
- [x] Import shared utilities from test_shared.js
- [x] Replace `const Utils = require('../chrome_manifest_v3/class_utils.js')` with eval-based loading
- [x] Add proper G2T namespace initialization
- [x] **Testing**: Run test_class_utils.js to check loading status

#### Step 1.2: Add JSDOM setup and proper test environment
- [x] Add JSDOM setup using shared function
- [x] Add proper beforeEach/afterEach with cleanup
- [x] Add proper mock application setup
- [x] **Testing**: Run test_class_utils.js to check environment setup

#### Step 1.3: Replace basic mocks with enhanced shared mocks
- [x] Remove local mock definitions
- [x] Use shared chrome API mocks
- [x] Use shared console mocks
- [x] Use shared jQuery mocks
- [x] **Testing**: Run test_class_utils.js to check mock functionality

#### Step 1.4: Add proper Utils class initialization
- [x] Create proper mock application instance
- [x] Initialize Utils with proper app dependency
- [x] Ensure all Utils methods have access to app context
- [x] **Testing**: Run test_class_utils.js to check Utils initialization

**Phase 1 Testing**:
- [x] Run test_class_utils.js to ensure proper loading and basic functionality
- [x] **CRITICAL**: If shared.js was modified, run test_markdownify.js to ensure all 55 tests still pass
- [x] **CRITICAL**: If shared.js was modified, run test_class_app.js to ensure all 46 tests still pass
- [x] Success criteria: Utils class loads without errors, basic constructor works, no shared.js regressions

### Phase 2: Fix Utils class dependency issues

#### Step 2.1: Fix app dependency in Utils constructor
- [x] Ensure Utils constructor receives proper app object
- [x] Mock app.chrome.storageSyncGet for debug mode
- [x] Mock app.temp.log for logging functionality
- [x] **Testing**: Run test_class_utils.js to check constructor functionality

#### Step 2.2: Fix storage operations
- [x] Mock app.chrome.storageLocalGet for loadFromChromeStorage
- [x] Mock app.chrome.storageLocalSet for saveToChromeStorage
- [x] Ensure proper async/await handling
- [x] **Testing**: Run test_class_utils.js to check storage operations

#### Step 2.3: Fix logging and debug functionality
- [x] Mock app.temp.log structure properly
- [x] Ensure debug mode works correctly
- [x] Fix log memory management
- [x] **Testing**: Run test_class_utils.js to check logging functionality

**Phase 2 Testing**:
- [x] Run test_class_utils.js to ensure core Utils functionality works
- [x] **CRITICAL**: If shared.js was modified, run test_markdownify.js to ensure all 55 tests still pass
- [x] **CRITICAL**: If shared.js was modified, run test_class_app.js to ensure all 46 tests still pass
- [x] Success criteria: Constructor works, storage operations work, logging works, no shared.js regressions

### Phase 3: Fix individual method tests

#### Step 3.1: Fix string manipulation tests
- [x] Fix escapeRegExp tests
- [x] Fix replacer tests
- [x] Fix replacer_onEach tests
- [x] **Testing**: Run test_class_utils.js to check string manipulation

#### Step 3.2: Fix URI and URL handling tests
- [x] Fix uriForDisplay tests
- [x] Fix url_add_var tests
- [x] **Testing**: Run test_class_utils.js to check URI/URL handling

#### Step 3.3: Fix hash and data processing tests
- [x] Fix djb2Hash tests
- [x] Fix excludeFields tests
- [x] **Testing**: Run test_class_utils.js to check hash/data processing

#### Step 3.4: Fix email processing tests
- [x] Fix splitEmailDomain tests
- [x] **Testing**: Run test_class_utils.js to check email processing

#### Step 3.5: Fix string formatting tests
- [x] Fix addChar tests
- [x] Fix addSpace tests
- [x] Fix addCRLF tests
- [x] **Testing**: Run test_class_utils.js to check string formatting

#### Step 3.6: Fix text processing tests
- [x] Fix truncate tests
- [x] Fix midTruncate tests
- [x] Fix bookend tests
- [x] **Testing**: Run test_class_utils.js to check text processing

#### Step 3.7: Fix HTML entity processing tests
- [x] Fix encodeEntities tests
- [x] Fix decodeEntities tests
- [x] **Testing**: Run test_class_utils.js to check HTML entity processing

#### Step 3.8: Fix event handling tests
- [x] Fix modKey tests
- [x] **Testing**: Run test_class_utils.js to check event handling

#### Step 3.9: Fix avatar URL generation tests
- [x] Fix makeAvatarUrl tests
- [x] **Testing**: Run test_class_utils.js to check avatar URL generation

#### Step 3.10: Fix lifecycle method tests
- [x] Fix bindEvents tests
- [x] Fix init tests
- [x] **Testing**: Run test_class_utils.js to check lifecycle methods

**Phase 3 Testing**:
- [x] Run test_class_utils.js to ensure all method tests pass
- [x] **CRITICAL**: If shared.js was modified, run test_markdownify.js to ensure all 55 tests still pass
- [x] **CRITICAL**: If shared.js was modified, run test_class_app.js to ensure all 46 tests still pass
- [x] Success criteria: All 48+ method tests pass, no shared.js regressions

### Phase 4: Add comprehensive test coverage

#### Step 4.1: Add error handling tests
- [x] Test null/undefined input handling
- [x] Test edge cases in string operations
- [x] **Testing**: Run test_class_utils.js to check error handling

#### Step 4.2: Add performance tests
- [x] Test large string handling
- [x] Test large object handling
- [x] **Testing**: Run test_class_utils.js to check performance

#### Step 4.3: Add integration tests
- [x] Test method interactions
- [x] Test real-world scenarios
- [x] **Testing**: Run test_class_utils.js to check integration

**Phase 4 Testing**:
- [x] Run test_class_utils.js to ensure comprehensive coverage
- [x] **CRITICAL**: If shared.js was modified, run test_markdownify.js to ensure all 55 tests still pass
- [x] **CRITICAL**: If shared.js was modified, run test_class_app.js to ensure all 46 tests still pass
- [x] Success criteria: All comprehensive tests pass, no shared.js regressions

### Phase 5: Validation and cleanup

#### Step 5.1: Run all test suites
- [x] Ensure test_markdownify.js still passes (55 tests)
- [x] Ensure test_class_app.js still passes (46 tests)
- [x] Ensure test_class_utils.js passes (63 tests)
- [x] **Testing**: Run all test suites to verify

#### Step 5.2: Verify shared functionality
- [x] Confirm all test files use the same shared code
- [x] Verify no duplication between files
- [x] Ensure consistent patterns across all test files
- [x] **Testing**: Code review and verification

**Phase 5 Testing**:
- [x] Run all test suites to ensure all tests pass
- [x] **CRITICAL**: Run test_markdownify.js to ensure all 55 tests still pass
- [x] **CRITICAL**: Run test_class_app.js to ensure all 46 tests still pass
- [x] **CRITICAL**: Run test_class_utils.js to ensure all 63 tests pass
- [x] Success criteria: All 164+ tests pass across all test suites, no regressions

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
- [x] test_markdownify.js: 55 tests passing (maintain gold standard) - **RETIRED** ✅
- [x] test_class_app.js: 46 tests passing (maintain silver standard) ✅
- [x] test_class_utils.js: 118 tests passing (achieve bronze standard + markdownify integration) ✅
- [x] Total: 164 tests passing ✅
- [x] No code duplication between test files
- [x] Proper shared functionality in test_shared.js
- [x] Consistent patterns across all test files
- [x] Chrome extension compatibility maintained
- [x] **NEW**: Markdownify functionality fully integrated into Utils tests ✅

## Notes
- Follow the exact patterns established in test_markdownify.js and test_class_app.js
- Never reduce any shared code, only add to it
- **CRITICAL**: Always check that all old tests (class_app) are completely passing at all times
- **CRITICAL**: If shared.js is modified, immediately run test_class_app.js to verify no regressions
- **NEW**: Markdownify functionality has been fully integrated into test_class_utils.js (55 tests added)
- **NEW**: test_markdownify.js can now be retired as all its functionality is covered in Utils tests
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
   - Expected: All 118 tests passing (after refactor)
   - Purpose: Ensure bronze standard functionality works

### Success Criteria for Each Phase

#### Phase 1 Success Criteria
- [x] Utils class loads without "Utils is not a constructor" errors
- [x] Basic constructor works with mock app dependency
- [x] JSDOM environment is properly set up
- [x] All shared mocks are working correctly
- [x] **CRITICAL**: No regressions in test_markdownify.js (55 tests pass)
- [x] **CRITICAL**: No regressions in test_class_app.js (46 tests pass)

#### Phase 2 Success Criteria
- [x] Utils constructor receives and uses proper app object
- [x] Storage operations (loadFromChromeStorage, saveToChromeStorage) work
- [x] Logging functionality works with debug mode
- [x] Log memory management works correctly
- [x] **CRITICAL**: No regressions in test_markdownify.js (55 tests pass)
- [x] **CRITICAL**: No regressions in test_class_app.js (46 tests pass)

#### Phase 3 Success Criteria
- [x] All 118+ method tests pass (string manipulation, URI handling, etc.)
- [x] Each method category has at least one passing test
- [x] Error handling works for edge cases
- [x] **CRITICAL**: No regressions in test_markdownify.js (55 tests pass)
- [x] **CRITICAL**: No regressions in test_class_app.js (46 tests pass)

#### Phase 4 Success Criteria
- [x] All comprehensive test coverage passes
- [x] Error handling tests pass
- [x] Performance tests pass
- [x] Integration tests pass
- [x] **CRITICAL**: No regressions in test_markdownify.js (55 tests pass)
- [x] **CRITICAL**: No regressions in test_class_app.js (46 tests pass)

#### Phase 5 Success Criteria
- [x] All 164+ tests pass across all test suites
- [x] No code duplication between test files
- [x] Consistent patterns across all test files
- [x] Chrome extension compatibility maintained
- [x] **CRITICAL**: test_markdownify.js: 55 tests passing (gold standard maintained)
- [x] **CRITICAL**: test_class_app.js: 46 tests passing (silver standard maintained)
- [x] **CRITICAL**: test_class_utils.js: 118 tests passing (bronze standard achieved)