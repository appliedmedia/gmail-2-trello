# PopupView Refactor Progress

## Completed

### 1. Created PopupViewForm Class

- ✅ New file: `chrome_manifest_v3/views/class_popupViewForm.js`
- ✅ Basic constructor with parent and app references
- ✅ Form data validation methods
- ✅ UI update methods (boards, lists, cards, labels, members)
- ✅ Form display methods (messages, success/error states)
- ✅ Form event handlers
- ✅ Data binding methods

### 2. Updated PopupView to Use Form

- ✅ Added form initialization in constructor
- ✅ Added form.init() call in PopupView.init()
- ✅ Form class properly exported to G2T namespace

### 3. Method Move Process

**CRITICAL: Deprecated methods must keep original logic intact**

1. **COPY THE METHOD TO THE FORM CLASS**
2. **UPDATE THE CALLERS TO USE THE FORM VERSION OF THE METHOD**
3. **UPDATE THE METHOD NAME TO INCLUDE \_deprecated**
4. **LEAVE IT THE FUCK ALONE AND DONT TOUCH IT OR USE IT EVER AGAIN**
5. **UPDATE THE TESTS TO PROVE THE NEW METHOD IN THE FORM CLASS IS WORKING CORRECTLY**

**Example:**

```javascript
// Step 1: Copy method to form class
// Step 2: Update callers to use this.form.methodName()
// Step 3: Rename original to methodName_deprecated()
// Step 4: LEAVE IT ALONE FOREVER
// Step 5: Test form class method works
```

**Why this approach:**

- Preserves original behavior during transition
- Allows gradual migration
- Prevents breaking changes
- Enables rollback if needed

### 4. Methods Moved to Form Class

- ✅ `reset()` copied to forms, callers updated, original renamed `reset_deprecated`
- ✅ `clearBoard()` copied to forms, callers updated, original renamed `clearBoard_deprecated`
- ✅ `clearLabels()` copied to forms, callers updated, original renamed `clearLabels_deprecated`
- ✅ `clearMembers()` copied to forms, callers updated, original renamed `clearMembers_deprecated`
- ✅ `updateLabels()` copied to forms, callers updated, original renamed `updateLabels_deprecated`
- ✅ `updateLists()` copied to forms, callers updated, original renamed `updateLists_deprecated`
- ✅ `updateCards()` copied to forms, callers updated, original renamed `updateCards_deprecated`
- ✅ `updateMembers()` copied to forms, callers updated, original renamed `updateMembers_deprecated`
- ✅ `validateData()` copied to forms, callers updated, original renamed `validateData_deprecated`
- ✅ `handleSubmit()` copied to forms, event listeners moved to form class, original renamed `handleSubmit_deprecated`
- ✅ `handleCheckTrelloAuthorized()` copied to forms, event listeners moved to form class, original renamed `handleCheckTrelloAuthorized_deprecated`
- ✅ `handleRequestDeauthorizeTrello()` copied to forms, event listeners moved to form class, original renamed `handleRequestDeauthorizeTrello_deprecated`
- ✅ `handleLoadTrelloListSuccess()` copied to forms, event listeners moved to form class, original renamed `handleLoadTrelloListSuccess_deprecated`
- ✅ `handleLoadTrelloCardsSuccess()` copied to forms, event listeners moved to form class, original renamed `handleLoadTrelloCardsSuccess_deprecated`
- ✅ `handleLoadTrelloLabelsSuccess()` copied to forms, event listeners moved to form class, original renamed `handleLoadTrelloLabelsSuccess_deprecated`
- ✅ `handleLoadTrelloMembersSuccess()` copied to forms, event listeners moved to form class, original renamed `handleLoadTrelloMembersSuccess_deprecated`
- ✅ `bindData()` copied to forms, callers updated, original renamed `bindData_deprecated`
- ✅ `bindGmailData()` copied to forms, callers updated, original renamed `bindGmailData_deprecated`
- ✅ `updateBody()` copied to forms, callers updated, original renamed `updateBody_deprecated`
- ✅ `mime_array()` copied to forms, callers updated, original renamed `mime_array_deprecated`
- ✅ `mime_html()` copied to forms, callers updated, original renamed `mime_html_deprecated`
- ✅ `comboBox()` copied to forms, callers updated, original renamed `comboBox_deprecated`
- ✅ `submit()` copied to forms, callers updated, original renamed `submit_deprecated`
- ✅ `displaySubmitCompleteForm()` copied to forms, callers updated, original renamed `displaySubmitCompleteForm_deprecated`
- ✅ `displayAPIFailedForm()` copied to forms, callers updated, original renamed `displayAPIFailedForm_deprecated`
- ✅ `toggleCheckboxes()` copied to forms, callers updated, original renamed `toggleCheckboxes_deprecated`
- ✅ **RESTORED MISSING FUNCTIONALITY**: Added event handlers for `#g2tAttachHeader` and `#g2tImagesHeader` to toggle checkboxes with modifier key
- ✅ `updateBoards()` copied to forms, callers updated, original renamed `updateBoards_deprecated`
- ✅ `showMessage()` copied to forms, callers updated, original renamed `showMessage_deprecated`
- ✅ `hideMessage()` copied to forms, callers updated, original renamed `hideMessage_deprecated`

