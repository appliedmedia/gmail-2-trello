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
- [ ] Add JSDOM import and configuration
- [ ] Create proper DOM environment setup function
- [ ] Add cleanup function
- [ ] **Testing**: Run test_markdownify.js to ensure it still passes

#### Step 1.2: Enhance jQuery mocking
- [ ] Copy the sophisticated jQuery mock from test_markdownify.js
- [ ] Ensure it handles `$(selector, context)` pattern correctly
- [ ] Add proper element wrapping and text extraction
- [ ] **Testing**: Run test_markdownify.js to ensure it still passes

#### Step 1.3: Add Utils class loading mechanism
- [ ] Copy the Utils class loading pattern from test_markdownify.js
- [ ] Add proper eval-based loading for Chrome extension compatibility
- [ ] Add mock application setup
- [ ] **Testing**: Run test_markdownify.js to ensure it still passes

#### Step 1.4: Add proper test environment setup/teardown
- [ ] Create beforeEach/afterEach functions
- [ ] Ensure proper cleanup between tests
- [ ] **Testing**: Run test_markdownify.js to ensure it still passes

**Phase 1 Testing**: Run test_markdownify.js to ensure all 55 tests still pass

### Phase 2: Refactor test_markdownify.js to use shared.js

#### Step 2.1: Replace local setup with shared.js imports
- [ ] Import setup functions from shared.js
- [ ] Remove duplicate code
- [ ] Ensure all functionality is preserved
- [ ] **Testing**: Run test_markdownify.js to ensure all 55 tests still pass

#### Step 2.2: Update test structure
- [ ] Use shared beforeEach/afterEach
- [ ] Use shared jQuery mock
- [ ] Use shared Utils loading
- [ ] **Testing**: Run test_markdownify.js to ensure all 55 tests still pass

**Phase 2 Testing**: Run test_markdownify.js to ensure all 55 tests still pass

### Phase 3: Fix test_class_app.js to use enhanced shared.js

#### Step 3.1: Update test_class_app.js imports
- [ ] Import enhanced shared.js functions
- [ ] Use proper JSDOM setup
- [ ] **Testing**: Run test_class_app.js to check current state

#### Step 3.2: Fix failing tests
- [ ] Fix `app.persist.trelloUser` initialization (should be `null` not `undefined`)
- [ ] Fix `app.temp.attachments` initialization (should be `[]` not `undefined`)
- [ ] Fix `this.events.emit` mock (add proper emit function)
- [ ] **Testing**: Run test_class_app.js to ensure all tests pass

#### Step 3.3: Add missing functionality
- [ ] Ensure proper App class initialization
- [ ] Add proper event handling mocks
- [ ] Add proper state management
- [ ] **Testing**: Run test_class_app.js to ensure all tests pass

**Phase 3 Testing**: Run test_class_app.js to ensure all 46 tests pass

### Phase 4: Validation and cleanup

#### Step 4.1: Run both test suites
- [ ] Ensure test_markdownify.js still passes (55 tests)
- [ ] Ensure test_class_app.js passes (46 tests)
- [ ] **Testing**: Run both test suites to verify

#### Step 4.2: Verify shared functionality
- [ ] Confirm both test files use the same shared code
- [ ] Verify no duplication between files
- [ ] **Testing**: Code review and verification

**Phase 4 Testing**: Run both test suites to ensure all 101 tests pass

## Notes
- Move class app tests to the pattern markdownify tests use (create HTML elements directly)
- Abstract duplicate tests into shared tests with shared setup
- Maintain Chrome extension compatibility with eval-based loading
- Preserve all existing functionality while improving code sharing

## Success Criteria
- [ ] test_markdownify.js: 55 tests passing
- [ ] test_class_app.js: 46 tests passing  
- [ ] Total: 101 tests passing
- [ ] No code duplication between test files
- [ ] Proper shared functionality in test_shared.js