var Gmail2Trello = Gmail2Trello || {}; // must be var to guarantee correct scope

class PopupView {
  constructor(parent) {
    this.parent = parent;
    this.event = new EventTarget();
    this.isInitialized = false;

    this.data = { settings: {} };

    this.size_k = {
      width: {
        min: 700,
        max: window.innerWidth - 16, // Max width is 100% of the window - 1em. KS
      },
      height: {
        min: 464,
        max: 1400,
      },
      text: {
        min: 111,
      },
    };
    this.draggable = {
      height: {
        min: 464,
        max: window.innerHeight - 100, // 100 - a safety buffer to prevent the dragable controls from being hidden by gmail's menu buttons.
      },
      width: {
        min: 700,
        max: window.innerWidth - 100,
      },
    };

    // html pieces
    this.html = {};

    this.chrome_access_token = '';

    this.dataDirty = true;
    this.posDirty = false;

    this.MAX_BODY_SIZE = 16384;

    this.mouseDownTracker = {};

    this.lastError = '';

    this.intervalId = 0;

    this.EVENT_LISTENER = '.g2t_event_listener'; // NOTE (acoven@2020-05-23): beginning with dot intentional and required

    this.CLEAR_EXT_BROWSING_DATA = 'g2t_clear_extension_browsing_data';

    this.VERSION_STORAGE = 'g2t_version';

    this.ATTRIBUTE_STORAGE = 'g2t-attr-';

    this.updatesPending = [];
    this.comboInitialized = false;
  }