### 5. Testing

- ✅ Created Node.js test suite: `test/popupview_form_test.js`
- ✅ Tests cover constructor, initialization, data binding, validation, UI updates, form submission
- ✅ All tests passing

## Remaining Work

### 1. Continue Moving Methods to Form Class (Following Method Move Process)

Methods to move next:

- ✅ `validateData()` - complex method, needs careful migration
- ✅ `bindData()` - form data binding
- ✅ `bindGmailData()` - Gmail-specific data binding
- ✅ `updateBody()` - body content updates
- ✅ `mime_array()` - attachment handling
- ✅ `mime_html()` - attachment HTML generation
- ✅ `comboBox()` - autocomplete functionality
- ✅ `submit()` - form submission
- ✅ `displaySubmitCompleteForm()` - success display
- ✅ `displayAPIFailedForm()` - error display

### 2. Update Event Handlers

- ✅ Moved form-related event handlers to PopupViewForm
- ✅ Added bindEvents() method to PopupViewForm
- ✅ Moved event listeners to appropriate classes (form handlers → form class)
- ✅ Ensure proper event delegation between classes

### 3. Complex DOM Methods

Some methods have complex DOM manipulation that should stay in PopupView for now:

- `showMessage()` - complex DOM state management
- `updateLabels()` - complex button creation and event binding
- `updateMembers()` - complex member button creation
- `updateBoards()` - complex board organization logic
- `updateLists()` - complex list state management

### 4. State Management

- Ensure form class properly accesses parent state
- Handle state updates between classes
- Maintain data consistency

### 5. Integration Testing

- Test with actual Gmail integration
- Verify all form functionality works
- Test popup lifecycle with form

## Architecture Notes

### Current Structure

```
PopupView (parent)
├── PopupViewForm (child)
│   ├── Form validation
│   ├── UI updates
│   ├── Data binding
│   └── Event handlers
└── Popup lifecycle
    ├── Chrome API
    ├── DOM management
    └── Event system
```

### State Management

- Form class accesses parent state via `this.parent.state`
- Form class can update parent state directly
- Both classes share the same state object

### Event System

- Form class fires events via `this.app.events.fire()`
- PopupView listens to form events
- Form class handles form-specific events

## Next Steps

1. **Continue moving methods to form class** - Focus on simpler methods first
2. **Update event bindings** - Ensure form events are properly handled
3. **Test integration** - Verify form works with actual Gmail data
4. **Clean up deprecated methods** - Remove deprecated methods once proven working
5. **Documentation** - Update documentation for new architecture

## Goal Clarification

The primary goal is **refactoring** the large PopupView class into two focused classes:

- **PopupView** - popup lifecycle, events, chrome API
- **PopupViewForm** - form data, validation, UI updates

The deprecation process is merely a **follow-up step** to safely transition old methods after they've been moved to the form class. This ensures the refactor can be done gradually without breaking existing functionality.

## 📋 COMPREHENSIVE EVENT HANDLER AUDIT

### PopupViewForm Class

#### Event Handlers (Implemented)

