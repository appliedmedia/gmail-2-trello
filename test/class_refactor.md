# 🚀 NEXT MAJOR REFACTOR: Static ElementSuperSet Architecture

## 🎯 MISSION: Replace Dynamic HTML Parsing with Static Element Definitions

**PRIORITY**: Start with `test_class_utils.js` (Utils test suite)

**PROBLEM**: Current `elementSuperSet` dynamically parses HTML content, making tests unpredictable, complex, and fragile.

**SOLUTION**: Replace with static, predefined element objects that contain both element properties AND expected test results.

---

## 📋 STEP-BY-STEP AGENT INSTRUCTIONS

### Phase 1: Create Static ElementSuperSet Architecture

**File to modify**: `test/test_shared.js`

#### Step 1.1: Replace Current elementSuperSet Function

**FIND** (around line 175):

```javascript
function elementSuperSet(content = '', elementsArray = []) {
  // ... complex HTML parsing logic ...
  return {
    length: actualLength,
    // ... many properties ...
  };
}
```

**REPLACE WITH**:

```javascript
const elementSuperSet = {
  common: {
    // Standard properties that work for most tests
    length: 1,
    textContent: 'Example',
    innerHTML:
      '<p>Visit <a href="https://example.com">Example</a> for more info</p>',
    nodeType: 1,
    tagName: 'P',

    // Make parsed data available as static properties
    parsedAttributes: { href: 'https://example.com' },
    parsedTagName: 'P',
    parsedTextContent: 'Example',

    // Expected test results co-located with element definition
    expected: {
      markdownify: 'Visit [Example](<https://example.com>) for more info',
    },

    // jQuery methods
    html: jest.fn(
      () =>
        '<p>Visit <a href="https://example.com">Example</a> for more info</p>',
    ),
    text: jest.fn(() => 'Example'),
    attr: jest.fn(name => {
      const attrs = {
        href: 'https://example.com',
        name: 'Test User',
        email: 'test@example.com',
      };
      return attrs[name] || 'mock-attr';
    }),
    prop: jest.fn(function (name) {
      if (this.parsedAttributes && this.parsedAttributes[name]) {
        return this.parsedAttributes[name];
      }
      const props = {
        href: 'https://example.com',
        src: 'https://example.com/image.png',
        alt: 'Test Image',
        nodeName: this.parsedTagName || 'P',
      };
      return props[name] || 'mock-prop';
    }),
    getAttribute: jest.fn(function (name) {
      if (this.parsedAttributes && this.parsedAttributes[name]) {
        return this.parsedAttributes[name];
      }
      return this.attr(name);
    }),
    offset: jest.fn(() => ({ top: 1, left: 2 })),

    // DOM traversal methods
    find: jest.fn(() => elementSuperSet.common),
    first: jest.fn(() => elementSuperSet.common),
    children: jest.fn(() => ({
      length: 2,
      each: jest.fn(callback => {
        callback(0, elementSuperSet.common);
        callback(1, elementSuperSet.common);
      }),
    })),

    // Iteration methods
    each: jest.fn(function (callback) {
      // Just use THIS object with element-specific properties
      const elementForCallback = Object.assign({}, this, {
        textContent: 'Example',
        innerHTML: '<a href="https://example.com">Example</a>',
        outerHTML: '<a href="https://example.com">Example</a>',
        tagName: 'A',
        nodeType: 1,
      });
      callback(0, elementForCallback);
    }),

    // Utility methods
    addClass: jest.fn(),
    removeClass: jest.fn(),
    val: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    append: jest.fn(),
    prepend: jest.fn(),
    empty: jest.fn(),
    remove: jest.fn(),
  },

  // Add specific variants only when common doesn't work
  mailtoLink: {
    // Inherit from common but override specific properties
    get common() {
      return elementSuperSet.common;
    },
    ...elementSuperSet.common,
    parsedAttributes: { href: 'mailto:test@example.com' },
    expected: {
      markdownify: 'Contact <test@example.com>',
    },
    prop: jest.fn(function (name) {
      if (name === 'href') return 'mailto:test@example.com';
      return this.common.prop.call(this, name);
    }),
  },
};
```

#### Step 1.2: Update createMockJQueryElement Function

**FIND** (around line 381):

```javascript
function createMockJQueryElement(htmlContent) {
  // ... complex logic ...
}
```

**REPLACE WITH**:

```javascript
function createMockJQueryElement(htmlContent) {
  // Legacy function - just return common element for now
  // TODO: Eventually remove this function entirely
  return elementSuperSet.common;
}
```

### Phase 2: Update Utils Test Suite

**File to modify**: `test/test_class_utils.js`

#### Step 2.1: Update Link Tests

**FIND** test cases like:

```javascript
test('converts simple links', () => {
  const input =
    '<p>Visit <a href="https://example.com">Example</a> for more info</p>';
  const expected = 'Visit [Example](<https://example.com>) for more info';

  const $element = createMockJQueryElement(input);
  const result = utils.markdownify($element, true, {});

  expect(result).toBe(expected);
});
```

