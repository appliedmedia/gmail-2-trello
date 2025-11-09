# Add-To-Card vs Add-After-Card Refactor Plan

## Overview

Refactor the card positioning mechanism to:
1. **Default behavior**: Always add comments/descriptions **TO** an existing card (using Trello's `idCardSource` parameter)
2. **Modified behavior**: When Option/Shift/Alt is pressed while clicking the card dropdown, switch to **AFTER** mode (positioning the new card below the selected card)
3. **Remove** the middle "To:/After:" dropdown entirely
4. **Add visual indicators** in the card dropdown to show current mode

## Current Implementation Analysis

### Position Dropdown (To Be Removed)

**Location**: `chrome_manifest_v3/views/popupView.html` lines 56-59

```html
<select id="g2tPosition" next-select="combo_g2tCard">
  <option value="below">below:</option>
  <option value="to">to:</option>
</select>
```

**State Management**:
- Stored in: `app.temp.position` (via change handler at `class_popupView.js:794-797`)
- Used during card creation to determine positioning

### Card Dropdown

**Location**: `chrome_manifest_v3/views/popupView.html` lines 60-63

```html
<select id="g2tCard" class="g2tWhere" next-select="addToTrello">
  <option value="">...please pick a list...</option>
</select>
```

**Change Handler**: `chrome_manifest_v3/views/class_popupView.js:632-645`
- Captures: `cardId`, `cardPos`, `cardMembers`, `cardLabels`
- Stored in `app.persist.cardId` and `app.temp.*`

### Position Logic (Obsolete Implementation)

**Old Logic** (from `archives/chrome_manifest_v2/model.js:323-351`):

```javascript
translatePosition: function (args) {
    let pos = "bottom";
    
    if (!this.cardId || this.cardId.length < 1 || this.cardId === "-1") {
        pos = "top";
    } else {
        const position_k = args.position || "below";
        const cardPos_k = parseInt(args.cardPos || 0, 10);
        
        switch (position_k) {
            case "below":
                if (cardPos_k) {
                    pos = cardPos_k + 1;  // Position after the card
                }
                break;
            case "to":
                pos = "at";  // This triggers idCardSource usage
                break;
        }
    }
    return pos;
}
```

**Current Implementation** (from `chrome_manifest_v3/class_trel.js:462-496`):
- Always sets `pos: 'top'` when creating cards
- Does not use `idCardSource` parameter
- Does not position cards relative to selected card

### Modifier Key Detection

**Location**: `chrome_manifest_v3/class_utils.js:803-829`

```javascript
modKey(event) {
    let retn = '';
    
    if (event.ctrlKey) {
        retn = 'ctrl-';
    } else if (event.altKey) {
        retn = 'alt-';
    } else if (event.shiftKey) {
        retn = 'shift-';
    } else if (event.metaKey) {
        retn = 'metakey-';
    }
    
    return retn;
}
```

**Current Usage**: Button click detection (`class_popupView.js:554`)

## Trello API Card Positioning

### Trello Card Creation Parameters

When creating a card via `POST /1/cards`:

- **`pos`** (string | number): Position of the card
  - `"top"`: Add to top of list
  - `"bottom"`: Add to bottom of list
  - number: Specific position (1-based)
  
- **`idCardSource`** (string): Card ID to copy from
  - When provided, creates a new card with content from source card
  - Used for "add to card" functionality
  - **This is how we'll implement "TO" mode**

### Positioning Strategy

1. **"TO" Mode (Default)**:
   - Use `idCardSource` parameter with selected card's ID
   - New content adds to existing card (comments, attachments, etc.)
   - Position doesn't matter since we're updating existing card

2. **"AFTER" Mode (Modifier Key Pressed)**:
   - Use `pos` parameter with `cardPos + 1`
   - Creates new card positioned after selected card
   - Do NOT use `idCardSource`

## Visual Indicators (Custom PNG Icons)

### Design Approach: Icon Column

Instead of Unicode characters, use custom PNG icons in a leftmost column that visually demonstrates the card positioning behavior.

### "TO" Mode Icon Design

**Concept**: Arrow pointing directly AT a card rectangle

```
Visual representation:
  →[▭]
  
Arrow points directly to the card, indicating "add TO this card"
```

**Design Specs**:
- Size: 16x16px or 20x20px (retina: 32x32 or 40x40)
- Arrow: Simple rightward arrow
- Rectangle: Thin vertical rectangle representing a card
- Spacing: Arrow tip touches or nearly touches the card rectangle
- Colors: Match existing UI (consider using Trello's green #61bd4f for the arrow)

### "AFTER" Mode Icon Design

**Concept**: Arrow curves around and points BELOW an elevated card rectangle

```
Visual representation:
    [▭]  ← card positioned higher
   ↓
  →╰
  
Arrow curves downward and right, pointing to space below the card
```

**Design Specs**:
- Size: 16x16px or 20x20px (retina: 32x32 or 40x40)
- Card rectangle: Positioned in upper portion of icon
- Arrow: Curves from left, goes down, points to space below card
- Alternative: Straight arrow pointing diagonally down-right below the card
- Colors: Consider using Trello's orange #ff9f1a for distinction from TO mode

### Alternative "AFTER" Mode Design (Simpler)

```
Visual representation:
  [▭]
  ↓
  →
  
Arrow points to space directly below the card
```

### Icon Placement in UI

**In Card Dropdown Options**:
```
<option value="card123">
  [icon as background-image or inline img] Card Name Goes Here
</option>
```

Or better, as a CSS column using `::before` pseudo-element:

```css
#g2tCard[data-mode="to"] option {
  background: url('images/icon-add-to-card-16.png') no-repeat left center;
  padding-left: 20px;
}

#g2tCard[data-mode="after"] option {
  background: url('images/icon-add-after-card-16.png') no-repeat left center;
  padding-left: 20px;
}
```

### Fallback Unicode Characters

For quick prototyping or if PNG implementation is delayed:
- **TO mode**: `→` (U+2192 RIGHTWARDS ARROW)
- **AFTER mode**: `↘` (U+2198 SOUTH EAST ARROW)

**Recommendation**: Create custom PNG icons as described above for maximum clarity and professional appearance. Start with Unicode fallback for rapid development, then replace with PNG icons.

## Implementation Plan

### Phase 1: State Management

#### 1.1 Add Mode Tracking

**File**: `chrome_manifest_v3/class_app.js` (or wherever app.temp is initialized)

Add new temp state:
```javascript
app.temp.cardInsertMode = 'to';  // 'to' or 'after'
```

#### 1.2 Remove Old Position State

**Files to Update**:
- Remove `app.temp.position` usage
- Remove position change handler in `class_popupView.js:794-797`

### Phase 2: HTML/UI Changes

#### 2.1 Remove Position Dropdown

**File**: `chrome_manifest_v3/views/popupView.html`

**Remove** lines 56-59:
```html
<select id="g2tPosition" next-select="combo_g2tCard">
  <option value="below">below:</option>
  <option value="to">to:</option>
</select>
```

**Update** line 53 to skip directly to card dropdown:
```html
<select id="g2tList" class="g2tWhere" next-select="combo_g2tCard">
```

#### 2.2 Add Mode Indicator to Card Options

**File**: `chrome_manifest_v3/views/class_popupForm.js`

**Update** `updateCards()` method (lines 441-485):

```javascript
updateCards(tempId = 0) {
    const new_k = '<option value="-1">(new card at top)</option>';
    
    const array_k = this.app.temp.cards || [];
    
    if (!array_k) {
        return;
    }
    
    const listId_k = $('#g2tList', this.parent.$popup).val();
    
    const prev_item_k =
        this.app.persist.listId == listId_k && this.app.persist.cardId
            ? this.app.persist.cardId
            : 0;
    
    const first_item_k = array_k.length ? array_k[0].id : 0;
    
    const updatePending_k = this.parent.updatesPending[0]?.cardId
        ? this.parent.updatesPending.shift().cardId
        : 0;
    
    const restoreId_k =
        updatePending_k || tempId || prev_item_k || first_item_k || 0;
    
    const $g2t = $('#g2tCard', this.parent.$popup);
    $g2t.html(new_k);
    
    // Get current mode
    const mode = this.app.temp.cardInsertMode || 'to';
    // Using Unicode for now, will be replaced by CSS background icons
    const modeIcon = mode === 'to' ? '→ ' : '↘ ';
    
    array_k.forEach(item => {
        const id_k = item.id;
        // Add mode icon prefix to card name
        const display_k = modeIcon + this.app.utils.truncate(item.name, 80, '...');
        const selected_k = id_k == restoreId_k;
        $g2t.append(
            $('<option>')
                .attr('value', id_k)
                .prop('pos', item.pos)
                .prop('members', item.idMembers)
                .prop('labels', item.idLabels)
                .prop('selected', selected_k)
                .append(display_k),
        );
    });
    
    $g2t.change();
}
```

### Phase 3: Event Handler Changes

#### 3.1 Add Modifier Key Detection to Card Dropdown

**File**: `chrome_manifest_v3/views/class_popupView.js`

**Update** card dropdown click/focus handler (add before line 632):

```javascript
// Detect modifier key on card dropdown interaction to set insert mode
$('#g2tCard', this.$popup)
  .off('mousedown focus')
  .on('mousedown focus', event => {
    const modKey = this.app.utils.modKey(event);
    const oldMode = this.app.temp.cardInsertMode;
    
    // Set mode based on modifier key
    if (modKey && (modKey.startsWith('alt-') || 
                   modKey.startsWith('shift-') || 
                   modKey === 'metakey-')) {
      this.app.temp.cardInsertMode = 'after';
    } else {
      this.app.temp.cardInsertMode = 'to';
    }
    
    // If mode changed, refresh the card list to update icons
    if (oldMode !== this.app.temp.cardInsertMode) {
      this.form.updateCards();
    }
  });
```

**Keep existing** change handler (lines 632-645) but add mode indicator refresh:

```javascript
$('#g2tCard', this.$popup)
  .off('change')
  .on('change', () => {
    const $card = $('#g2tCard', this.$popup).find(':selected').first();
    const cardId = $card.val() || '';
    this.app.persist.cardId = cardId;
    
    // Set card-derived temp values directly
    this.app.temp.cardPos = $card.prop('pos') || '';
    this.app.temp.cardMembers = $card.prop('members') || '';
    this.app.temp.cardLabels = $card.prop('labels') || '';
    
    if (this.form.comboBox) this.form.comboBox('updateValue');
  });
```

#### 3.2 Reset Mode on List Change

**File**: `chrome_manifest_v3/views/class_popupView.js`

**Update** list change handler (lines 607-614):

```javascript
const $list = $('#g2tList', this.$popup);
$list.off('change').on('change', () => {
  const listId = $list.val();
  this.app.persist.listId = listId;
  
  // Reset to default 'to' mode when list changes
  this.app.temp.cardInsertMode = 'to';
  
  this.form.updateSubmitAvailable();
  if (this.form.comboBox) this.form.comboBox('updateValue');
  this.app.events.emit('listChanged', { listId });
});
```

### Phase 4: Card Creation Logic

#### 4.1 Update Trel.createCard() Method

**File**: `chrome_manifest_v3/class_trel.js`

**Replace** `createCard()` method (lines 462-496):

```javascript
/**
 * Creates a new Trello card
 * @param {object} cardData - Card data including name, desc, idList, idBoard, etc.
 */
createCard(cardData) {
  // Handle null or undefined cardData
  if (!cardData) {
    this.app.events.emit('invalidFormData', { data: cardData });
    return;
  }

  const mode = cardData.insertMode || 'to';
  const selectedCardId = cardData.cardId;
  
  const data = {
    name: cardData.subject || 'No Subject',
    desc: cardData.body || '',
    idList: cardData.listId,
    idBoard: cardData.boardId,
  };
  
  // Handle positioning based on mode
  if (mode === 'to' && selectedCardId && selectedCardId !== '-1') {
    // "TO" mode: Add content to existing card using idCardSource
    data.idCardSource = selectedCardId;
    data.pos = 'top';  // Position doesn't matter when using idCardSource
  } else if (mode === 'after' && selectedCardId && selectedCardId !== '-1') {
    // "AFTER" mode: Create new card positioned after selected card
    const cardPos = parseInt(cardData.cardPos || 0, 10);
    data.pos = cardPos ? cardPos + 1 : 'bottom';
  } else {
    // No card selected or new card: Add to top
    data.pos = 'top';
  }

  if (cardData.labels && cardData.labels.length > 0) {
    data.idLabels = cardData.labels;
  }

  if (cardData.members && cardData.members.length > 0) {
    data.idMembers = cardData.members;
  }

  if (cardData.dueDate) {
    data.due = cardData.dueDate;
  }

  this.wrapApiCall(
    'post',
    'cards',
    data,
    this.createCard_success.bind(this, cardData),
    this.createCard_failure.bind(this),
  );
}
```

#### 4.2 Pass Mode to Card Creation

**File**: `chrome_manifest_v3/views/class_popupForm.js`

**Update** data assembly before submit (the commented-out `validateData()` section around lines 43-69 should be uncommented and used):

Make sure the submit flow includes:
```javascript
this.app.temp.newCard = {
    // ... existing fields ...
    insertMode: this.app.temp.cardInsertMode,
    cardId: this.app.persist.cardId,
    cardPos: this.app.temp.cardPos,
    // ... other fields ...
};
```

### Phase 5: Icon Design & CSS Styling

#### 5.1 Create PNG Icons

**Location**: `chrome_manifest_v3/images/`

**Files to create**:
- `icon-add-to-card-16.png` (16x16 standard)
- `icon-add-to-card-32.png` (32x32 retina)
- `icon-add-after-card-16.png` (16x16 standard)
- `icon-add-after-card-32.png` (32x32 retina)

**Design Tool**: Use existing image editor or online tool (Figma, Sketch, Photoshop, or even GIMP)

**TO Icon** (`icon-add-to-card`):
```
16x16 canvas
- Arrow (pixels 2-10): → pointing right
- Card rectangle (pixels 11-14): thin vertical rectangle [▭]
- Colors: Arrow in #61bd4f (Trello green), card in #c4c9cc (gray)
```

**AFTER Icon** (`icon-add-after-card`):
```
16x16 canvas
- Card rectangle (pixels 2-5, top): thin vertical rectangle [▭]
- Arrow (pixels 6-14): curves or points down-right
- Colors: Arrow in #ff9f1a (Trello orange), card in #c4c9cc (gray)
```

#### 5.2 Add CSS for Icon Display

**File**: `chrome_manifest_v3/style.css`

Add styles for mode indicator icons:

```css
/* Card insert mode indicators using PNG icons */
#g2tCard option {
  padding-left: 24px;  /* Space for icon */
  background-repeat: no-repeat;
  background-position: 2px center;
  background-size: 16px 16px;
}

/* TO mode - show "add to card" icon */
#g2tCard[data-mode="to"] option {
  background-image: url('../images/icon-add-to-card-16.png');
}

/* Retina support for TO mode */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  #g2tCard[data-mode="to"] option {
    background-image: url('../images/icon-add-to-card-32.png');
  }
}

/* AFTER mode - show "add after card" icon */
#g2tCard[data-mode="after"] option {
  background-image: url('../images/icon-add-after-card-16.png');
}

/* Retina support for AFTER mode */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  #g2tCard[data-mode="after"] option {
    background-image: url('../images/icon-add-after-card-32.png');
  }
}

/* Optional: Add border color for additional visual feedback */
#g2tCard[data-mode="to"] {
  border-left: 3px solid #61bd4f; /* Green for "add to" */
}

#g2tCard[data-mode="after"] {
  border-left: 3px solid #ff9f1a; /* Orange for "add after" */
}

/* Remove text prefix if using icons */
#g2tCard[data-mode="to"] option::before,
#g2tCard[data-mode="after"] option::before {
  content: none; /* Remove any text arrows if present */
}
```

**Note**: Some browsers don't support background images on `<option>` elements. If this is an issue, alternative approaches:
1. Use custom dropdown (jQuery UI selectmenu) - already in use with `g2t_combobox`
2. Add icon to the card name text (current Unicode approach)
3. Show icon indicator outside the dropdown next to it

#### 5.3 Update Card Dropdown with Data Attribute

**File**: `chrome_manifest_v3/views/class_popupForm.js`

In `updateCards()`, add data attribute:

```javascript
const $g2t = $('#g2tCard', this.parent.$popup);
$g2t.attr('data-mode', mode);  // Add this line
$g2t.html(new_k);
```

#### 5.4 Test Icon Display

Since `<option>` background images have limited browser support, verify the approach works in Chrome. If not:

**Fallback Approach**: Use the existing combobox widget (jQuery UI) which creates custom HTML and DOES support background images:

```javascript
// In comboBox initialization, add icon styling
$value.g2t_combobox({
  // existing options...
  create: function() {
    // Add icons to combobox dropdown items
    const mode = this.app.temp.cardInsertMode || 'to';
    $('.ui-menu-item', this).each(function() {
      $(this).addClass(`g2t-card-mode-${mode}`);
    });
  }
});
```

Then style `.ui-menu-item.g2t-card-mode-to` and `.ui-menu-item.g2t-card-mode-after` with background images.

### Phase 6: User Feedback

#### 6.1 Add Tooltip/Help Text

**File**: `chrome_manifest_v3/views/popupView.html`

Update card dropdown label area to include help text:

```html
<select id="g2tCard" class="g2tWhere" next-select="addToTrello" 
        title="Default: Add TO selected card (→). Hold Shift/Alt/Option: Create AFTER selected card (↘)">
  <option value="">...please pick a list...</option>
</select>
```

## Testing Plan

### Unit Tests

**File**: `tests/test_class_popupForm.js`

Add tests for:
1. Mode switching on modifier key press
2. Card list updates with correct icons
3. Mode reset on list change

### Integration Tests

**File**: `tests/test_class_trel.js`

Add tests for:
1. Card creation with `idCardSource` when mode is 'to'
2. Card creation with position when mode is 'after'
3. Correct position calculation (cardPos + 1)

### Manual Testing Checklist

- [ ] Position dropdown is removed from UI
- [ ] Card dropdown shows → prefix by default
- [ ] Pressing Shift/Alt/Option while clicking card dropdown switches to ↘ prefix
- [ ] Releasing modifier key switches back to → prefix
- [ ] Cards are created with correct Trello API parameters:
  - [ ] Default: Uses `idCardSource` parameter
  - [ ] With modifier: Uses `pos` parameter with correct value
- [ ] Mode resets to 'to' when changing lists
- [ ] Visual indicators (border colors) update correctly
- [ ] Tooltip shows correct help text

## Migration Notes

### Breaking Changes

1. **Position dropdown removal**: Users who habitually clicked the position dropdown will need to learn the new modifier key behavior
2. **Default behavior change**: Previously defaulted to last-used position; now always defaults to "TO" mode

### User Communication

Update documentation/help to explain:
- New default behavior (always add TO card)
- How to use modifier keys for AFTER mode
- Visual indicators (→ vs ↘)

## Rollback Plan

If issues arise:

1. Keep `g2tPosition` dropdown in HTML (commented out)
2. Add feature flag: `app.temp.useNewCardPositioning`
3. Conditionally show old dropdown if flag is false
4. Allow easy toggle in options/settings

## Future Enhancements

### Possible Future Features

1. **Persistent Mode Preference**: Remember user's last-used mode per board/list
2. **Keyboard Shortcuts**: Add dedicated keyboard shortcut to toggle mode
3. **Visual Mode Toggle**: Add explicit toggle button instead of modifier keys only
4. **Advanced Positioning**: Allow inserting BEFORE selected card (↖ or ↑ character)
5. **Mode Indicator in Submit Button**: Change button text based on mode
   - "→ Add to Card" vs "↘ Add New Card"

## Files to Modify

### HTML
- [x] `chrome_manifest_v3/views/popupView.html` - Remove position dropdown, update tooltips

### JavaScript - Core Logic
- [x] `chrome_manifest_v3/class_trel.js` - Update card creation with idCardSource/pos logic
- [x] `chrome_manifest_v3/views/class_popupForm.js` - Update cards display with mode icons
- [x] `chrome_manifest_v3/views/class_popupView.js` - Add modifier key detection, mode management

### JavaScript - State
- [x] `chrome_manifest_v3/class_app.js` - Add cardInsertMode to temp state (if needed)

### CSS & Images
- [x] `chrome_manifest_v3/style.css` - Add mode indicator styles
- [ ] `chrome_manifest_v3/images/icon-add-to-card-16.png` - TO mode icon (standard)
- [ ] `chrome_manifest_v3/images/icon-add-to-card-32.png` - TO mode icon (retina)
- [ ] `chrome_manifest_v3/images/icon-add-after-card-16.png` - AFTER mode icon (standard)
- [ ] `chrome_manifest_v3/images/icon-add-after-card-32.png` - AFTER mode icon (retina)

### Tests
- [ ] `tests/test_class_popupForm.js` - Add mode switching tests
- [ ] `tests/test_class_trel.js` - Add card creation tests with new parameters

### Documentation
- [ ] `docs/CHANGES.md` - Document this change for users
- [ ] `README.md` - Update usage instructions (if applicable)

## Implementation Sequence

### Quick Start (Unicode Fallback)
1. **Phase 1**: State management
2. **Phase 2**: HTML changes  
3. **Phase 3**: Event handlers
4. **Phase 4**: Card creation logic
5. **Phase 5a**: Unicode character indicators (→ and ↘)
6. **Testing**: Verify core functionality

### Polish (PNG Icons)
7. **Phase 5b**: Design and create PNG icons
8. **Phase 5c**: Implement CSS icon display
9. **Phase 6**: User feedback improvements
10. **Testing**: Verify icon display across browsers

**Recommended**: Start with Unicode fallback (Phase 1-5a) to get working functionality quickly, then upgrade to PNG icons (Phase 5b-c) for better UX.

## Estimated Effort

### Quick Start (Unicode)
- **Phase 1-4 (Core functionality)**: 4-6 hours
- **Phase 5a (Unicode indicators)**: 0.5 hours
- **Testing & Documentation**: 2-3 hours
- **Subtotal**: ~6.5-9.5 hours

### Polish (PNG Icons)
- **Phase 5b (Icon design)**: 1-2 hours
- **Phase 5c (CSS implementation)**: 1-2 hours
- **Phase 6 (User feedback)**: 1 hour
- **Testing icon display**: 1 hour
- **Subtotal**: ~4-5 hours

**Total with icons**: ~10.5-14.5 hours
**Total without icons** (Unicode only): ~6.5-9.5 hours

## Questions/Decisions Needed

1. ✅ **Which modifier keys to support?** 
   - **Decision**: Shift, Alt/Option, or Command/Meta (any of them triggers AFTER mode)

2. ✅ **Visual indicator approach?**
   - **Decision**: Custom PNG icons (with Unicode fallback)
   - TO mode: Arrow pointing to card →[▭]
   - AFTER mode: Arrow pointing below elevated card

3. ❓ **Should mode persist across list changes?**
   - **Recommendation**: No, always reset to 'to' mode for safety

4. ❓ **Should we add explicit toggle button in addition to modifier keys?**
   - **Recommendation**: Start with modifier keys only, add toggle if users request it

5. ❓ **How to handle "new card at top" option in AFTER mode?**
   - **Recommendation**: When "-1" selected, ignore mode and always add to top

## Risk Assessment

### Low Risk
- Removing unused position dropdown
- Adding visual indicators
- CSS changes

### Medium Risk
- Modifier key detection (may have edge cases across browsers/OS)
- Mode state management

### High Risk  
- Trello API parameter changes (`idCardSource` vs `pos`)
- Card positioning logic (needs careful testing)

## Success Criteria

1. ✅ Position dropdown removed from UI
2. ✅ Default behavior: Cards added using `idCardSource` (TO mode)
3. ✅ Modifier key press enables AFTER mode with correct positioning
4. ✅ Visual indicators clearly show current mode
5. ✅ No regression in existing card creation functionality
6. ✅ User testing confirms intuitive behavior

---

**Document Version**: 1.0  
**Date**: 2025-11-08  
**Status**: Planning Phase  
**Next Step**: Review with team, get approval on Unicode characters and modifier key choices