| Handler                                        | Status    | Notes                 |
| ---------------------------------------------- | --------- | --------------------- |
| `handleBoardChanged(target, params)`           | ✅ EXISTS | Form-specific handler |
| `handleListChanged(target, params)`            | ✅ EXISTS | Form-specific handler |
| `handleSubmit()`                               | ✅ EXISTS | Form-specific handler |
| `handleCheckTrelloAuthorized()`                | ✅ EXISTS | Form-specific handler |
| `handleRequestDeauthorizeTrello()`             | ✅ EXISTS | Form-specific handler |
| `handleLoadTrelloListSuccess()`                | ✅ EXISTS | Form-specific handler |
| `handleLoadTrelloCardsSuccess()`               | ✅ EXISTS | Form-specific handler |
| `handleLoadTrelloLabelsSuccess()`              | ✅ EXISTS | Form-specific handler |
| `handleLoadTrelloMembersSuccess()`             | ✅ EXISTS | Form-specific handler |
| `handleAPIFailure(target, params)`             | ✅ EXISTS | Form-specific handler |
| `handleNewCardUploadsComplete(target, params)` | ✅ EXISTS | Form-specific handler |
| `handleOnMenuClick(target, params)`            | ✅ EXISTS | Form-specific handler |

#### Event Listeners (bindEvents)

| Event                          | Handler                          | Status   | Notes         |
| ------------------------------ | -------------------------------- | -------- | ------------- |
| `'onSubmit'`                   | `handleSubmit`                   | ✅ BOUND | Form-specific |
| `'checkTrelloAuthorized'`      | `handleCheckTrelloAuthorized`    | ✅ BOUND | Form-specific |
| `'onRequestDeauthorizeTrello'` | `handleRequestDeauthorizeTrello` | ✅ BOUND | Form-specific |
| `'onLoadTrelloListSuccess'`    | `handleLoadTrelloListSuccess`    | ✅ BOUND | Form-specific |
| `'onLoadTrelloCardsSuccess'`   | `handleLoadTrelloCardsSuccess`   | ✅ BOUND | Form-specific |
| `'onLoadTrelloLabelsSuccess'`  | `handleLoadTrelloLabelsSuccess`  | ✅ BOUND | Form-specific |
| `'onLoadTrelloMembersSuccess'` | `handleLoadTrelloMembersSuccess` | ✅ BOUND | Form-specific |
| `'onAPIFailure'`               | `handleAPIFailure`               | ✅ BOUND | Form-specific |
| `'newCardUploadsComplete'`     | `handleNewCardUploadsComplete`   | ✅ BOUND | Form-specific |
| `'onMenuClick'`                | `handleOnMenuClick`              | ✅ BOUND | Form-specific |

### PopupView Class

#### Event Handlers (Implemented)

| Handler                                               | Status    | Notes          |
| ----------------------------------------------------- | --------- | -------------- |
| `handleChromeAPIError(error, operation)`              | ✅ EXISTS | Popup-specific |
| `handlePopupVisible()`                                | ✅ EXISTS | Popup-specific |
| `handlePeriodicChecks()`                              | ✅ EXISTS | Popup-specific |
| `handleDetectButton()`                                | ✅ EXISTS | Popup-specific |
| `handleBeforeAuthorize()`                             | ✅ EXISTS | Popup-specific |
| `handleAuthorizeFail()`                               | ✅ EXISTS | Popup-specific |
| `handleAuthorized()`                                  | ✅ EXISTS | Popup-specific |
| `handleBeforeLoadTrello()`                            | ✅ EXISTS | Popup-specific |
| `handleTrelloDataReady()`                             | ✅ EXISTS | Popup-specific |
| `handleRuntimeMessage(request, sender, sendResponse)` | ✅ EXISTS | Popup-specific |
| `handlePopupViewInitDone()`                           | ✅ EXISTS | Popup-specific |
| `handlePopupLoaded()`                                 | ✅ EXISTS | Popup-specific |

#### Event Handlers (Deprecated - Should NOT be used)