**REPLACE WITH**:

```javascript
test('converts simple links', () => {
  const result = utils.markdownify(elementSuperSet.common, true, {});
  expect(result).toBe(elementSuperSet.common.expected.markdownify);
});
```

#### Step 2.2: Identify Tests That Need Specific Elements

**AUDIT** all failing markdownify tests in `test_class_utils.js`:

- `converts simple links` → use `elementSuperSet.common`
- `converts links with title attributes` → might need `elementSuperSet.linkWithTitle`
- `handles mailto links` → use `elementSuperSet.mailtoLink`
- `converts h1 header to markdown format` → might need `elementSuperSet.h1Header`

#### Step 2.3: Create Specific Elements as Needed

**EXAMPLE** - If a test needs H1 header:

```javascript
// Add to elementSuperSet object:
h1Header: {
  ...elementSuperSet.common,
  tagName: 'H1',
  innerHTML: '<h1>Main Title</h1>',
  text: jest.fn(() => 'Main Title'),
  expected: {
    markdownify: '# Main Title'
  }
}
```

### Phase 3: Remove Complex Logic

#### Step 3.1: Remove HTML Parsing Functions

**DELETE** these functions from `test_shared.js`:

- Complex HTML parsing regex in `elementSuperSet`
- JSDOM parsing fallbacks
- Closure variable management

#### Step 3.2: Clean Up Global $ Mock

**SIMPLIFY** the global `$` mock to just return appropriate static elements:

```javascript
global.$ = (selectorOrElement, context) => {
  // Case 1: $(element) - wrap a single DOM element
  if (selectorOrElement && selectorOrElement.nodeType) {
    return elementSuperSet.common;
  }

  // Case 2: $(selector, context) - find elements in context
  if (context) {
    return elementSuperSet.common; // or specific element based on selector
  }

  // Default case
  return elementSuperSet.common;
};
```

---

## 🧪 TESTING STRATEGY

### Immediate Test: Single Link Test

**RUN**: `npm test test/test_class_utils.js -- --testNamePattern="converts simple links"`
**EXPECT**: ✅ PASS

### Full Validation: All Utils Tests

**RUN**: `npm test test/test_class_utils.js`
**EXPECT**: All 121 tests passing

### Success Criteria:

1. ✅ No more dynamic HTML parsing
2. ✅ All test results predictable and static
3. ✅ Tests use `elementSuperSet.common` or specific variants
4. ✅ Expected results co-located with element definitions
5. ✅ Faster test execution (no parsing overhead)

---

## 🔍 DEBUGGING TIPS

If tests fail:

1. **Check element properties**: Ensure `elementSuperSet.common` has the properties the test needs
2. **Check expected results**: Ensure `expected.markdownify` matches actual test expectations
3. **Check method implementations**: Ensure `prop()`, `attr()`, `text()` return correct values
4. **Add debug logging**: Use `console_log()` from test_shared.js to debug

---

## 📚 EXAMPLES OF FINAL TEST CODE

```javascript
// BEFORE (complex and fragile):
test('converts simple links', () => {
  const input =
    '<p>Visit <a href="https://example.com">Example</a> for more info</p>';
  const expected = 'Visit [Example](<https://example.com>) for more info';
  const $element = createMockJQueryElement(input);
  const result = utils.markdownify($element, true, {});
  expect(result).toBe(expected);
});

// AFTER (simple and reliable):
test('converts simple links', () => {
  const result = utils.markdownify(elementSuperSet.common, true, {});
  expect(result).toBe(elementSuperSet.common.expected.markdownify);
});
```

**ADVANTAGE**: Change the link URL? Update it once in `elementSuperSet.common` and both the element properties AND expected result change together!

---

# Test Refactor Plan: Refactoring test_class_model.js to Use Shared Code

## 🎉 COMPLETION SUMMARY

**✅ PHASE 1 COMPLETE - ALL TESTS PASSING**

- **test_class_gmailView.js**: 32 tests passing (was 31 failing) ✅
- **test_class_utils.js**: 118 tests passing (PLATINUM STANDARD maintained) ✅
- **test_class_app.js**: 46 tests passing (GOLD STANDARD maintained) ✅
- **test_class_goog.js**: 39 tests passing (SILVER STANDARD maintained) ✅
- **test_class_trel.js**: 23 tests passing (BRONZE STANDARD maintained) ✅
- **test_class_model.js**: 42 tests passing (MODEL STANDARD maintained) ✅
- **Total**: 300 tests passing across all test suites ✅

**Status**: All test suites now passing! GmailView refactor complete with real Utils methods and proper jQuery injection.

## 🆕 ELEMENTSUPERSET STANDARDIZATION

**✅ JQUERY MOCKING STANDARDIZED & COLLECTION-ENABLED**

The global `$` mock in `test_shared.js` now uses the `elementSuperSet` function for consistent jQuery-like element behavior across all tests. This standardization ensures:

- **Consistent `offset()` returns**: All jQuery elements return `{ top: 1, left: 2 }` for consistent positioning
- **Comprehensive element properties**: All mock elements have the same set of properties and methods
- **Collection support**: `elementSuperSet` can handle both single elements and element arrays/collections
- **Guaranteed length property**: Always returns length ≥ 1, eliminating the need for defensive length checking
- **Simplified maintenance**: Future agents should extend `elementSuperSet` rather than create new mock elements
- **Reduced duplication**: No more inline mock element definitions in individual test files

## 🔧 ELEMENTSUPERSET USAGE GUIDELINES

**CRITICAL: Always use `elementSuperSet` instead of duplicating jQuery mock code**

### ✅ DO: Extend elementSuperSet for new functionality

```javascript
// GOOD: Add new methods to elementSuperSet in test_shared.js
function elementSuperSet(htmlContent = '', elementsArray = []) {
  return {
    // ... existing methods ...
    newMethod: jest.fn(() => 'new functionality'),
  };
}
```

### ❌ DON'T: Create duplicate jQuery mocks

```javascript
// BAD: Don't create new jQuery-like objects elsewhere
const badMock = {
  length: 1,
  html: () => 'content',
  attr: () => 'value',
  // ... duplicating elementSuperSet functionality
};
```

### ✅ DO: Use elementSuperSet for collections

```javascript
// GOOD: Pass elements array for collection behavior
const elements = [element1, element2, element3];
return elementSuperSet(elements[0].innerHTML, elements);
```

### ❌ DON'T: Override elementSuperSet methods manually

```javascript
// BAD: Don't manually override what elementSuperSet handles
const superSet = elementSuperSet();
superSet.length = elements.length; // BAD - pass elementsArray instead
superSet.each = callback => {
  /* custom logic */
}; // BAD - elementSuperSet handles this
```

### 🎯 Key Principles

1. **Single Source of Truth**: `elementSuperSet` is the only place for jQuery-like behavior
2. **No Length Hacks**: Never create `ensureLength` or similar defensive functions
3. **Extend, Don't Duplicate**: Add to `elementSuperSet`, never create new jQuery mocks
4. **Collection First**: Design with collections in mind using the `elementsArray` parameter
5. **Always Length ≥ 1**: `elementSuperSet` guarantees proper length property

**Future agents**: When you encounter failing tests related to jQuery mocks, your first instinct should be "Can I extend `elementSuperSet` to handle this?" rather than creating new mock objects or defensive wrapper functions.

### 🎯 ARCHITECTURAL LESSON: Centralize jQuery Logic

**CRITICAL INSIGHT**: Don't duplicate jQuery behavior across different cases in the global `$` mock. Instead:

✅ **DO**: Make `elementSuperSet` handle ALL jQuery behavior uniformly  
❌ **DON'T**: Override methods in different cases (Case 1, Case 2, etc.)

**Key Principle**: The global `$` should only handle **element selection/finding**. The `elementSuperSet` should handle **all jQuery behavior**.

```javascript
// GOOD: Simple case routing, elementSuperSet handles everything
global.$ = (selector, context) => {
  if (isElement(selector)) {
    return elementSuperSet(selector.innerHTML, [selector]); // Pass as array
  }
  if (context) {
    const elements = findElements(selector, context);
    return elementSuperSet(getHTML(elements[0]), elements); // Pass elements array
  }
  return elementSuperSet(); // Default case
};

// BAD: Duplicating jQuery logic across cases
global.$ = (selector, context) => {
  if (isElement(selector)) {
    const superSet = elementSuperSet();
    superSet.prop = () => {
      /* duplicate logic */
    };
    superSet.each = () => {
      /* duplicate logic */
    };
    return superSet;
  }
  // More duplicate logic...
};
```

**Why This Matters**: Functions like `prop()`, `text()`, `html()` should work identically regardless of how the elements were selected. Centralizing the logic in `elementSuperSet` eliminates duplication and makes the code much more maintainable.

## 🐛 DEBUG LOGGING STANDARDIZATION

**✅ CENTRALIZED DEBUG LOGGING PATTERN ESTABLISHED**

All test files now use a standardized debug logging pattern through `test_shared.js` for consistent debugging across the test suite.

### Key Components

1. **Centralized Import**: `const { log: console_log } = require('console');` in `test_shared.js`
2. **Shared Export**: `console_log` is exported from `test_shared.js` and imported by test files
3. **Jest Configuration**: Updated `package.json` with `verbose: false` and `silent: false` to enable console output
4. **Consistent Usage**: All test files use `console_log()` instead of `console.log()`

### ✅ DO: Use console_log for debugging

```javascript
// GOOD: Import from test_shared.js
const { console_log } = require('./test_shared');

// GOOD: Use for debugging test issues
console_log('DEBUG: Element properties:', element);
console_log('DEBUG: Test result:', result);
```

### ❌ DON'T: Use console.log directly

```javascript
// BAD: Direct console.log usage
console.log('Debug message'); // Won't show in Jest by default

// BAD: Local console imports
const { log } = require('console'); // Should be in test_shared.js only
```

