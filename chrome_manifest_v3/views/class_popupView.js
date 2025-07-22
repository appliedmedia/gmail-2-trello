var G2T = G2T || {}; // must be var to guarantee correct scope

class PopupView {
  static get ck() {
    // class keys here to assure they're treated like consts
    const ck = {
      id: 'g2t_popupview',
      emailIdAttr: 'g2t-attr-emailId',
    };
    return ck;
  }

  get ck() {
    return PopupView.ck;
  }

  constructor(args) {
    this.app = args.app;
    this.isInitialized = false;

    this._state = {};

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

    // Initialize form instance
    this.form = new G2T.PopupForm({
      parent: this,
      app: this.app,
    });
  }

  // Getter for state
  get state() {
    return this._state;
  }

  // Setter for state
  set state(newState) {
    this._state = newState;
  }

  loadState() {
    this.app.utils.loadFromChromeStorage(
      this.ck.id,
      'classPopupViewStateLoaded'
    );
  }

  saveState() {
    this.app.utils.saveToChromeStorage(this.ck.id, this.state);
  }

  finalCreatePopup() {
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
        // Fire popupLoaded event
        this.app.events.fire('popupLoaded');
        needInit = true;
      } else {
        needInit = false;
        $.get(this.app.chrome.runtimeGetURL('views/popupView.html'), data => {
          // data = this.app.utils.replacer(data, {'jquery-ui-css': chrome.runtime.getURL('lib/jquery-ui-1.12.1.min.css')}); // OBSOLETE (Ace@2017.06.09): Already loaded by manifest
          this.html['popup'] = data;
          g2t_log('PopupView:confirmPopup: creating popup');
          this.$toolBar.append(data);
          // Fire popupLoaded event after DOM is ready
          this.app.events.fire('popupLoaded');
          this.loadState(); // Load state from Chrome storage
        });
      }
    }

    if (needInit) {
      this.loadState(); // Load state from Chrome storage
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
    } else if (this.state?.popupWidth?.length > 0) {
      newPopupWidth = Number.parseFloat(
        this.state.popupWidth,
        10 /* base 10 */
      );
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

    // this.onResize();

    this.posDirty = !this.form.validateData();
  }

  resetDragResize() {
    const $g2tDesc = $('#g2tDesc', this.$popup);
    const $popupBB = $('#g2tPopup', this.$popup);
    const padding = 95;
    this.$popup.draggable({
      disabled: false,
      containment: 'window',
      cancel: 'a, button, input, select, textarea, .ui-autocomplete, .hideMsg',
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

  bindEvents() {
    // Only bind the popupLoaded event here - everything else waits for DOM
    this.app.events.addListener(
      'popupLoaded',
      this.handlePopupLoaded.bind(this)
    );

    // Bind init done event
    this.app.events.addListener(
      'classPopupViewInitDone',
      this.handlePopupViewInitDone.bind(this)
    );

    // Bind internal PopupView events
    this.app.events.addListener(
      'onPopupVisible',
      this.handlePopupVisible.bind(this)
    );
    this.app.events.addListener(
      'periodicChecks',
      this.handlePeriodicChecks.bind(this)
    );

    this.app.events.addListener(
      'detectButton',
      this.handleDetectButton.bind(this)
    );

    // Bind events moved from App (pure PopupView operations)
    this.app.events.addListener(
      'onBeforeAuthorize',
      this.handleBeforeAuthorize.bind(this)
    );
    this.app.events.addListener(
      'onAuthorizeFail',
      this.handleAuthorizeFail.bind(this)
    );
    this.app.events.addListener(
      'onAuthorized',
      this.handleAuthorized.bind(this)
    );
    this.app.events.addListener(
      'onBeforeLoadTrello',
      this.handleBeforeLoadTrello.bind(this)
    );
    this.app.events.addListener(
      'onTrelloDataReady',
      this.handleTrelloDataReady.bind(this)
    );
  }

  bindPopupEvents() {
    // Bind chrome.runtime.onMessage for popup-specific messages
    chrome.runtime.onMessage.addListener(this.handleRuntimeMessage.bind(this));
  }

  showPopup() {
    if (this.$g2tButton && this.$popup) {
      $(document)
        .on('keydown' + this.EVENT_LISTENER, event => {
          const visible_k = this.popupVisible();
          const periodASCII_k = 46;
          const periodNumPad_k = 110;
          const periodKeyCode_k = 190;
          const isEscape_k = event.which === $.ui.keyCode.ESCAPE;
          const isEnter_k = event.which === $.ui.keyCode.ENTER;
          const isPeriodASCII_k = event.which === periodASCII_k;
          const isPeriodNumPad_k = event.which === periodNumPad_k;
          const isPeriodKeyCode_k = event.which === periodKeyCode_k;
          const isPeriod_k =
            isPeriodASCII_k || isPeriodNumPad_k || isPeriodKeyCode_k;
          const isCtrlCmd_k = event.ctrlKey || event.metaKey;
          const isCtrlCmdPeriod_k = isCtrlCmd_k && isPeriod_k;
          const isCtrlCmdEnter_k = isCtrlCmd_k && isEnter_k;

          if (visible_k) {
            if (isEscape_k || isCtrlCmdPeriod_k) {
              this.hidePopup();
            } else if (isCtrlCmdEnter_k) {
              this.form.submit();
            }
          }
        })
        /* Temporarily disabled to test link clicks
        .on('mouseup' + this.EVENT_LISTENER, event => {
          // Click isn't always propagated on Mailbox bar, so using mouseup instead.
          if (
            $(event.target).closest('#g2tButton').length == 0 &&
            $(event.target).closest('#g2tPopup').length == 0 &&
            g2t_has(this.mouseDownTracker, event.target) &&
            this.mouseDownTracker[event.target] === 1 &&
            $(event.target).closest('.ui-autocomplete').length == 0
          ) {
            this.mouseDownTracker[event.target] = 0;
            // Add small delay to allow link clicks to process first
            setTimeout(() => {
              this.hidePopup();
            }, 10);
          }
          // Clear mouseDownTracker for any click
          if (g2t_has(this.mouseDownTracker, event.target)) {
            this.mouseDownTracker[event.target] = 0;
          }
        })
        */
        .on('mousedown' + this.EVENT_LISTENER, event => {
          // Click isn't always propagated on Mailbox bar, so using mouseup instead
          if (
            $(event.target).closest('#g2tButton').length == 0 &&
            $(event.target).closest('#g2tPopup').length == 0
          ) {
            this.mouseDownTracker[event.target] = 1;
          }
        })
        .on('focusin' + this.EVENT_LISTENER, event => {
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
      this.form.validateData();

      this.app.events.fire('onPopupVisible');
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

  periodicChecks() {
    const version_storage_k = this.VERSION_STORAGE;
    const version_new = this.getManifestVersion();

    if (version_new > '0') {
      this.app.chrome.storageSyncGet(version_storage_k, response => {
        const version_old = response?.[version_storage_k] || '0';
        if (version_old > '0') {
          if (version_old !== version_new) {
            $.get(
              this.app.chrome.runtimeGetURL('views/versionUpdate.html'),
              data => {
                const dict = {
                  version_old,
                  version_new,
                };
                data = this.app.utils.replacer(data, dict);
                this.form.showMessage(this, data);
              }
            );
          }
        } else {
          this.forceSetVersion();
        }
      });
    }
  }

  forceSetVersion() {
    const version_storage_k = this.VERSION_STORAGE;
    const version_new = this.getManifestVersion();
    const dict_k = {
      [version_storage_k]: version_new,
    };
    this.app.chrome.storageSyncSet(dict_k);
  }

  showSignOutOptions(data) {
    $.get(this.app.chrome.runtimeGetURL('views/signOut.html'), data_in => {
      this.form.showMessage(this, data_in);
    });
  }

  // Select/de-select attachments and images based on first button's state:

  displayExtensionInvalidReload() {
    // can't get this from html doc via chrome call if context is invalidated
    const message = `<a class="hideMsg" title="Dismiss message">&times;</a><h3>Gmail-2-Trello has changed</h3>
    The page needs to be reloaded to work correctly.
    <button id="reload">Click here to reload this page</button> <span id="reload" style="color: red">&nbsp;</span>`;

    this.form.showMessage(this, message);
  }

  handlePopupVisible() {
    this.form.reset();

    const trelloUser_k = this?.app?.model?.trello?.user || {};
    const fullName = trelloUser_k?.fullName || '';

    this.app.gmailView.parsingData = false;
    this.app.model.gmail = this.app.gmailView.parseData({ fullName });
    this.form.bindGmailData(this.app.model.gmail);
    this.app.events.fire('periodicChecks');
  }

  handlePeriodicChecks() {
    setTimeout(() => {
      this.periodicChecks();
    }, 3000);
  }

  handleDetectButton() {
    if (this.app.gmailView.preDetect()) {
      this.$toolBar = this.app.gmailView.$toolBar;
      this.finalCreatePopup(); // Moved from init() to here
    }
  }

  handleBeforeAuthorize() {
    this.form.bindData(''); // Intentionally blank
    this.form.showMessage(this.app, 'Authorizing...');
  }

  handleAuthorizeFail() {
    this.form.showMessage(
      this.app,
      'Trello authorization failed <button id="showsignout">Sign out and try again</button>'
    );
  }

  handleAuthorized() {
    this.$popupContent.show();
    this.form.hideMessage();
  }

  handleBeforeLoadTrello() {
    this.form.showMessage(this.app, 'Loading Trello data...');
  }

  handleTrelloDataReady() {
    this.$popupContent.show();
    this.form.hideMessage();
    this.form.bindData(this.app.model);
  }

  handleRuntimeMessage(request, sender, sendResponse) {
    if (request?.message === 'g2t_keyboard_shortcut') {
      this.showPopup();
    }
  }

  handlePopupViewInitDone() {
    this.loadState();
  }

  handlePopupLoaded() {
    // This is the DOM-dependent code that used to be at the end of init() (from init_popup)
    this.$g2tButton = $('#g2tButton');
    this.$popup = $('#g2tPopup');
    this.$popupMessage = $('.popupMsg', this.$popup);
    this.$popupContent = $('.content', this.$popup);
    this.centerPopup();
    this.isInitialized = true;

    // Show any pending message that was queued before DOM was ready
    if (this.pendingMessage) {
      this.form.showMessage(
        this.pendingMessage.parent,
        this.pendingMessage.text
      );
      this.pendingMessage = null;
    }

    // Bind all events now that DOM is ready
    this.bindPopupEvents();

    // DOM event bindings moved from bindEvents()
    this.form.resetDragResize();

    $('#close-button', this.$popup)
      .off('click')
      .on('click', () => {
        this.hidePopup();
      });

    this.$g2tButton
      .off('mousedown')
      .on('mousedown', event => {
        if (this.app.utils.modKey(event)) {
          // TODO (Ace, 28-Mar-2017): Figure out how to reset layout here!
        } else {
          if (this.popupVisible()) {
            this.hidePopup();
          } else {
            this.showPopup();
          }
        }
      })
      .on('mouseenter', function () {
        $(this).addClass('T-I-JW');
      })
      .on('mouseleave', function () {
        $(this).removeClass('T-I-JW');
      });

    const $board = $('#g2tBoard', this.$popup);
    $board.off('change').on('change', () => {
      const boardId = $board.val();
      const $list = $('#g2tList', this.$popup);
      const $card = $('#g2tCard', this.$popup);
      const $labels = $('#g2tLabels', this.$popup);
      const $members = $('#g2tMembers', this.$popup);
      if (boardId === '_') {
        $board.val('');
      }
      if (boardId === '_' || boardId === '' || boardId !== this.state.boardId) {
        $members.html('').hide();
        $labels.html('').hide();
        $list
          .html($('<option value="">...please pick a board...</option>'))
          .val('');
        $card
          .html($('<option value="">...please pick a list...</option>'))
          .val('');
        this.state.labelsId = '';
        this.state.listId = '';
        this.state.cardId = '';
        this.state.boardId = boardId;
      } else {
        $members.hide();
        $labels.hide();
      }
      if (this.form.comboBox) this.form.comboBox('updateValue');
      this.form.validateData();
      this.app.events.fire('boardChanged', { boardId });
    });

    const $list = $('#g2tList', this.$popup);
    $list.off('change').on('change', () => {
      const listId = $list.val();
      this.state.listId = listId;
      if (this.form.comboBox) this.form.comboBox('updateValue');
      this.form.validateData();
      this.app.events.fire('listChanged', { listId });
    });

    $('#g2tPosition', this.$popup)
      .off('change')
      .on('change', event => {
        $('#' + $(event.target).attr('next-select'))
          .find('input')
          .focus();
      })
      .off('keyup')
      .on('keyup', event => {
        if (event.which == 13) {
          $('#' + $(event.target).attr('next-select'))
            .find('input')
            .focus();
        }
      });

    $('#g2tCard', this.$popup)
      .off('change')
      .on('change', () => {
        if (this.form.comboBox) this.form.comboBox('updateValue');
        this.form.validateData();
      });

    $('#g2tDue_Shortcuts', this.$popup)
      .off('change')
      .on('change', event => {
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
          return `${d.getFullYear()}-${pad0(d.getMonth() + 1)}-${pad0(
            d.getDate()
          )}`;
        };
        const dom_time_format = (d = new Date()) => {
          return `${pad0(d.getHours())}:${pad0(d.getMinutes())}`;
        };

        const due_k = ($(event.target).val() || '').split(' ');
        let d = new Date();
        const [due_date, due_time] = due_k || [];
        let new_date = '';
        let new_time = '';

        if (due_date.substr(1, 1) === '+') {
          d.setDate(d.getDate() + Number.parseInt(due_date.substr(2), 10));
          new_date = dom_date_format(d);
        } else if (due_date.substr(1, 1) === '=') {
          d.setDate(d.getDate() + 1);
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

        const $dueDate = $('#g2tDue_Date', this.$popup);
        const $dueTime = $('#g2tDue_Time', this.$popup);
        if (new_date.length > 0) {
          $dueDate.val(new_date);
        }
        if (new_time.length > 0) {
          $dueTime.val(new_time);
        }
        this.form.validateData();
      });

    $('#g2tSubmit', this.$popup)
      .off('click')
      .on('click', () => {
        this.form.submit();
      });

    $('#g2tSignOut', this.$popup)
      .off('click')
      .on('click', () => {
        this.app.events.fire('requestDeauthorizeTrello');
      });

    $('#g2tAuthorize', this.$popup)
      .off('click')
      .on('click', () => {
        this.app.events.fire('checkTrelloAuthorized');
      });

    $('#addToTrello', this.$popup)
      .off('click')
      .on('click', () => {
        this.form.submit();
      });
  }

  init() {
    // g2t_log('PopupView:init');

    // Create MenuControl instance
    this.menuCtrl = new G2T.MenuControl({ app: this.app });

    // Initialize form
    this.form.init();

    // Bind internal events
    this.bindEvents();

    // inject a button & a popup
    // this.finalCreatePopup(); // Moved to handleDetectButton for now

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.app.events.fire('detectButton');
    }, 2000);

    // Remove DOM-dependent code from here (was from init_popup)

    // Fire init done event
    this.app.events.fire('classPopupViewInitDone');
  }
}

// Export the class
G2T.PopupView = PopupView;

// end, class_popupView.js