| Handler                                                   | Status        | Notes             |
| --------------------------------------------------------- | ------------- | ----------------- |
| `handleBoardChanged_deprecated(target, params)`           | ❌ DEPRECATED | Should be removed |
| `handleListChanged_deprecated(target, params)`            | ❌ DEPRECATED | Should be removed |
| `handleSubmit_deprecated()`                               | ❌ DEPRECATED | Should be removed |
| `handleCheckTrelloAuthorized_deprecated()`                | ❌ DEPRECATED | Should be removed |
| `handleRequestDeauthorizeTrello_deprecated()`             | ❌ DEPRECATED | Should be removed |
| `handleLoadTrelloListSuccess_deprecated()`                | ❌ DEPRECATED | Should be removed |
| `handleLoadTrelloCardsSuccess_deprecated()`               | ❌ DEPRECATED | Should be removed |
| `handleLoadTrelloLabelsSuccess_deprecated()`              | ❌ DEPRECATED | Should be removed |
| `handleLoadTrelloMembersSuccess_deprecated()`             | ❌ DEPRECATED | Should be removed |
| `handleAPIFailure_deprecated(target, params)`             | ❌ DEPRECATED | Should be removed |
| `handleNewCardUploadsComplete_deprecated(target, params)` | ❌ DEPRECATED | Should be removed |
| `handleOnMenuClick_deprecated(target, params)`            | ❌ DEPRECATED | Should be removed |

#### Event Listeners (bindEvents + bindPopupEvents)

| Event                      | Handler                   | Status   | Notes          |
| -------------------------- | ------------------------- | -------- | -------------- |
| `'popupLoaded'`            | `handlePopupLoaded`       | ✅ BOUND | Popup-specific |
| `'classPopupViewInitDone'` | `handlePopupViewInitDone` | ✅ BOUND | Popup-specific |
| `'onPopupVisible'`         | `handlePopupVisible`      | ✅ BOUND | Popup-specific |
| `'periodicChecks'`         | `handlePeriodicChecks`    | ✅ BOUND | Popup-specific |
| `'detectButton'`           | `handleDetectButton`      | ✅ BOUND | Popup-specific |
| `'onBeforeAuthorize'`      | `handleBeforeAuthorize`   | ✅ BOUND | Popup-specific |
| `'onAuthorizeFail'`        | `handleAuthorizeFail`     | ✅ BOUND | Popup-specific |
| `'onAuthorized'`           | `handleAuthorized`        | ✅ BOUND | Popup-specific |
| `'onBeforeLoadTrello'`     | `handleBeforeLoadTrello`  | ✅ BOUND | Popup-specific |
| `'onTrelloDataReady'`      | `handleTrelloDataReady`   | ✅ BOUND | Popup-specific |
| `chrome.runtime.onMessage` | `handleRuntimeMessage`    | ✅ BOUND | Popup-specific |

#### Event Listeners (PROBLEMATIC - Binding to non-existent handlers)

| Event                          | Handler                          | Status     | Notes                     |
| ------------------------------ | -------------------------------- | ---------- | ------------------------- |
| `'onBoardChanged'`             | `handleBoardChanged`             | ❌ MISSING | Only `_deprecated` exists |
| `'onListChanged'`              | `handleListChanged`              | ❌ MISSING | Only `_deprecated` exists |
| `'onSubmit'`                   | `handleSubmit`                   | ❌ MISSING | Only `_deprecated` exists |
| `'checkTrelloAuthorized'`      | `handleCheckTrelloAuthorized`    | ❌ MISSING | Only `_deprecated` exists |
| `'onRequestDeauthorizeTrello'` | `handleRequestDeauthorizeTrello` | ❌ MISSING | Only `_deprecated` exists |
| `'newCardUploadsComplete'`     | `handleNewCardUploadsComplete`   | ❌ MISSING | Only `_deprecated` exists |
| `'onLoadTrelloListSuccess'`    | `handleLoadTrelloListSuccess`    | ❌ MISSING | Only `_deprecated` exists |
| `'onLoadTrelloCardsSuccess'`   | `handleLoadTrelloCardsSuccess`   | ❌ MISSING | Only `_deprecated` exists |
| `'onLoadTrelloLabelsSuccess'`  | `handleLoadTrelloLabelsSuccess`  | ❌ MISSING | Only `_deprecated` exists |
| `'onLoadTrelloMembersSuccess'` | `handleLoadTrelloMembersSuccess` | ❌ MISSING | Only `_deprecated` exists |
| `'onAPIFailure'`               | `handleAPIFailure`               | ❌ MISSING | Only `_deprecated` exists |
| `'onMenuClick'`                | `handleOnMenuClick`              | ❌ MISSING | Only `_deprecated` exists |