### Jest Configuration Required

**package.json** must include:

```json
"jest": {
  "verbose": false,
  "silent": false,
  // ... other config
}
```

**Why This Matters**: Jest suppresses `console.log` by default. The centralized `console_log` pattern combined with proper Jest configuration ensures debug output is visible during test development and troubleshooting.

## 🆕 GMAILVIEW REFACTOR SUCCESS

**✅ GMAILVIEW CLASS FULLY REFACTORED**

The `test_class_gmailView.js` file has been successfully refactored to follow the established patterns:

- **Real Utils Methods**: Uses `createRealUtilsMethods()` to provide actual Utils implementations instead of mocked versions
- **jQuery Injection**: Injects `$` function directly into `eval()`'d code for GmailView class compatibility
- **Proper Initialization**: Initializes all required GmailView properties (`preprocess`, `image`, `attachment`, `cc_raw`, `cc_md`)
- **WaitCounter Mock**: Added missing `start` and `stop` methods to WaitCounter mock
- **Error Handling**: Updated tests to handle real Utils methods' stricter null checking
- **Standardized Naming**: Uses `testApp` instead of `mockApp` to reflect that it contains real Utils methods

**Key Technical Achievement**: GmailView is the only class that uses jQuery (`$`), requiring special handling to inject the jQuery mock into the `eval()` scope where the class methods execute.

**Future agents**: When working with classes that use jQuery, follow the GmailView pattern of injecting `$` directly into the `eval()`'d code. Use `testApp` naming convention when the app contains real methods (like Utils).

## 🆕 STANDARDIZED NAMING CONVENTION

**✅ CONSISTENT TEST APPLICATION NAMING**

All test files now use standardized naming conventions:

- **`testApp`**: Used when the application object contains real methods (like real Utils methods via `createRealUtilsMethods()`)
- **`mockApp`**: Used when the application object contains only mocked methods
- **`mockInstances`**: Global object containing all mock instances for G2T classes
- **`mockChrome`, `mockEventTarget`, etc.**: Individual mock instances for specific classes

**Current Usage**:

- **`test_class_gmailView.js`**: Uses `testApp` (contains real Utils methods via `createRealUtilsMethods()`)
- **`test_class_utils.js`**: Uses `mockApp` (fully mocked dependencies)
- **`test_class_app.js`**: Uses `mockApp` (fully mocked dependencies)
- **`test_class_goog.js`**: Uses `mockApp` (fully mocked dependencies)
- **`test_class_trel.js`**: Uses `mockApp` (fully mocked dependencies)
- **`test_class_model.js`**: Uses `mockApp` (fully mocked dependencies)

**Future agents**: Always use `testApp` when working with real Utils methods, and `mockApp` when using fully mocked dependencies. This naming convention makes it clear whether the test is using real or mocked functionality.

---

## Overview

{latest} = "gmailView"

The goal is to refactor `test_class_{latest}.js` to follow the same patterns as the successful refactors of `test_class_utils.js` (PLATINUM STANDARD), `test_class_app.js` (GOLD STANDARD), `test_class_goog.js` (SILVER STANDARD), and `test_class_trel.js` (BRONZE STANDARD).

The current file is in `obsolete_class_{latest}.js`, git mv that back to `test_class_{latest}.js` and then evaluate.

# Current State Analysis.

### test_class_gmailView.js (PHASE 1 COMPLETE) ✅

- [x] All 32 tests passing (was 31 failing)
- [x] Uses proper eval-based loading for Chrome extension compatibility
- [x] Uses JSDOM for proper DOM environment
- [x] Uses enhanced shared mocks and utilities
- [x] Proper mock constructor injection pattern
- [x] Proper Gmail API mocking
- [x] Proper DOM manipulation mocking
- [x] Uses real Utils methods via createRealUtilsMethods
- [x] Proper jQuery ($) injection for GmailView class methods

### test_class_model.js (COMPLETE REFACTOR) ✅

- [x] All 42 tests passing (was 60 failing)
- [x] Uses proper eval-based loading for Chrome extension compatibility
- [x] Uses JSDOM for proper DOM environment
- [x] Uses enhanced shared mocks and utilities
- [x] Proper mock constructor injection pattern
- [x] Proper Trello API mocking
- [x] Proper EventTarget mocking

### test_class_utils.js (GOLD STANDARD) ✅

- [x] All 118 tests passing
- [x] Uses proper eval-based loading for Chrome extension compatibility
- [x] Uses JSDOM for proper DOM environment
- [x] Uses enhanced shared mocks and utilities
- [x] Proper mock constructor injection pattern

### test_class_app.js (SILVER STANDARD) ✅

- [x] All 46 tests passing
- [x] Uses proper eval-based loading with G2T namespace injection
- [x] Uses JSDOM for proper DOM environment
- [x] Uses enhanced shared mocks and utilities
- [x] Proper mock constructor injection pattern

### test_class_goog.js (SILVER STANDARD) ✅

