# Trello API Refactoring Plan

## Overview

Refactor Trello API calls from scattered locations into a centralized `class_trel.js` abstraction, following the pattern established by `class_goog.js`.

## Current State Analysis

### Trello API calls are currently located in:

1. **`class_model.js`** - 8+ direct `Trello.rest()` calls:

   - `loadTrelloUser()` - Line 388
   - `loadTrelloBoards()` - Line 415
   - `loadTrelloLists()` - Line 438
   - `loadTrelloCards()` - Line 461
   - `loadTrelloMembers()` - Line 484
   - `loadTrelloLabels()` - Line 507
   - `createCard()` - Line 551

2. **`Uploader` class** (in `class_model.js`) - 1 `Trello.rest()` call:

   - `upload()` method - Line 126

3. **Authorization logic** mixed with API calls:
   - `checkTrelloAuthorized()` - Line 358
   - `trelloLoad()` - Line 309

### Current Patterns:

- All calls use `Trello.rest()` method
- Authorization checks before each call (`if (!this.app.persist.trelloAuthorized)`)
- Success/failure callbacks with event emissions
- API key management in `class_app.js` (`this.trelloApiKey`)
- Token management handled by Trello library

## Proposed `class_trel.js` Implementation

### Core Responsibilities:

1. **API Key & Token Management** - Centralize `Trello.setKey()` and token handling
2. **Authorization Wrapper** - Handle OAuth flow with consistent error handling
3. **API Call Wrapper** - Wrap all `Trello.rest()` calls with logging and error handling
4. **Method Abstractions** - High-level methods for common operations
5. **Event Integration** - Emit standardized events for success/failure

### Key Methods:

```javascript
// Core API wrapper
wrapApiCall(method, path, params, successCallback, failureCallback);

// Authorization
authorize((interactive = false));
deauthorize();

// High-level methods
getUser();
getBoards();
getLists(boardId);
getCards(listId);
getMembers(boardId);
getLabels(boardId);
createCard(cardData);
uploadAttachment(cardId, attachmentData);
```

## Step-by-Step Refactoring Plan

### Phase 1: Foundation Setup

- [ ] **Step 1.1**: Create `chrome_manifest_v3/class_trel.js` with basic structure

  - [ ] Add class definition with constructor
  - [ ] Add static and instance `ck` properties
  - [ ] Add `bindEvents()` method
  - [ ] Add basic logging integration
  - [ ] Test: Verify class loads without errors

- [ ] **Step 1.2**: Add API key and token management

  - [ ] Add `setApiKey()` method
  - [ ] Add `getApiKey()` method
  - [ ] Add `isAuthorized()` method
  - [ ] Test: Verify API key management works

- [ ] **Step 1.3**: Create core API wrapper
  - [ ] Add `wrapApiCall()` method with error handling
  - [ ] Add authorization check before API calls
  - [ ] Add consistent logging for all API calls
  - [ ] Test: Verify wrapper handles errors correctly

### Phase 2: Authorization Methods

- [ ] **Step 2.1**: Add authorization methods

  - [ ] Add `authorize()` method (interactive/non-interactive)
  - [ ] Add `deauthorize()` method
  - [ ] Add authorization event handlers
  - [ ] Test: Verify authorization flow works

- [ ] **Step 2.2**: Add authorization success/failure handlers
  - [ ] Add `authorize_success()` method
  - [ ] Add `authorize_failure()` method
  - [ ] Add `authorize_popup_failure()` method
  - [ ] Test: Verify all authorization scenarios work

### Phase 3: Core API Methods

- [ ] **Step 3.1**: Add user data methods

  - [ ] Add `getUser()` method
  - [ ] Add `getUser_success()` handler
  - [ ] Add `getUser_failure()` handler
  - [ ] Test: Verify user data retrieval works

- [ ] **Step 3.2**: Add board methods

  - [ ] Add `getBoards()` method
  - [ ] Add `getBoards_success()` handler
  - [ ] Add `getBoards_failure()` handler
  - [ ] Test: Verify board data retrieval works

- [ ] **Step 3.3**: Add list methods

  - [ ] Add `getLists(boardId)` method
  - [ ] Add `getLists_success()` handler
  - [ ] Add `getLists_failure()` handler
  - [ ] Test: Verify list data retrieval works

- [ ] **Step 3.4**: Add card methods

  - [ ] Add `getCards(listId)` method
  - [ ] Add `getCards_success()` handler
  - [ ] Add `getCards_failure()` handler
  - [ ] Test: Verify card data retrieval works

- [ ] **Step 3.5**: Add member methods

  - [ ] Add `getMembers(boardId)` method
  - [ ] Add `getMembers_success()` handler
  - [ ] Add `getMembers_failure()` handler
  - [ ] Test: Verify member data retrieval works