## 🔍 PROPER REFACTOR PROCESS

### Step 1: Clarify Where Each Routine Should Exist

Cross-reference with POPUPVIEW_REFACTOR.md PLAN to determine correct class placement

### Step 2: Ensure addListener and Routine Exist in Correct Class

Verify event bindings match the handlers in the same class

### Step 3: Remove Old Code

Only after Steps 1 & 2 are complete, remove deprecated/duplicate code

## 📋 HANDLER PLACEMENT vs PLAN

### PopupView Handlers - PLAN vs ACTUAL

| Handler                     | PLAN Location | ACTUAL Location | Status     | Notes              |
| --------------------------- | ------------- | --------------- | ---------- | ------------------ |
| `handlePopupVisible()`      | ✅ PopupView  | ✅ PopupView    | ✅ CORRECT | Popup lifecycle    |
| `handlePeriodicChecks()`    | ✅ PopupView  | ✅ PopupView    | ✅ CORRECT | Popup lifecycle    |
| `handleDetectButton()`      | ✅ PopupView  | ✅ PopupView    | ✅ CORRECT | Popup lifecycle    |
| `handleBeforeAuthorize()`   | ✅ PopupView  | ✅ PopupView    | ✅ CORRECT | Authorization flow |
| `handleAuthorizeFail()`     | ✅ PopupView  | ✅ PopupView    | ✅ CORRECT | Authorization flow |
| `handleAuthorized()`        | ✅ PopupView  | ✅ PopupView    | ✅ CORRECT | Authorization flow |
| `handleBeforeLoadTrello()`  | ✅ PopupView  | ✅ PopupView    | ✅ CORRECT | Authorization flow |
| `handleTrelloDataReady()`   | ✅ PopupView  | ✅ PopupView    | ✅ CORRECT | Authorization flow |
| `handleRuntimeMessage()`    | ✅ PopupView  | ✅ PopupView    | ✅ CORRECT | Chrome API         |
| `handlePopupViewInitDone()` | ✅ PopupView  | ✅ PopupView    | ✅ CORRECT | Popup lifecycle    |
| `handlePopupLoaded()`       | ✅ PopupView  | ✅ PopupView    | ✅ CORRECT | Popup lifecycle    |
| `handleChromeAPIError()`    | ✅ PopupView  | ✅ PopupView    | ✅ CORRECT | Chrome API         |

### PopupViewForm Handlers - PLAN vs ACTUAL

| Handler                            | PLAN Location    | ACTUAL Location  | Status     | Notes         |
| ---------------------------------- | ---------------- | ---------------- | ---------- | ------------- |
| `handleBoardChanged()`             | ✅ PopupViewForm | ✅ PopupViewForm | ✅ CORRECT | Form-specific |
| `handleListChanged()`              | ✅ PopupViewForm | ✅ PopupViewForm | ✅ CORRECT | Form-specific |
| `handleSubmit()`                   | ✅ PopupViewForm | ✅ PopupViewForm | ✅ CORRECT | Form-specific |
| `handleCheckTrelloAuthorized()`    | ✅ PopupViewForm | ✅ PopupViewForm | ✅ CORRECT | Form-specific |
| `handleRequestDeauthorizeTrello()` | ✅ PopupViewForm | ✅ PopupViewForm | ✅ CORRECT | Form-specific |
| `handleLoadTrelloListSuccess()`    | ✅ PopupViewForm | ✅ PopupViewForm | ✅ CORRECT | Form-specific |
| `handleLoadTrelloCardsSuccess()`   | ✅ PopupViewForm | ✅ PopupViewForm | ✅ CORRECT | Form-specific |
| `handleLoadTrelloLabelsSuccess()`  | ✅ PopupViewForm | ✅ PopupViewForm | ✅ CORRECT | Form-specific |
| `handleLoadTrelloMembersSuccess()` | ✅ PopupViewForm | ✅ PopupViewForm | ✅ CORRECT | Form-specific |
| `handleAPIFailure()`               | ✅ PopupViewForm | ✅ PopupViewForm | ✅ CORRECT | Form-specific |
| `handleNewCardUploadsComplete()`   | ✅ PopupViewForm | ✅ PopupViewForm | ✅ CORRECT | Form-specific |
| `handleOnMenuClick()`              | ✅ PopupViewForm | ✅ PopupViewForm | ✅ CORRECT | Form-specific |