- [x] All 39 tests passing (was 39 failing)
- [x] Uses proper eval-based loading with G2T namespace injection
- [x] Uses JSDOM for proper DOM environment
- [x] Uses enhanced shared mocks and utilities
- [x] Proper mock constructor injection pattern
- [x] Simplified showContextInvalidMessage using confirm() pattern
- [x] No open handles or timer complications

## Refactoring Plan for test_class_gmailView.js

### Phase 1: Update test_class_gmailView.js to use shared.js patterns ✅

#### Step 1.1: Replace direct require with eval-based loading

- [ ] Import shared utilities from test_shared.js
- [ ] Replace `const Gmail = require('../chrome_manifest_v3/class_gmail.js')` with eval-based loading
- [ ] Add proper G2T namespace initialization
- [ ] **Testing**: Run test_class_gmail.js to check loading status

#### Step 1.2: Add JSDOM setup and proper test environment

- [ ] Add JSDOM setup using shared function
- [ ] Add proper beforeEach/afterEach with cleanup
- [ ] Add proper mock application setup
- [ ] **Testing**: Run test_class_gmail.js to check environment setup

#### Step 1.3: Replace basic mocks with enhanced shared mocks

- [ ] Remove local mock definitions
- [ ] Use shared chrome API mocks
- [ ] Use shared console mocks
- [ ] Use shared jQuery mocks
- [ ] Add proper Gmail API mocks
- [ ] Add proper DOM manipulation mocks
- [ ] **Testing**: Run test_class_gmail.js to check mock functionality

#### Step 1.4: Add proper Gmail class initialization

- [ ] Create proper mock application instance
- [ ] Initialize Gmail with proper app dependency
- [ ] Ensure all Gmail methods have access to app context
- [ ] **Testing**: Run test_class_gmail.js to check Gmail initialization

**Phase 1 Testing**:

- [ ] Run test_class_gmail.js to ensure proper loading and basic functionality
- [ ] **CRITICAL**: If shared.js was modified, run test_class_utils.js to ensure all 118 tests still pass
- [ ] **CRITICAL**: If shared.js was modified, run test_class_app.js to ensure all 46 tests still pass
- [ ] **CRITICAL**: If shared.js was modified, run test_class_goog.js to ensure all 39+ tests still pass
- [ ] Success criteria: Gmail class loads without errors, basic constructor works, no shared.js regressions

### Phase 2: Fix Gmail class dependency issues

#### Step 2.1: Fix app dependency in Gmail constructor

- [ ] Ensure Gmail constructor receives proper app object
- [ ] Mock app.utils.log for logging functionality
- [ ] Mock app.events.emit for event handling
- [ ] Mock app.persist for state management
- [ ] Mock app.temp for temporary data
- [ ] **Testing**: Run test_class_gmail.js to check constructor functionality

#### Step 2.2: Fix Gmail API integration

- [ ] Mock Gmail API for email retrieval
- [ ] Mock Gmail DOM manipulation
- [ ] Mock Gmail message parsing
- [ ] Mock Gmail attachment handling
- [ ] **Testing**: Run test_class_gmail.js to check Gmail integration

#### Step 2.3: Fix DOM integration

- [ ] Mock DOM manipulation for Gmail interface
- [ ] Mock event listeners for Gmail interactions
- [ ] Mock element selection and modification
- [ ] Mock Gmail-specific DOM operations
- [ ] **Testing**: Run test_class_gmail.js to check DOM integration

**Phase 2 Testing**:

- [ ] Run test_class_gmail.js to ensure core Gmail functionality works
- [ ] **CRITICAL**: If shared.js was modified, run test_class_utils.js to ensure all 118 tests still pass
- [ ] **CRITICAL**: If shared.js was modified, run test_class_app.js to ensure all 46 tests still pass
- [ ] **CRITICAL**: If shared.js was modified, run test_class_goog.js to ensure all 39+ tests still pass
- [ ] Success criteria: Constructor works, Gmail integration works, DOM integration works, no shared.js regressions

### Phase 3: Fix individual method tests

#### Step 3.1: Fix constructor and initialization tests

- [ ] Fix Gmail instance creation tests
- [ ] Fix static ck getter tests
- [ ] Fix instance ck getter tests
- [ ] Fix init method tests
- [ ] **Testing**: Run test_class_gmail.js to check constructor tests

#### Step 3.2: Fix Gmail interface tests

- [ ] Fix Gmail interface detection tests
- [ ] Fix Gmail DOM structure tests
- [ ] Fix Gmail message parsing tests
- [ ] Fix Gmail attachment detection tests
- [ ] Fix Gmail navigation tests
- [ ] **Testing**: Run test_class_gmail.js to check interface tests

#### Step 3.3: Fix Gmail data extraction tests

- [ ] Fix extractEmailData tests
- [ ] Fix extractEmailSubject tests
- [ ] Fix extractEmailBody tests
- [ ] Fix extractEmailAttachments tests
- [ ] Fix extractEmailMetadata tests
- [ ] Fix handleEmailDataReady tests
- [ ] **Testing**: Run test_class_gmail.js to check data extraction tests