  init() {
    // g2t_log('PopupView:init');

    // inject a button & a popup
    this.confirmPopup();

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.event.fire('detectButton');
    }, 2000);
  }

  comboBox(update) {
    const $jVals = { Board: '', Card: '', List: '' };
    const setJQueryVals = () => {
      g2t_each($jVals, (value, key) => {
        $jVals[key] = $(`#g2t${key}`, this.$popup);
      });
    };
    const set_max_autocomplete_size = () => {
      const max_k = window.innerHeight; // Was: this.draggable.height.max;
      const $board_k = $jVals.Board;
      const popup_offset_k = this.$popup.offset();
      const popup_top_k = popup_offset_k.top;
      const board_height_k = $board_k.outerHeight();
      const calc_k =
        max_k -
        popup_top_k -
        board_height_k -
        90; /* titlebar of popup with some room*/
      const val_k = calc_k > this.size_k.text.min ? calc_k : '60%';
      $('.ui-autocomplete').css('max-height', val_k);
    };
    if (!update) {
      setTimeout(() => {
        this.comboInitialized = true;
        setJQueryVals();
        g2t_each($jVals, ($value, key) => {
          // $value is already available from the callback parameter
          $value.combobox();
        });
        set_max_autocomplete_size();
      }, 1000);
    } else if (this.comboInitialized) {
      // Updating type-in list's value when a value is changed.
      setJQueryVals();
      g2t_each($jVals, ($value, key) => {
        // $value is already available from the callback parameter
        $value.combobox(
          'setInputValue',
          $value.children('option:selected').text()
        );
      });
      set_max_autocomplete_size();
    }
  }

  confirmPopup() {
    if (!this.$toolBar) {
      return; // button not available yet
    }

    let needInit = false;
    const $button = $('#g2tButton');
    const $popup = $('#g2tPopup');

    if ($button.length < 1) {
      if (
        this.html &&
        this.html['add_to_trello'] &&
        this.html['add_to_trello'].length > 0
      ) {
        // g2t_log('PopupView:confirmPopup: add_to_trello_html already exists');
      } else {
        let img = 'G2T';
        let classAdd = 'Bn';

        // Refresh icon present? If so, use graphics, if not, use text:
        if (
          $('div.asl.T-I-J3.J-J5-Ji,div.asf.T-I-J3.J-J5-Ji', this.$toolBar)
            .length > 0
        ) {
          img =
            '<img class="f tk3N6e-I-J3" height="20" width="20" src="' +
            chrome.runtime.getURL('images/icon-48.png') +
            '" />';
          classAdd = 'asa ';
        }

        this.html['add_to_trello'] =
          '<div id="g2tButton" class="' +
          'G-Ni J-J5-Ji" ' + // "lS T-I-ax7 ar7" // 'G-Ni J-J5-Ji T-I ar7 nf T-I-ax7 L3" '
          'data-tooltip="Add this Gmail to Trello">' +
          '<div class="' +
          classAdd +
          '">' +
          '<div aria-haspopup="true" role="button" class="J-J5-Ji W6eDmd L3 J-J5-Ji L3" tabindex="0">' + // class="J-J5-Ji W6eDmd L3 J-J5-Ji Bq L3">' // Bq = Delete icon
          img +
          '<div id="g2tDownArrow" class="G-asx T-I-J3 J-J5-Ji">&nbsp;</div></div></div></div>';
      }
      // g2t_log('PopupView:confirmPopup: creating button');
      this.$toolBar.append(this.html['add_to_trello']);
      needInit = true;
    } else if ($button.first().is(':visible')) {
      // g2t_log('PopupView:confirmPopup: button visible');
    } else {
      // g2t_log('PopupView:confirmPopup: Button is in an inactive region. Moving...');
      //relocate
      if ($button.length > 1) {
        $button.detach(); // In case multiple copies were created
        if ($popup.length > 1) {
          $popup.detach(); // In case copies were created
        }
      }
      g2t_log('PopupView:confirmPopup: adding Button and Popup');
      $button.first().appendTo(this.$toolBar);
      $popup.first().appendTo(this.$toolBar);
    }

    if (needInit || $popup.length < 1) {
      if (this.html && this.html['popup'] && this.html['popup'].length > 0) {
        // g2t_log('PopupView:confirmPopup: adding popup');
        this.$toolBar.append(this.html['popup']);
        needInit = true;
      } else {
        needInit = false;
        $.get(chrome.runtime.getURL('views/popupView.html'), (data) => {
          // data = this.parent.replacer(data, {'jquery-ui-css': chrome.runtime.getURL('lib/jquery-ui-1.12.1.min.css')}); // OBSOLETE (Ace@2017.06.09): Already loaded by manifest
          this.html['popup'] = data;
          g2t_log('PopupView:confirmPopup: creating popup');
          this.$toolBar.append(data);
          this.parent.loadSettings(this); // Calls init_popup
        });
      }
    }

    if (needInit) {
      this.parent.loadSettings(this); // Calls init_popup
    }
  }

  /**
   * Set the initial width by measuring from the left corner of the
   * "Add card" button to the edge of the window and then center that under the "Add card" button:
   */
  centerPopup(useWidth) {
    const g2tLeft = this.$g2tButton.position().left;
    const g2tRight = g2tLeft + this.$g2tButton.width();
    let g2tCenter = g2tLeft + this.$g2tButton.outerWidth() / 2;

    const parent = this.$g2tButton.offsetParent();
    const parentRight = parent.position().left + parent.width();

    const length_from_left_k = g2tLeft * 1.5;
    const length_from_right_k = (parentRight - g2tRight) * 1.5;
    const calcWidth_k = Math.min(length_from_left_k, length_from_right_k); // If we need a width to use

    // We'll make our popup 1.25x as wide as the button to the end of the window up to max width:
    let newPopupWidth = this.size_k.width.min;
    if (useWidth && useWidth > 0) {
      newPopupWidth = useWidth; // May snap to min if necessary
      g2tCenter = this.$popup.position().left;
      g2tCenter += this.$popup.width() / 2;
    } else if (
      this.data?.settings?.popupWidth?.length > 0
    ) {
      newPopupWidth = Number.parseFloat(this.data.settings.popupWidth, 10 /* base 10 */);
    } else {
      newPopupWidth = calcWidth_k;
    }

    newPopupWidth = Math.min(
      this.size_k.width.max,
      Math.max(this.size_k.width.min, newPopupWidth)
    );

    let newPopupLeft = g2tCenter - newPopupWidth / 2;

    if (newPopupLeft < 0) {
      // button positions have moved, recalculate
      newPopupWidth = calcWidth_k;
      newPopupLeft = g2tCenter - newPopupWidth / 2;
    }

    this.$popup.css('width', newPopupWidth + 'px');
    this.$popup.css('left', newPopupLeft + 'px');

    this.onResize();

    this.posDirty = !this.validateData();
  }

  init_popup() {
    this.$g2tButton = $('#g2tButton');
    this.$popup = $('#g2tPopup');

    this.$popupMessage = $('.popupMsg', this.$popup);
    this.$popupContent = $('.content', this.$popup);

    this.centerPopup();
    this.bindEvents();

    this.isInitialized = true;
  }

  // NOTE (Ace, 15-Jan-2017): This resizes all the text areas to match the width of the popup:
  onResize() {
    this.validateData(); // Assures size is saved // OBSOLETE (acoven@2020-08-12): Can probably remove "onResize" completely
  }

  resetDragResize() {
    const $g2tDesc = $('#g2tDesc', this.$popup);
    const $popupBB = $('#g2tPopup', this.$popup);
    const padding = 95;
    this.$popup.draggable({
      disabled: false,
      containment: 'window',
    });

    this.$popup.resizable({
      disabled: false,
      minHeight: this.draggable.height.min,
      minWidth: this.draggable.width.min,
      maxHeight: this.draggable.height.max,
      maxWidth: this.draggable.width.max,
      resize: () => {
        // This will remove the max-height restriction set in CSS, thereby allwing the user to resize freely.
        if ($('#g2tPopup').css('max-height') != 'inherit') {
          $('#g2tPopup').css('max-height', 'inherit');
        }
      },
      handles: 'w,sw,s,se,e',
    });
  }

  updateBody(data = {}) {
    const attribute_storage_k = this.ATTRIBUTE_STORAGE;

    const markdown_k =
      data.settings?.markdown ?? $('#chkMarkdown', this.$popup).is(':checked');
    const useBackLink_k =
      data.settings?.useBackLink ?? $('#chkBackLink', this.$popup).is(':checked');
    const addCC_k =
      data.settings?.addCC ?? $('#chkCC', this.$popup).is(':checked');
    const $g2tDesc = $('#g2tDesc', this.$popup);

    const fields = ['bodyAsRaw', 'bodyAsMd', 'linkAsRaw', 'linkAsMd', 'emailId'];
    const valid_data_k = fields.every(field => !!data?.[field]);

    fields.push('ccAsRaw', 'ccAsMd'); // These are conditional

    if (valid_data_k) {
      // Store data in description object attributes:
      g2t_each(fields, (value) => {
        const val_k = data[value] || '';
        const name_k = attribute_storage_k + value;
        $g2tDesc.attr(name_k, val_k);
      });
    } else {
      // Restore data values from description object attributes:
      g2t_each(fields, (value) => {
        const name_k = attribute_storage_k + value;
        const val_k = $g2tDesc.attr(name_k) || '';
        data[value] = val_k;
      }); // WARNING (Ace, 2021-01-04): this might override data.emailId when we don't want it to
    }

    const body_k = markdown_k ? data.bodyAsMd : data.bodyAsRaw;
    const link_k = useBackLink_k
      ? markdown_k
        ? data.linkAsMd
        : data.linkAsRaw
      : '';
    const cc_k = addCC_k ? (markdown_k ? data.ccAsMd : data.ccAsRaw) : '';
    const desc_k = this.parent.truncate(
      body_k,
      this.MAX_BODY_SIZE - (link_k.length + cc_k.length),
      '...'
    );
    const val_k = link_k + cc_k + desc_k;

    $g2tDesc.val(val_k);
    $g2tDesc.change();
  }

  bindEvents() {
    // bind events

    /** Popup's behavior **/
    this.resetDragResize();

    $('#close-button', this.$popup)
      .off('click')
      .on('click', () => {
        this.hidePopup();
      });

    /** Add Card Panel's behavior **/

    this.$g2tButton
      .off('mousedown') // was: ("click")
      .on('mousedown' /* was: "click" */, (event) => {
        if (this.parent.modKey(event)) {
          // TODO (Ace, 28-Mar-2017): Figure out how to reset layout here!
        } else {
          if (this.popupVisible()) {
            this.hidePopup();
          } else {
            // const selectedText_k = this.parent.getSelectedText(); // grab selected text before click?
            this.showPopup();
          }
        }
      })
      .hover(
        function () {
          // This is a google class that on hover highlights the button and arrow, darkens the background:
          $(this).addClass('T-I-JW');
        },
        function () {
          $(this).removeClass('T-I-JW');
        }
      );

    const $board = $('#g2tBoard', this.$popup);
    $board.off('change').on('change', () => {
      const boardId = $board.val();

      const $list = $('#g2tList', this.$popup);
      const $card = $('#g2tCard', this.$popup);
      const $labels = $('#g2tLabels', this.$popup);
      const $members = $('#g2tMembers', this.$popup);
      const $labelsMsg = $('#g2tLabelsMsg', this.$popup);
      const $membersMsg = $('#g2tMembersMsg', this.$popup);
      if (boardId === '_') {
        $board.val('');
      }

      if (
        boardId === '_' ||
        boardId === '' ||
        boardId !== this.data.settings.boardId
      ) {
        $members.html('').hide(); // clear it out
        $labels.html('').hide(); // clear it out
        $list
          .html($('<option value="">...please pick a board...</option>'))
          .val('');
        $card
          .html($('<option value="">...please pick a list...</option>'))
          .val('');
        this.data.settings.labelsId = '';
        this.data.settings.listId = '';
        this.data.settings.cardId = '';
      } else {
        $members.hide(); // clear it out
        $labels.hide(); // hiding when loading is being showed.
      }

      this.event.fire('onBoardChanged', { boardId: boardId });

      if (this.comboBox) this.comboBox('updateValue');
      this.validateData();
    });

    const $list = $('#g2tList', this.$popup);
    $list.off('change').on('change', () => {
      const listId = $list.val();
      this.event.fire('onListChanged', { listId });
      if (this.comboBox) this.comboBox('updateValue');
      this.validateData();
    });

    $('#g2tPosition', this.$popup)
      .off('change')
      .on('change', (event) => {
        // Focusing the next element in select.
        $('#' + $(event.target).attr('next-select'))
          .find('input')
          .focus();
      })
      .off('keyup')
      .on('keyup', (event) => {
        // Focusing the next element on enter key up.
        if (event.which == 13) {
          $('#' + $(event.target).attr('next-select'))
            .find('input')
            .focus();
        }
      });

    $('#g2tCard', this.$popup)
      .off('change')
      .on('change', () => {
        if (this.comboBox) this.comboBox('updateValue');
        this.validateData();
      });

    $('#g2tDue_Shortcuts', this.$popup)
      .off('change')
      .on('change', (event) => {
        const dayOfWeek_k = {
          sun: 0,
          sunday: 0,
          mon: 1,
          monday: 1,
          tue: 2,
          tuesday: 2,
          wed: 3,
          wednesday: 3,
          thu: 4,
          thursday: 4,
          fri: 5,
          friday: 5,
          sat: 6,
          saturday: 6,
        };
        const pad0 = (str = '', n = 2) => {
          return ('0'.repeat(n) + str).slice(-n);
        };
        const dom_date_format = (d = new Date()) => {
          // yyyy-MM-dd
          return `${d.getFullYear()}-${pad0(d.getMonth() + 1)}-${pad0(
            d.getDate()
          )}`;
        };
        const dom_time_format = (d = new Date()) => {
          // HH:mm
          return `${pad0(d.getHours())}:${pad0(d.getMinutes())}`;
        };

        const due_k = ($(event.target).val() || '').split(' '); // Examples: d=monday am=2 | d+0 pm=3:00

        let d = new Date();

        const [due_date, due_time] = due_k || [];

        let new_date = '';
        let new_time = '';

        if (due_date.substr(1, 1) === '+') {
          d.setDate(d.getDate() + Number.parseInt(due_date.substr(2), 10));
          new_date = dom_date_format(d);
        } else if (due_date.substr(1, 1) === '=') {
          d.setDate(d.getDate() + 1); // advance to tomorrow, don't return today for "next x"
          const weekday_k = due_date.substr(2).toLowerCase();
          if (weekday_k === '0') {
            new_date = '';
          } else {
            const weekday_num_k = dayOfWeek_k[weekday_k];
            while (d.getDay() !== weekday_num_k) {
              d.setDate(d.getDate() + 1);
            }
            new_date = dom_date_format(d);
          }
        } else {
          g2t_log(
            `due_Shortcuts:change: Unknown due date shortcut: "${due_date}"`
          );
        }

        if (due_time.substr(2, 1) === '+') {
          d.setTime(d.getTime() + Number.parseInt(due_time.substr(3), 10));
          new_time = dom_time_format(d);
        } else if (due_time.substr(2, 1) === '=') {
          if (due_time.substr(3) === '0') {
            new_time = '';
          } else {
            const am_k = due_time.substr(0, 1).toLowerCase() === 'a';
            const hhmm_k = due_time.substr(3).split(':');
            let hours = Number.parseInt(hhmm_k[0], 10);
            if (hours === 12) {
              hours = 0;
            }
            if (!am_k) {
              hours += 12;
            }
            new_time =
              ('0' + hours.toString()).substr(-2) +
              ':' +
              ('0' + (hhmm_k[1] || 0).toString()).substr(-2);
          }
        } else {
          g2t_log(
            `due_Shortcuts:change: Unknown due time shortcut: "${due_time}"`
          );
        }

        $('#g2tDue_Date', this.$popup).val(new_date || '');
        $('#g2tDue_Time', this.$popup).val(new_time || '');

        if (this.comboBox) {
          this.comboBox('updateValue');
        }

        if (due_date === 'd=0') {
          // Reset to hidden item if we're first "--" item (allows us to select "--" to clear any time):
          $(this).val('none');
        }
        this.validateData();
      });

    $('#g2tTitle', this.$popup)
      .off('change')
      .on('change', () => {
        this.validateData();
      });

    $('#g2tDesc', this.$popup)
      .off('change')
      .on('change', () => {
        this.validateData();
      });

    $('#chkMarkdown, #chkBackLink, #chkCC', this.$popup)
      .off('change')
      .on('change', () => {
        this.updateBody();
      });

    $('#addToTrello', this.$popup)
      .off('click')
      .on('click', (event) => {
        if (this.parent.modKey(event)) {
          this.displayAPIFailedForm();
        } else {
          this.submit();
        }
      });

    $('#g2tLabelsHeader', this.$popup)
      .off('click')
      .on('click', (event) => {
        if (this.parent.modKey(event)) {
          this.clearLabels();
        }
      });

    $('#g2tMembersHeader', this.$popup)
      .off('click')
      .on('click', (event) => {
        if (this.parent.modKey(event)) {
          this.clearMembers();
        }
      });

    $('#g2tAttachHeader', this.$popup)
      .off('click')
      .on('click', (event) => {
        if (this.parent.modKey(event)) {
          this.toggleCheckboxes('g2tAttachments');
        }
      });

    $('#g2tImagesHeader', this.$popup)
      .off('click')
      .on('click', (event) => {
        if (this.parent.modKey(event)) {
          this.toggleCheckboxes('g2tImages');
        }
      });
  }

  submit() {
    if (this.validateData()) {
      this.$popupContent.hide();
      this.showMessage(this, 'Submitting to Trello...');
      this.event.fire('onSubmit');
    }
  }

  showPopup() {
    if (this.$g2tButton && this.$popup) {
      $(document)
        .on('keydown' + this.EVENT_LISTENER, (event) => {
          const visible_k = this.popupVisible();
          const periodASCII_k = 46;
          const periodNumPad_k = 110;
          const periodKeyCode_k = 190;
          const isEscape_k = event.which === $.ui.keyCode.ESCAPE;
          const isEnter_k = event.which === $.ui.keyCode.ENTER;
          const isPeriodASCII_k = event.which === periodASCII_k;
          const isPeriodNumPad_k = event.which === periodNumPad_k;
          const isPeriodKeyCode_k = event.which === periodKeyCode_k;
          const isPeriod_k = isPeriodASCII_k || isPeriodNumPad_k || isPeriodKeyCode_k;
          const isCtrlCmd_k = event.ctrlKey || event.metaKey;
          const isCtrlCmdPeriod_k = isCtrlCmd_k && isPeriod_k;
          const isCtrlCmdEnter_k = isCtrlCmd_k && isEnter_k;

          if (visible_k) {
            if (isEscape_k || isCtrlCmdPeriod_k) {
              this.hidePopup();
            } else if (isCtrlCmdEnter_k) {
              this.submit();
            }
          }
        })
        .on('mouseup' + this.EVENT_LISTENER, (event) => {
          // Click isn't always propagated on Mailbox bar, so using mouseup instead.
          if (
            $(event.target).closest('#g2tButton').length == 0 &&
            $(event.target).closest('#g2tPopup').length == 0 &&
            g2t_has(this.mouseDownTracker, event.target) &&
            this.mouseDownTracker[event.target] === 1 &&
            $(event.target).closest('.ui-autocomplete').length == 0
          ) {
            this.mouseDownTracker[event.target] = 0;
            this.hidePopup();
          }
        })
        .on('mousedown' + this.EVENT_LISTENER, (event) => {
          // Click isn't always propagated on Mailbox bar, so using mouseup instead
          if (
            $(event.target).closest('#g2tButton').length == 0 &&
            $(event.target).closest('#g2tPopup').length == 0
          ) {
            this.mouseDownTracker[event.target] = 1;
          }
        })
        .on('focusin' + this.EVENT_LISTENER, (event) => {
          if (
            $(event.target).closest('#g2tButton').length == 0 &&
            $(event.target).closest('#g2tPopup').length == 0
          ) {
            this.hidePopup();
          }
        });

      if (this.posDirty) {
        this.centerPopup();
      }
      // resetting the max height on load.
      $('#g2tPopup').css('max-height', '564px');
      this.mouseDownTracker = {};

      this.$popup.show();
      this.validateData();

      this.event.fire('onPopupVisible');
    }
  }

  toggleActiveMouseDown(elm) {
    const activeDiv = elm;
    if (!$(activeDiv).hasClass('active-mouseDown')) {
      $(activeDiv).addClass('active-mouseDown');
    } else {
      $(activeDiv).removeClass('active-mouseDown');
    }
  }

  hidePopup() {
    if (this.$g2tButton && this.$popup) {
      $(document).off(this.EVENT_LISTENER); // Turns off everything in namespace
      this.$popup.hide();
    }
  }

  popupVisible() {
    let visible = false;
    if (
      this.$g2tButton &&
      this.$popup &&
      this.$popup.css('display') === 'block'
    ) {
      visible = true;
    }

    return visible;
  }

  getManifestVersion() {
    try {
      return chrome?.runtime?.getManifest?.()?.version || '0';
    } catch (error) {
      this.handleChromeAPIError(error, 'getManifestVersion');
      return '0';
    }
  }

  handleChromeAPIError(error, operation) {
    g2t_log(`${operation} ERROR: extension context invalidated`);
    this.displayExtensionInvalidReload();
  }

  // ... rest of the methods would continue here, but I'll focus on the key fixes first
}

// Export the class
Gmail2Trello.PopupView = PopupView;