## 🔄 DUPLICATE HANDLERS ANALYSIS

### Handlers That Exist in Both Classes

| Handler                          | PopupView Status | PopupViewForm Status | Functional Equivalence | Should Stay In | Action Required       |
| -------------------------------- | ---------------- | -------------------- | ---------------------- | -------------- | --------------------- |
| `handleBoardChanged`             | ❌ `_deprecated` | ✅ Active            | ❌ DIFFERENT           | PopupViewForm  | Remove from PopupView |
| `handleListChanged`              | ❌ `_deprecated` | ✅ Active            | ❌ DIFFERENT           | PopupViewForm  | Remove from PopupView |
| `handleSubmit`                   | ❌ `_deprecated` | ✅ Active            | ✅ EQUIVALENT          | PopupViewForm  | Remove from PopupView |
| `handleCheckTrelloAuthorized`    | ❌ `_deprecated` | ✅ Active            | ✅ EQUIVALENT          | PopupViewForm  | Remove from PopupView |
| `handleRequestDeauthorizeTrello` | ❌ `_deprecated` | ✅ Active            | ✅ EQUIVALENT          | PopupViewForm  | Remove from PopupView |
| `handleLoadTrelloListSuccess`    | ❌ `_deprecated` | ✅ Active            | ✅ EQUIVALENT          | PopupViewForm  | Remove from PopupView |
| `handleLoadTrelloCardsSuccess`   | ❌ `_deprecated` | ✅ Active            | ✅ EQUIVALENT          | PopupViewForm  | Remove from PopupView |
| `handleLoadTrelloLabelsSuccess`  | ❌ `_deprecated` | ✅ Active            | ✅ EQUIVALENT          | PopupViewForm  | Remove from PopupView |
| `handleLoadTrelloMembersSuccess` | ❌ `_deprecated` | ✅ Active            | ✅ EQUIVALENT          | PopupViewForm  | Remove from PopupView |
| `handleAPIFailure`               | ❌ `_deprecated` | ✅ Active            | ✅ EQUIVALENT          | PopupViewForm  | Remove from PopupView |
| `handleNewCardUploadsComplete`   | ❌ `_deprecated` | ✅ Active            | ❌ DIFFERENT           | PopupViewForm  | Remove from PopupView |
| `handleOnMenuClick`              | ❌ `_deprecated` | ✅ Active            | ❌ DIFFERENT           | PopupViewForm  | Remove from PopupView |

### Functional Equivalence Analysis

#### ❌ DIFFERENT - Need Investigation

- **`handleBoardChanged`**:
  - Deprecated: Calls `this.app.model.loadTrelloLists(boardId)` directly
  - Active: Sets `this.parent.state.boardId` and fires `boardChanged` event
  - **ISSUE**: No listeners for `boardChanged` event found - this is a stub!
- **`handleListChanged`**:
  - Deprecated: Calls `this.app.model.loadTrelloCards(listId)` directly
  - Active: Sets `this.parent.state.listId` and fires `listChanged` event
  - **ISSUE**: No listeners for `listChanged` event found - this is a stub!
- **`handleNewCardUploadsComplete`**:
  - Deprecated: Calls `this.form.displaySubmitCompleteForm(params)` + fires `postCardCreateUploadDisplayDone` event
  - Active: Only calls `this.displaySubmitCompleteForm(params)`
  - **ISSUE**: Missing `postCardCreateUploadDisplayDone` event (Model listens to this)
- **`handleOnMenuClick`**:
  - Deprecated: Calls `this.form.validateData()`
  - Active: Fires `menuClick` event
  - **ISSUE**: No listeners for `menuClick` event found - this is a stub!

#### ✅ EQUIVALENT - Safe to Remove Deprecated