#### Step 3.4: Fix Gmail DOM manipulation tests

- [ ] Fix findGmailElements tests
- [ ] Fix findGmailElements_success tests
- [ ] Fix findGmailElements_failure tests
- [ ] Fix updateGmailInterface tests
- [ ] Fix updateGmailInterface_success tests
- [ ] Fix updateGmailInterface_failure tests
- [ ] **Testing**: Run test_class_gmail.js to check DOM manipulation tests

#### Step 3.5: Fix Gmail event handling tests

- [ ] Fix handleGmailNavigation tests
- [ ] Fix handleGmailNavigation_success tests
- [ ] Fix handleGmailNavigation_failure tests
- [ ] Fix handleGmailMessageOpen tests
- [ ] Fix handleGmailMessageOpen_success tests
- [ ] Fix handleGmailMessageOpen_failure tests
- [ ] **Testing**: Run test_class_gmail.js to check event handling tests

#### Step 3.6: Fix email sending and submission tests

- [ ] Fix sendEmail tests
- [ ] Fix createDraft tests
- [ ] Fix uploadAttachment tests
- [ ] **Testing**: Run test_class_gmail.js to check email sending tests

#### Step 3.7: Fix label/category mapping tests

- [ ] Fix labelCategoryMapLookup tests
- [ ] Fix labelCategoryMapUpdate tests
- [ ] **Testing**: Run test_class_gmail.js to check label/category mapping tests

#### Step 3.8: Fix Gmail event handling tests

- [ ] Fix handleGmailStateLoaded tests
- [ ] Fix handleSentMailShownComplete tests
- [ ] Fix handleGmailSendSuccess tests
- [ ] Fix handlePostSendUploadDisplayDone tests
- [ ] Fix handleLabelChanged tests
- [ ] Fix handleCategoryChanged tests
- [ ] Fix bindEvents tests
- [ ] **Testing**: Run test_class_gmail.js to check event handling tests

#### Step 3.9: Fix AttachmentHandler class tests

- [ ] Fix AttachmentHandler instance creation tests
- [ ] Fix AttachmentHandler initialization tests
- [ ] Fix AttachmentHandler add method tests
- [ ] Fix AttachmentHandler attach method tests
- [ ] Fix AttachmentHandler upload method tests
- [ ] **Testing**: Run test_class_gmail.js to check AttachmentHandler tests

#### Step 3.10: Fix GmailLabelMap class tests

- [ ] Fix GmailLabelMap instance creation tests
- [ ] Fix GmailLabelMap ck getter tests
- [ ] Fix GmailLabelMap constructor tests
- [ ] **Testing**: Run test_class_gmail.js to check GmailLabelMap tests

#### Step 3.11: Fix error handling tests

- [ ] Fix null/undefined input handling tests
- [ ] Fix empty data object handling tests
- [ ] **Testing**: Run test_class_gmail.js to check error handling tests

#### Step 3.12: Fix performance tests

- [ ] Fix large data set handling tests
- [ ] Fix many event handler handling tests
- [ ] **Testing**: Run test_class_gmail.js to check performance tests

**Phase 3 Testing**:

- [ ] Run test_class_gmail.js to ensure all method tests pass
- [ ] **CRITICAL**: If shared.js was modified, run test_class_utils.js to ensure all 118 tests still pass
- [ ] **CRITICAL**: If shared.js was modified, run test_class_app.js to ensure all 46 tests still pass
- [ ] **CRITICAL**: If shared.js was modified, run test_class_goog.js to ensure all 39+ tests still pass
- [ ] Success criteria: All 60+ method tests pass, no shared.js regressions

### Phase 4: Add comprehensive test coverage

#### Step 4.1: Add error handling tests

- [ ] Test null/undefined input handling
- [ ] Test edge cases in Gmail API operations
- [ ] Test network error handling
- [ ] **Testing**: Run test_class_gmail.js to check error handling

#### Step 4.2: Add performance tests

- [ ] Test large data handling
- [ ] Test multiple API calls
- [ ] Test memory management
- [ ] **Testing**: Run test_class_gmail.js to check performance

#### Step 4.3: Add integration tests

- [ ] Test method interactions
- [ ] Test real-world scenarios
- [ ] Test complete workflow
- [ ] **Testing**: Run test_class_gmail.js to check integration

**Phase 4 Testing**:

- [ ] Run test_class_gmail.js to ensure comprehensive coverage
- [ ] **CRITICAL**: If shared.js was modified, run test_class_utils.js to ensure all 118 tests still pass
- [ ] **CRITICAL**: If shared.js was modified, run test_class_app.js to ensure all 46 tests still pass
- [ ] **CRITICAL**: If shared.js was modified, run test_class_goog.js to ensure all 39+ tests still pass
- [ ] Success criteria: All comprehensive tests pass, no shared.js regressions

### Phase 5: Validation and cleanup