- [ ] **Step 3.6**: Add label methods
  - [ ] Add `getLabels(boardId)` method
  - [ ] Add `getLabels_success()` handler
  - [ ] Add `getLabels_failure()` handler
  - [ ] Test: Verify label data retrieval works

### Phase 4: Card Creation and Upload

- [ ] **Step 4.1**: Add card creation methods

  - [ ] Add `createCard(cardData)` method
  - [ ] Add `createCard_success()` handler
  - [ ] Add `createCard_failure()` handler
  - [ ] Test: Verify card creation works

- [ ] **Step 4.2**: Add attachment upload methods
  - [ ] Add `uploadAttachment(cardId, attachmentData)` method
  - [ ] Add `uploadAttachment_success()` handler
  - [ ] Add `uploadAttachment_failure()` handler
  - [ ] Test: Verify attachment upload works

### Phase 5: Integration with Model

- [ ] **Step 5.1**: Update `class_model.js` to use `class_trel`

  - [ ] Add `class_trel` instance to Model constructor
  - [ ] Update `trelloLoad()` to use `class_trel.authorize()`
  - [ ] Test: Verify Model can initialize `class_trel`

- [ ] **Step 5.2**: Migrate user and board methods

  - [ ] Update `loadTrelloUser()` to use `class_trel.getUser()`
  - [ ] Update `loadTrelloBoards()` to use `class_trel.getBoards()`
  - [ ] Keep original methods in place for now
  - [ ] Test: Verify user and board loading works

- [ ] **Step 5.3**: Migrate list and card methods

  - [ ] Update `loadTrelloLists()` to use `class_trel.getLists()`
  - [ ] Update `loadTrelloCards()` to use `class_trel.getCards()`
  - [ ] Keep original methods in place for now
  - [ ] Test: Verify list and card loading works

- [ ] **Step 5.4**: Migrate member and label methods

  - [ ] Update `loadTrelloMembers()` to use `class_trel.getMembers()`
  - [ ] Update `loadTrelloLabels()` to use `class_trel.getLabels()`
  - [ ] Keep original methods in place for now
  - [ ] Test: Verify member and label loading works

- [ ] **Step 5.5**: Migrate card creation
  - [ ] Update `createCard()` to use `class_trel.createCard()`
  - [ ] Keep original method in place for now
  - [ ] Test: Verify card creation works

### Phase 6: Update Uploader Class

- [ ] **Step 6.1**: Update Uploader to use `class_trel`

  - [ ] Pass `class_trel` instance to Uploader constructor
  - [ ] Update `attach()` method to use `class_trel.uploadAttachment()`
  - [ ] Keep original `attach()` method in place for now
  - [ ] Test: Verify Uploader works with `class_trel` integration

- [ ] **Step 6.2**: Update Model to use updated Uploader
  - [ ] Update `uploadAttachment()` method to pass `class_trel` to Uploader
  - [ ] Keep original method in place for now
  - [ ] Test: Verify attachment upload works through new structure

### Phase 7: Testing and Validation

- [ ] **Step 7.1**: Create comprehensive tests

  - [ ] Create `test/test_class_trel.js` with all method tests
  - [ ] Update `test/test_class_model.js` to test new integration
  - [ ] Test: Verify all tests pass

- [ ] **Step 7.2**: Manual testing
  - [ ] Test full workflow: authorization → load data → create card → upload attachment
  - [ ] Test error scenarios: network failures, invalid tokens, etc.
  - [ ] Test: Verify all scenarios work correctly

### Phase 8: Cleanup

- [ ] **Step 8.1**: Remove original methods

  - [ ] Remove original Trello API calls from `class_model.js`
  - [ ] Remove original `attach()` method from Uploader class
  - [ ] Test: Verify no functionality is broken

- [ ] **Step 8.2**: Final validation
  - [ ] Run full test suite
  - [ ] Manual testing of complete workflow
  - [ ] Test: Verify everything works as expected

## Testing Strategy

### For Each Step:

1. **Unit Tests**: Test individual methods in isolation
2. **Integration Tests**: Test method interactions
3. **Manual Tests**: Test in actual Gmail environment
4. **Error Tests**: Test error handling and edge cases

### Test Files:

- `test/test_class_trel.js` - New test file for `class_trel`
- `test/test_class_model.js` - Updated to test new integration

### Test Scenarios:

- Authorization success/failure
- API call success/failure
- Network errors
- Invalid tokens
- Rate limiting
- Complete workflow testing

## Success Criteria

- [ ] All Trello API calls go through `class_trel`
- [ ] No direct `Trello.rest()` calls in other classes
- [ ] All existing functionality preserved
- [ ] All tests pass
- [ ] Error handling improved
- [ ] Logging consistent
- [ ] Code more maintainable

## Rollback Plan

If issues arise during refactoring:

1. Keep original methods in place until new methods are proven
2. Use feature flags to switch between old/new implementations
3. Maintain ability to revert to original implementation quickly
4. Test thoroughly before removing original code