- **`handleSubmit`**: Both call `this.app.model.submit(this.parent.state)` / `this.app.model.submit(this.state)`
- **`handleCheckTrelloAuthorized`**: Both call `showMessage` + `checkTrelloAuthorized()`
- **`handleRequestDeauthorizeTrello`**: Both call `deauthorizeTrello()` + `clearBoard()`
- **`handleLoadTrelloListSuccess`**: Both call `updateLists()` + `validateData()`
- **`handleLoadTrelloCardsSuccess`**: Both call `updateCards()` + `validateData()`
- **`handleLoadTrelloLabelsSuccess`**: Both call `updateLabels()` + `validateData()`
- **`handleLoadTrelloMembersSuccess`**: Both call `updateMembers()` + `validateData()`
- **`handleAPIFailure`**: Both call `displayAPIFailedForm(params)`

### Event Flow Analysis

#### Current Event Chain (Working):

1. **DOM Change** → `onBoardChanged` event → `handleBoardChanged_deprecated` → `loadTrelloLists()`
2. **DOM Change** → `onListChanged` event → `handleListChanged_deprecated` → `loadTrelloCards()`
3. **Card Complete** → `handleNewCardUploadsComplete_deprecated` → `displaySubmitCompleteForm()` + `postCardCreateUploadDisplayDone` → Model listens and fires `cardCreationComplete`
4. **Menu Click** → `handleOnMenuClick_deprecated` → `validateData()`

#### New Event Chain (Broken):

1. **DOM Change** → `onBoardChanged` event → `handleBoardChanged` → fires `boardChanged` → **NO LISTENERS**
2. **DOM Change** → `onListChanged` event → `handleListChanged` → fires `listChanged` → **NO LISTENERS**
3. **Card Complete** → `handleNewCardUploadsComplete` → `displaySubmitCompleteForm()` → **MISSING `postCardCreateUploadDisplayDone`**
4. **Menu Click** → `handleOnMenuClick` → fires `menuClick` → **NO LISTENERS**

## 🚨 EVENT BINDING ISSUES

### PopupView Event Bindings - PROBLEMATIC

| Event                          | Handler                          | Handler Exists?            | Should Be Bound Here?              | Issue                           |
| ------------------------------ | -------------------------------- | -------------------------- | ---------------------------------- | ------------------------------- |
| `'onBoardChanged'`             | `handleBoardChanged`             | ❌ NO (only `_deprecated`) | ❌ NO (should be in PopupViewForm) | Binding to non-existent handler |
| `'onListChanged'`              | `handleListChanged`              | ❌ NO (only `_deprecated`) | ❌ NO (should be in PopupViewForm) | Binding to non-existent handler |
| `'onSubmit'`                   | `handleSubmit`                   | ❌ NO (only `_deprecated`) | ❌ NO (should be in PopupViewForm) | Binding to non-existent handler |
| `'checkTrelloAuthorized'`      | `handleCheckTrelloAuthorized`    | ❌ NO (only `_deprecated`) | ❌ NO (should be in PopupViewForm) | Binding to non-existent handler |
| `'onRequestDeauthorizeTrello'` | `handleRequestDeauthorizeTrello` | ❌ NO (only `_deprecated`) | ❌ NO (should be in PopupViewForm) | Binding to non-existent handler |
| `'newCardUploadsComplete'`     | `handleNewCardUploadsComplete`   | ❌ NO (only `_deprecated`) | ❌ NO (should be in PopupViewForm) | Binding to non-existent handler |
| `'onLoadTrelloListSuccess'`    | `handleLoadTrelloListSuccess`    | ❌ NO (only `_deprecated`) | ❌ NO (should be in PopupViewForm) | Binding to non-existent handler |
| `'onLoadTrelloCardsSuccess'`   | `handleLoadTrelloCardsSuccess`   | ❌ NO (only `_deprecated`) | ❌ NO (should be in PopupViewForm) | Binding to non-existent handler |
| `'onLoadTrelloLabelsSuccess'`  | `handleLoadTrelloLabelsSuccess`  | ❌ NO (only `_deprecated`) | ❌ NO (should be in PopupViewForm) | Binding to non-existent handler |
| `'onLoadTrelloMembersSuccess'` | `handleLoadTrelloMembersSuccess` | ❌ NO (only `_deprecated`) | ❌ NO (should be in PopupViewForm) | Binding to non-existent handler |
| `'onAPIFailure'`               | `handleAPIFailure`               | ❌ NO (only `_deprecated`) | ❌ NO (should be in PopupViewForm) | Binding to non-existent handler |
| `'onMenuClick'`                | `handleOnMenuClick`              | ❌ NO (only `_deprecated`) | ❌ NO (should be in PopupViewForm) | Binding to non-existent handler |