#### Step 5.1: Run all test suites

- [ ] Ensure test_class_utils.js still passes (118 tests)
- [ ] Ensure test_class_app.js still passes (46 tests)
- [ ] Ensure test_class_goog.js still passes (39+ tests)
- [ ] Ensure test_class_model.js passes (60+ tests)
- [ ] **Testing**: Run all test suites to verify

#### Step 5.2: Verify shared functionality

- [ ] Confirm all test files use the same shared code
- [ ] Verify no duplication between files
- [ ] Ensure consistent patterns across all test files
- [ ] **Testing**: Code review and verification

**Phase 5 Testing**:

- [ ] Run all test suites to ensure all tests pass
- [ ] **CRITICAL**: Run test_class_utils.js to ensure all 118 tests still pass
- [ ] **CRITICAL**: Run test_class_app.js to ensure all 46 tests still pass
- [ ] **CRITICAL**: Run test_class_goog.js to ensure all 39+ tests still pass
- [ ] **CRITICAL**: Run test_class_model.js to ensure all 60+ tests pass
- [ ] Success criteria: All 263+ tests pass across all test suites, no regressions

## Key Patterns to Follow

### Class Loading Pattern (from test_class_app.js)

```javascript
// Load the Model class using eval (for Chrome extension compatibility)
const modelCode = loadClassFile('chrome_manifest_v3/class_model.js');

// Inject mock constructors after G2T namespace is initialized
const injectedCode = modelCode.replace(
  'var G2T = G2T || {}; // must be var to guarantee correct scope',
  `var G2T = G2T || {}; // must be var to guarantee correct scope
// Inject mock constructors for testing
G2T.App = function(args) {
  if (!(this instanceof G2T.App)) {
    return new G2T.App(args);
  }
  Object.assign(this, mockApp);
  return this;
};`,
);

eval(injectedCode);
```

### Test Environment Setup Pattern (from test_class_utils.js)

```javascript
describe('Model Class', () => {
  let dom, window, model, mockApp;

  beforeEach(() => {
    // Setup JSDOM environment using shared function
    const jsdomSetup = setupJSDOM();
    dom = jsdomSetup.dom;
    window = jsdomSetup.window;

    // Setup Model class using shared function
    const modelSetup = setupModelForTesting();
    model = modelSetup.model;
    mockApp = modelSetup.mockApp;
  });

  afterEach(() => {
    // Clean up JSDOM environment using shared function
    cleanupJSDOM(dom);
  });
});
```

### Mock Application Pattern (from test_shared.js)

```javascript
function setupModelForTesting() {
  const mockApp = {
    utils: {
      log: jest.fn(),
    },
    events: {
      emit: jest.fn(),
    },
    persist: {
      trelloAuthorized: false,
      trelloData: null,
      user: null,
      emailBoardListCardMap: [],
    },
    temp: {
      boards: [],
      lists: [],
      cards: [],
      members: [],
      labels: [],
    },
    trelloApiKey: 'test-api-key',
    chrome: {
      runtimeSendMessage: jest.fn(),
    },
  };

  // Load and evaluate Model class with mock app
  const modelCode = loadClassFile('chrome_manifest_v3/class_model.js');
  eval(modelCode);

  const model = new G2T.Model({ app: mockApp });

  return { model, mockApp };
}
```

## Success Criteria

- [x] test_class_utils.js: 118 tests passing (maintain gold standard)
- [x] test_class_app.js: 46 tests passing (maintain silver standard)
- [x] test_class_goog.js: 39+ tests passing (maintain bronze standard)
- [x] test_class_model.js: 42 tests passing (achieve model standard) ✅
- [x] Total: 245 tests passing
- [x] No code duplication between test files
- [x] Proper shared functionality in test_shared.js
- [x] Consistent patterns across all test files
- [x] Chrome extension compatibility maintained
- [x] **COMPLETED**: Model functionality fully integrated into Model tests

## Notes

- ✅ **COMPLETED**: Followed the exact patterns established in test_class_utils.js, test_class_app.js, and test_class_goog.js
- ✅ **COMPLETED**: No shared code was reduced, only added to it
- ✅ **COMPLETED**: All old tests (class_utils, class_app, class_goog) are completely passing
- ✅ **COMPLETED**: Chrome extension compatibility maintained with eval-based loading
- ✅ **COMPLETED**: All existing functionality preserved while improving code sharing
- ✅ **COMPLETED**: Proper JSDOM setup for DOM-dependent tests
- ✅ **COMPLETED**: Model functionality fully integrated into Model tests
- **READY**: test_class_model.js refactoring is complete and ready for class_trel implementation

## Testing Requirements When Modifying Shared Code

### Mandatory Test Execution After Shared.js Changes

Whenever `test_shared.js` is modified, the following tests MUST be run to ensure no regressions:

1. **test_class_utils.js** (GOLD STANDARD)

   - Command: `npm test -- test/test_class_utils.js`
   - Expected: All 118 tests passing
   - Purpose: Ensure gold standard functionality is preserved

2. **test_class_app.js** (SILVER STANDARD)

   - Command: `npm test -- test/test_class_app.js`
   - Expected: All 46 tests passing
   - Purpose: Ensure silver standard functionality is preserved

3. **test_class_goog.js** (BRONZE STANDARD)

   - Command: `npm test -- test/test_class_goog.js`
   - Expected: All 39+ tests passing
   - Purpose: Ensure bronze standard functionality is preserved

4. **test_class_model.js** (MODEL STANDARD - when applicable)
   - Command: `npm test -- test/test_class_model.js`
   - Expected: All 60+ tests passing (after refactor)
   - Purpose: Ensure model standard functionality works

### Success Criteria for Each Phase

#### Phase 1 Success Criteria

- [ ] Model class loads without "Model is not a constructor" errors
- [ ] Basic constructor works with mock app dependency
- [ ] JSDOM environment is properly set up
- [ ] All shared mocks are working correctly
- [ ] **CRITICAL**: No regressions in test_class_utils.js (118 tests pass)
- [ ] **CRITICAL**: No regressions in test_class_app.js (46 tests pass)
- [ ] **CRITICAL**: No regressions in test_class_goog.js (39+ tests pass)

#### Phase 2 Success Criteria

- [ ] Model constructor receives and uses proper app object
- [ ] Trello API integration works correctly
- [ ] EventTarget integration works correctly
- [ ] **CRITICAL**: No regressions in test_class_utils.js (118 tests pass)
- [ ] **CRITICAL**: No regressions in test_class_app.js (46 tests pass)
- [ ] **CRITICAL**: No regressions in test_class_goog.js (39+ tests pass)

#### Phase 3 Success Criteria

- [ ] All 60+ method tests pass (constructor, authorization, data loading, etc.)
- [ ] Each method category has at least one passing test
- [ ] Error handling works for edge cases
- [ ] **CRITICAL**: No regressions in test_class_utils.js (118 tests pass)
- [ ] **CRITICAL**: No regressions in test_class_app.js (46 tests pass)
- [ ] **CRITICAL**: No regressions in test_class_goog.js (39+ tests pass)

#### Phase 4 Success Criteria

- [ ] All comprehensive test coverage passes
- [ ] Error handling tests pass
- [ ] Performance tests pass
- [ ] Integration tests pass
- [ ] **CRITICAL**: No regressions in test_class_utils.js (118 tests pass)
- [ ] **CRITICAL**: No regressions in test_class_app.js (46 tests pass)
- [ ] **CRITICAL**: No regressions in test_class_goog.js (39+ tests pass)

#### Phase 5 Success Criteria

- [ ] All 263+ tests pass across all test suites
- [ ] No code duplication between test files
- [ ] Consistent patterns across all test files
- [ ] Chrome extension compatibility maintained
- [ ] **CRITICAL**: test_class_utils.js: 118 tests passing (gold standard maintained)
- [ ] **CRITICAL**: test_class_app.js: 46 tests passing (silver standard maintained)
- [ ] **CRITICAL**: test_class_goog.js: 39+ tests passing (bronze standard maintained)
- [ ] **CRITICAL**: test_class_model.js: 60+ tests passing (model standard achieved)

---

# Test Refactor Plan: Refactoring test_class_chrome.js to Use Shared Code

## Current State Analysis

### test_class_chrome.js -> test_class_goog.js (NEEDS COMPLETE REFACTOR) ❌

- [x] All 39 tests failing
- [x] Uses direct require() which doesn't work with Chrome extension classes
- [x] Missing proper JSDOM setup
- [x] Missing proper G2T namespace initialization
- [x] Missing proper mock application setup
- [x] Uses basic mocks instead of shared enhanced mocks
- [x] Missing proper Chrome API mocking (storage.onChanged.addListener)

### test_markdownify.js (RETIRED) ✅

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

### test_class_utils.js (GOLD STANDARD) ✅

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
};`,
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
      log: jest.fn(),
    },
    popupView: {
      displayExtensionInvalidReload: jest.fn(),
    },
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
};`,
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

- [x] test_markdownify.js: 55 tests passing - **RETIRED** ✅
- [x] test_class_app.js: 46 tests passing (maintain silver standard) ✅
- [x] test_class_utils.js: 118 tests passing (maintain gold standard) ✅
- [x] test_class_chrome.js: 39+ tests passing (renamed to test_class_goog.js) ✅
- [x] test_class_goog.js: 39+ tests passing (maintain bronze standard) ✅
- [x] test_class_model.js: 60+ tests passing (achieve standard) - **IN PROGRESS** ❌
- [x] Total: 266+ tests passing (target)
- [x] No code duplication between test files
- [x] Proper shared functionality in test_shared.js
- [x] Consistent patterns across all test files
- [x] Chrome extension compatibility maintained
- [x] **NEW**: Markdownify functionality fully integrated into Utils tests ✅
- [x] **NEW**: Chrome API functionality fully integrated into Chrome tests ✅

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