## ✅ CORRECTED ACTION PLAN

### Step 1: Add Missing Event Bindings to PopupViewForm

**Add these 2 missing event bindings to PopupViewForm's `bindEvents()` method:**

- `'onBoardChanged'` → `handleBoardChanged` (handler exists, binding missing)
- `'onListChanged'` → `handleListChanged` (handler exists, binding missing)

### Step 2: Verify All Event Bindings Exist in Correct Classes

**Confirm these 12 event bindings exist in PopupViewForm's `bindEvents()` method:**

- `'onSubmit'` → `handleSubmit` ✅
- `'checkTrelloAuthorized'` → `handleCheckTrelloAuthorized` ✅
- `'onRequestDeauthorizeTrello'` → `handleRequestDeauthorizeTrello` ✅
- `'onLoadTrelloListSuccess'` → `handleLoadTrelloListSuccess` ✅
- `'onLoadTrelloCardsSuccess'` → `handleLoadTrelloCardsSuccess` ✅
- `'onLoadTrelloLabelsSuccess'` → `handleLoadTrelloLabelsSuccess` ✅
- `'onLoadTrelloMembersSuccess'` → `handleLoadTrelloMembersSuccess` ✅
- `'onAPIFailure'` → `handleAPIFailure` ✅
- `'newCardUploadsComplete'` → `handleNewCardUploadsComplete` ✅
- `'onMenuClick'` → `handleOnMenuClick` ✅
- `'onBoardChanged'` → `handleBoardChanged` ❌ (NEED TO ADD)
- `'onListChanged'` → `handleListChanged` ❌ (NEED TO ADD)

### Step 3: Remove Problematic Event Bindings from PopupView

**ONLY AFTER Step 1 & 2 are complete, remove these 12 event bindings from PopupView's `bindPopupEvents()` method:**

- `'onBoardChanged'` → `handleBoardChanged`
- `'onListChanged'` → `handleListChanged`
- `'onSubmit'` → `handleSubmit`
- `'checkTrelloAuthorized'` → `handleCheckTrelloAuthorized`
- `'onRequestDeauthorizeTrello'` → `handleRequestDeauthorizeTrello`
- `'newCardUploadsComplete'` → `handleNewCardUploadsComplete`
- `'onLoadTrelloListSuccess'` → `handleLoadTrelloListSuccess`
- `'onLoadTrelloCardsSuccess'` → `handleLoadTrelloCardsSuccess`
- `'onLoadTrelloLabelsSuccess'` → `handleLoadTrelloLabelsSuccess`
- `'onLoadTrelloMembersSuccess'` → `handleLoadTrelloMembersSuccess`
- `'onAPIFailure'` → `handleAPIFailure`
- `'onMenuClick'` → `handleOnMenuClick`

### Step 4: Remove Deprecated Methods from PopupView

**ONLY AFTER Step 3 is complete, remove these 12 deprecated methods from PopupView:**

- `handleBoardChanged_deprecated`
- `handleListChanged_deprecated`
- `handleSubmit_deprecated`
- `handleCheckTrelloAuthorized_deprecated`
- `handleRequestDeauthorizeTrello_deprecated`
- `handleLoadTrelloListSuccess_deprecated`
- `handleLoadTrelloCardsSuccess_deprecated`
- `handleLoadTrelloLabelsSuccess_deprecated`
- `handleLoadTrelloMembersSuccess_deprecated`
- `handleAPIFailure_deprecated`
- `handleNewCardUploadsComplete_deprecated`
- `handleOnMenuClick_deprecated`

## 🎯 FINAL ARCHITECTURE

**PopupView (Core Popup Management):**

- Popup lifecycle events
- Chrome API events
- DOM management events
- Authorization flow events

**PopupViewForm (Form Management):**

- All form-related events
- Form validation events
- UI update events
- Form submission events

**Event Binding Rules:**

- Each class binds only to its own handlers
- No delegation between classes
- Clear separation of concerns
