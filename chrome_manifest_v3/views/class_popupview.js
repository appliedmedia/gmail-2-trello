var G2T = G2T || {}; // must be var to guarantee correct scope

class PopupView {
  static get id() {
    return 'g2t_popupview';
  }

  get id() {
    return PopupView.id;
  }

  constructor(args) {
    this.app = args.app;
    this.isInitialized = false;

    this._state = {};
    
    // Initialize form component
    this.form = new PopupViewForm({
      parent: this,
      app: this.app
    });

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

  // Getter for state
  get state() {
    return this._state;
  }

  // Setter for state
  set state(newState) {
    this._state = newState;
  }

  loadState() {
    this.app.utils.loadFromChromeStorage(this.id, 'classPopupViewStateLoaded');
  }

  saveState() {
    this.app.utils.saveToChromeStorage(this.id, this.state);
  }

  comboBox_deprecated(update) {
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
        $.get(chrome.runtime.getURL('views/popupView.html'), data => {
          // data = this.app.utils.replacer(data, {'jquery-ui-css': chrome.runtime.getURL('lib/jquery-ui-1.12.1.min.css')}); // OBSOLETE (Ace@2017.06.09): Already loaded by manifest
          this.html['popup'] = data;
          g2t_log('PopupView:confirmPopup: creating popup');
          this.$toolBar.append(data);
          // Fire popupLoaded event after DOM is ready
          this.app.events.fire('popupLoaded');
          this.app.loadSettings(this); // Calls updateData
        });
      }
    }

    if (needInit) {
      this.app.loadSettings(this); // Calls updateData
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

    this.onResize();

    this.posDirty = !this.validateData_deprecated();
  }

  // NOTE (Ace, 15-Jan-2017): This resizes all the text areas to match the width of the popup:
  onResize() {
    this.validateData_deprecated(); // Assures size is saved // OBSOLETE (acoven@2020-08-12): Can probably remove "onResize" completely
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

  updateBody_deprecated(data = {}) {
    const attribute_storage_k = this.ATTRIBUTE_STORAGE;

    const markdown_k =
      data?.markdown ?? $('#chkMarkdown', this.$popup).is(':checked');
    const useBackLink_k =
      data?.useBackLink ?? $('#chkBackLink', this.$popup).is(':checked');
    const addCC_k = data?.addCC ?? $('#chkCC', this.$popup).is(':checked');
    const $g2tDesc = $('#g2tDesc', this.$popup);

    const fields = [
      'bodyAsRaw',
      'bodyAsMd',
      'linkAsRaw',
      'linkAsMd',
      'emailId',
    ];
    const valid_data_k = fields.every(field => !!data?.[field]);

    fields.push('ccAsRaw', 'ccAsMd'); // These are conditional

    if (valid_data_k) {
      // Store data in description object attributes:
      g2t_each(fields, value => {
        const val_k = data[value] || '';
        const name_k = attribute_storage_k + value;
        $g2tDesc.attr(name_k, val_k);
      });
    } else {
      // Restore data values from description object attributes:
      g2t_each(fields, value => {
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
    const desc_k = this.app.utils.truncate(
      body_k,
      this.MAX_BODY_SIZE - (link_k.length + cc_k.length),
      '...'
    );
    const val_k = link_k + cc_k + desc_k;

    $g2tDesc.val(val_k);
    $g2tDesc.change();
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
  }

  bindPopupEvents() {
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
      'onBoardChanged',
      this.handleBoardChanged.bind(this)
    );
    this.app.events.addListener(
      'onListChanged',
      this.handleListChanged.bind(this)
    );

    this.app.events.addListener(
      'detectButton',
      this.handleDetectButton.bind(this)
    );
    this.app.events.addListener(
      'newCardUploadsComplete',
      this.handleNewCardUploadsComplete.bind(this)
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

    this.app.events.addListener(
      'onAPIFailure',
      this.handleAPIFailure.bind(this)
    );

    // Bind chrome.runtime.onMessage for popup-specific messages
    chrome.runtime.onMessage.addListener(this.handleRuntimeMessage.bind(this));

    // Bind MenuControl events
    this.app.events.addListener(
      'onMenuClick',
      this.handleOnMenuClick.bind(this)
    );
  }

  submit_deprecated() {
    if (this.$popupContent) {
      this.$popupContent.hide();
    }
    this.form.showMessage(this, 'Submitting to Trello...');
    this.app.events.fire('onSubmit');
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
      this.validateData_deprecated();

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
      try {
        chrome.storage.sync.get(version_storage_k, response => {
          const version_old = response?.[version_storage_k] || '0';
          if (version_old > '0') {
            if (version_old !== version_new) {
              $.get(chrome.runtime.getURL('views/versionUpdate.html'), data => {
                const dict = {
                  version_old,
                  version_new,
                };
                data = this.app.utils.replacer(data, dict);
                this.form.showMessage(this, data);
              });
            }
          } else {
            this.forceSetVersion();
          }
        });
      } catch (error) {
        this.handleChromeAPIError(error, 'periodicChecks');
      }
    }
  }

  forceSetVersion() {
    const version_storage_k = this.VERSION_STORAGE;
    const version_new = this.getManifestVersion();
    const dict_k = {
      [version_storage_k]: version_new,
    };
    try {
      chrome.storage.sync.set(dict_k);
    } catch (error) {
      this.handleChromeAPIError(error, 'forceSetVersion');
    }
  }

  showSignOutOptions(data) {
    $.get(chrome.runtime.getURL('views/signOut.html'), data_in => {
      this.form.showMessage(this, data_in);
    });
  }

  bindData_deprecated(data) {
    $('.header a').each(() => {
      $(document).on('keyup', $(this), evt => {
        if (evt.which == 13 || evt.which == 32) {
          $(evt.target).trigger('click');
        }
      });
    });
    $('#g2tSignOutButton', this.$popup).click(() => {
      this.showSignOutOptions();
    });

    try {
      chrome.storage.sync.get('dueShortcuts', response => {
        // Borrowed from options file until this gets persisted everywhere:
        const dueShortcuts_k = JSON.stringify({
          today: {
            am: 'd+0 am=9:00',
            noon: 'd+0 pm=12:00',
            pm: 'd+0 pm=3:00',
            end: 'd+0 pm=6:00',
            eve: 'd+0 pm=11:00',
          },
          tomorrow: {
            am: 'd+1 am=9:00',
            noon: 'd+1 pm=12:00',
            pm: 'd+1 pm=3:00',
            end: 'd+1 pm=6:00',
            eve: 'd+1 pm=11:00',
          },
          'next monday': {
            am: 'd=monday am=9:00',
            noon: 'd=monday pm=12:00',
            pm: 'd=monday pm=3:00',
            end: 'd=monday pm=6:00',
            eve: 'd=monday pm=11:00',
          },
          'next friday': {
            am: 'd=friday am=9:00',
            noon: 'd=friday pm=12:00',
            pm: 'd=friday pm=3:00',
            end: 'd=friday pm=6:00',
            eve: 'd=friday pm=11:00',
          },
        });

        const due = JSON.parse(response.dueShortcuts || dueShortcuts_k);

        const $g2t = $('#g2tDue_Shortcuts', this.$popup);
        $g2t.html(''); // Clear it.

        let opt =
          '<option value="none" selected disabled hidden>-</option>' +
          '<option value="d=0 am=0">--</option>';

        g2t_each(due, (value, key) => {
          // value is already available from the callback parameter
          if (typeof value === 'object') {
            opt += `<optgroup label="${key}">`;
            g2t_each(value, (value1, key1) => {
              // value1 is already available from the callback parameter
              opt += `<option value="${value1}">${key1}</option>`;
            });
            opt += '</optgroup>';
          } else {
            opt += `<option value="${value}">${key}</option>`;
          }
        });

        if (opt) {
          $g2t.append($(opt));
        }
      });
    } catch (error) {
      this.handleChromeAPIError(error, 'bindData');
    }

    if (!data) {
      g2t_log("bindData shouldn't continue without data!");
      return;
    }

    const state_existing_k = this?.state || {};
    const state_existing_boardId_valid_k = !!state_existing_k?.boardId;

    const state_incoming_k = data || {};
    const state_incoming_boardId_valid_k = !!state_incoming_k?.boardId;

    if (state_incoming_k && state_incoming_boardId_valid_k) {
      // leave state that came in, they look valid
      this.state = data;
    } else if (state_existing_k && state_existing_boardId_valid_k) {
      // use existing state
      this.state = { ...state_existing_k, ...data };
    } else {
      this.state = data;
    }

    // bind trello data
    const me = data?.trello?.user || {}; // First member is always this user

    const avatarUrl = me.avatarUrl || '';
    const avatarSrc = this.app.utils.makeAvatarUrl({ avatarUrl });
    let avatarText = '';
    let initials = '?';

    if (!avatarSrc) {
      if (me.initials?.length > 0) {
        initials = me.initials;
      } else if (me.fullName?.length > 1) {
        const matched = me.fullName.match(/^(\w).*?[\s\\W]+(\w)\w*$/);
        if (matched && matched.length > 1) {
          initials = matched[1] + matched[2]; // 0 is whole string
        }
      } else if (me.username?.length > 0) {
        initials = me.username.slice(0, 1);
      }

      avatarText = initials.toUpperCase();
      $('#g2tAvatarImgOrText', this.$popup).text(avatarText);
    } else {
      $('#g2tAvatarImgOrText', this.$popup).html(
        '<img width="30" height="30" alt="' +
          me.username +
          '" src="' +
          avatarSrc +
          '">'
      );
    }

    $('#g2tAvatarUrl', this.$popup).attr('href', me.url);

    $('#g2tUsername', this.$popup)
      .attr('href', me.url)
      .text(me.username || '?');

    if (data?.useBackLink !== undefined) {
      $('#chkBackLink', this.$popup).prop('checked', data.useBackLink);
    }

    if (data?.addCC !== undefined) {
      $('#chkCC', this.$popup).prop('checked', data.addCC);
    }

    $(document).on('keyup', '.g2t-checkbox', evt => {
      if (evt.which == 13 || evt.which == 32) {
        $(evt.target).trigger('click');
      }
    });
    $(document).on('keydown', '.g2t-checkbox', evt => {
      if (evt.which == 13 || evt.which == 32) {
        $(evt.target).trigger('mousedown');
      }
    });

    if (data?.markdown !== undefined) {
      $('#chkMarkdown', this.$popup).prop('checked', data.markdown);
    }

    if (data?.dueDate !== undefined) {
      $('#g2tDue_Date', this.$popup).val(data.dueDate);
    }

    if (data?.dueTime !== undefined) {
      $('#g2tDue_Time', this.$popup).val(data.dueTime);
    }

    // Attach reportError function to report id if in text:
    $('#report', this.$popup).click(() => {
      this.reset();

      const lastError_k = (this.lastError || '') + (this.lastError ? '\n' : '');

      const user_k = this?.state?.trello?.user || {};
      const username_k = user_k?.username || '';
      const fullname_k = user_k?.fullName || '';
      const date_k = new Date().toISOString().substring(0, 10);

      // Modify this.data directly for error reporting
      this.state.description =
        lastError_k + JSON.stringify(this.state) + '\n' + g2t_log();
      this.state.title =
        'Error report card: ' +
        [fullname_k, username_k].join(' @') +
        ' ' +
        date_k;

      this.form.updateBoards('52e1397addf85d4751f99319'); // GtT board
      $('#g2tDesc', this.$popup).val(this.state.description);
      $('#g2tTitle', this.$popup).val(this.state.title);
      this.validateData_deprecated();
    });

    this.$popupMessage.hide();
    this.$popupContent.show();

    this.form.updateBoards();

    // Setting up comboboxes after loading data.
    this.form.comboBox();
  }

  mime_html_deprecated(tag, isImage, data) {
    const self = this;
    let html = '';
    let img = '';
    let img_big = '';
    const domTag_k = `#g2t${tag.charAt(0).toUpperCase()}${tag
      .slice(1)
      .toLowerCase()}`;
    const $domTag = $(domTag_k, this.$popup);

    const domTagContainer = domTag_k + 'Container';
    const $domTagContainer = $(domTagContainer, this.$popup);
    $domTagContainer.css('display', data[tag].length > 0 ? 'block' : 'none');

    if (isImage && isImage === true) {
      img =
        '<div class="img-container"><img src="%url%" alt="%name%" /></div> ';
    }

    let x = 0;
    g2t_each(data[tag], item => {
      const dict = {
        url: item.url,
        name: item.name,
        mimeType: item.mimeType,
        img,
        id: `${item.name}:${x}`,
      };

      if (tag == 'attachments') {
        html += this.app.utils.replacer(
          '<div class="imgOrAttach textOnlyPopup" title="%name%"><input type="checkbox" id="%id%" class="g2t-checkbox" mimeType="%mimeType%" name="%name%" url="%url%" checked /><label for="%id%">%name%</label></div>',
          dict
        );
      } else if (tag == 'images') {
        html += this.app.utils.replacer(
          '<div class="imgOrAttach"><input type="checkbox" id="%id%" mimeType="%mimeType%" class="g2t-checkbox" name="%name%" url="%url%" /><label for="%id%" title="%name%"> %img% </label></div>',
          dict
        );
      }
      x++;
    });

    $domTag.html(html);

    if (isImage && isImage === true) {
      $('img', $domTag).each(function () {
        const $img = $(this);
        $img
          .on('error', function () {
            $img.attr(
              'src',
              chrome.runtime.getURL('images/doc-question-mark-512.png')
            );
          })
          .tooltip({
            track: true,
            content: function () {
              const dict = {
                src: $img.attr('src'),
                alt: $img.attr('alt'),
              };
              return self.app.utils.replacer('<img src="%src%">%alt%', dict);
            },
          });
      });
      $('.textOnlyPopup').tooltip({
        track: true,
      });
    }
  }

  bindGmailData_deprecated(data = {}) {
    if ($.isEmptyObject(data)) {
      return;
    }

    // Merge with existing state
    Object.assign(data, this.state || {});
    this.updateBody_deprecated(data);

    $('#g2tTitle', this.$popup).val(data.subject);

    this.form.mime_html('attachments', false, data);
    this.form.mime_html('images', true, data);

    const emailId = data.emailId || 0;
    const mapAvailable_k = this.app.model.emailBoardListCardMapLookup({
      emailId,
    });

    if (
      ['boardId', 'listId', 'cardId'].every(field => !!mapAvailable_k?.[field])
    ) {
      $('#g2tPosition', this.$popup).val('to');
      this.form.updateBoards(mapAvailable_k.boardId);
      const listId = mapAvailable_k.listId;
      const cardId = mapAvailable_k.cardId;
      this.updatesPending.push({ listId });
      this.updatesPending.push({ cardId });
    }

    this.dataDirty = false;
    this.validateData_deprecated();
  }

  showMessage_deprecated(parent, text) {
    // Guard against calling before DOM elements are initialized
    if (!this.$popupMessage) {
      g2t_log('PopupView:showMessage: DOM not ready, deferring message');
      // Store message to show later when DOM is ready
      this.pendingMessage = { parent, text };
      return;
    }

    this.$popupMessage.html(text);

    // Attach hideMessage function to hideMsg class if in text:
    $('.hideMsg', this.$popupMessage).click(() => {
      parent.form.hideMessage();
    });

    const self = this;
    $(':button', this.$popupMessage).click(event => {
      const $status = $(`span#${event.target.id}`, this.$popupMessage) || '';
      switch (event.target.id) {
        case 'signout':
          $status.html('Done');
          this.app.events.fire('onRequestDeauthorizeTrello');
          break;
        case 'reload':
          this.forceSetVersion(); // Sets value for version if needing update
          $status.html('Reloading');
          window.location.reload(true);
          break;
        case 'clearCacheNow':
          $status.html('Clearing');
          let hash = {};
          hash[this.CLEAR_EXT_BROWSING_DATA] = true;
          try {
            chrome.runtime.sendMessage(hash, () => {
              $status.html('Done');
              setTimeout(() => {
                $status.html('&nbsp;');
              }, 2500);
            });
          } catch (error) {
            this.handleChromeAPIError(error, 'showMessage');
          }
          break;
        case 'showsignout':
          this.showSignOutOptions();
        default:
          g2t_log(`showMessage: ERROR unhandled case "${event.target.id}"`);
      }
      if ($status.length > 0) {
        setTimeout(() => {
          $status.html('&nbsp;');
        }, 2500);
      }
    });

    this.$popupMessage.show();
  }

  hideMessage_deprecated() {
    // Guard against calling before DOM elements are initialized
    if (!this.$popupMessage || !this.$popupContent) {
      return;
    }

    if (this.$popupContent.is(':hidden')) {
      // Rest of box is hidden so close it all:
      this.$popup.hide(); // Parent is popup, so hide the whole thing
    } else {
      this.$popupMessage.hide();
    }
  }

  clearBoard_deprecated() {
    const $g2t = $('#g2tBoard', this.$popup);
    $g2t.html(''); // Clear it.

    $g2t.append($('<option value="">Select a board....</option>'));

    $g2t.change();
  }

  updateBoards_deprecated(tempId = 0) {
    const array_k = this?.state?.trello?.boards || [];

    if (!array_k) {
      return;
    }

    const restoreId_k = tempId || this?.state?.boardId || 0;

    let newArray = {};

    g2t_each(array_k, item => {
      const org_k = item?.organization?.displayName
        ? `!${item.organization.displayName}: `
        : '~';
      const display_k = `${org_k}${item.name}`; // Ignore first char, it's used just for sorting
      newArray[display_k.toLowerCase()] = {
        id: item.id,
        display: display_k,
      };
    });

    const $g2t = $('#g2tBoard', this.$popup);
    $g2t.html(''); // Clear it.

    $g2t.append($('<option value="">Select a board....</option>'));

    g2t_each(Object.keys(newArray).sort(), item => {
      const id_k = newArray[item].id;
      const display_k = newArray[item].display.substring(1); // Ignore first char, it's used just for sorting
      const selected_k = id_k == restoreId_k;
      $g2t.append(
        $('<option>')
          .attr('value', id_k)
          .prop('selected', selected_k)
          .append(display_k)
      );
    });
    $g2t.change();
  }

  updateLists_deprecated(tempId = 0) {
    const array_k = this?.state?.trello?.lists || [];

    if (!array_k) {
      return;
    }

    const settings_k = this?.state?.settings || {};

    const boardId_k = $('#g2tBoard', this.$popup).val();

    const prev_item_k =
      settings_k?.boardId == boardId_k && settings_k?.listId
        ? settings_k.listId
        : 0;

    const first_item_k = array_k.length ? array_k[0].id : 0; // Default to first item

    const updatePending_k = this.updatesPending[0]?.listId
      ? this.updatesPending.shift().listId
      : 0;

    const restoreId_k =
      updatePending_k || tempId || prev_item_k || first_item_k || 0;

    const $g2t = $('#g2tList', this.$popup);
    $g2t.html('');

    g2t_each(array_k, item => {
      const id_k = item.id;
      const display_k = item.name;
      const selected_k = id_k == restoreId_k;
      $g2t.append(
        $('<option>')
          .attr('value', id_k)
          .prop('selected', selected_k)
          .append(display_k)
      );
    });

    $g2t.change();
  }

  updateCards_deprecated(tempId = 0) {
    const new_k = '<option value="-1">(new card at top)</option>';

    const array_k = this?.state?.trello?.cards || [];

    if (!array_k) {
      return;
    }

    const settings_k = this?.state?.settings || {};

    const listId_k = $('#g2tList', this.$popup).val();

    const prev_item_k =
      settings_k?.listId == listId_k && settings_k?.cardId
        ? settings_k.cardId
        : 0;

    const first_item_k = array_k.length ? array_k[0].id : 0; // Default to first item

    const updatePending_k = this.updatesPending[0]?.cardId
      ? this.updatesPending.shift().cardId
      : 0;

    const restoreId_k =
      updatePending_k || tempId || prev_item_k || first_item_k || 0;

    const $g2t = $('#g2tCard', this.$popup);
    $g2t.html(new_k);

    g2t_each(array_k, item => {
      const id_k = item.id;
      const display_k = this.app.utils.truncate(item.name, 80, '...');
      const selected_k = id_k == restoreId_k;
      $g2t.append(
        $('<option>')
          .attr('value', id_k)
          .prop('pos', item.pos)
          .prop('members', item.idMembers)
          .prop('labels', item.idLabels)
          .prop('selected', selected_k)
          .append(display_k)
      );
    });

    $g2t.change();
  }

  // Select/de-select attachments and images based on first button's state:
  toggleCheckboxes_deprecated(tag) {
    const $jTags = $(`#${tag} input[type="checkbox"]`, this.$popup);
    const $jTag1 = $jTags.first();
    const checked_k = $jTag1.prop('checked') || false;
    $jTags.prop('checked', !checked_k);
    this.validateData_deprecated();
  }

  clearLabels_deprecated() {
    this.state.labelsId = '';
    this.updateLabels();
    this.validateData();
  }

  updateLabels_deprecated() {
    const labels = this.state.trello.labels;
    const $g2t = $('#g2tLabels', this.$popup);
    $g2t.html(''); // Clear out

    for (let i = 0; i < labels.length; i++) {
      const item = labels[i];
      if (item.name?.length > 0) {
        const $color = $("<div id='g2t_temp'>").css('color', item.color);
        const bkColor = this.app.utils.luminance($color.css('color')); // If you'd like to determine whether to make the background light or dark
        $g2t.append(
          $('<button>')
            .attr('trelloId-label', item.id)
            .css('border-color', item.color)
            // .css("background-color", bkColor)
            .append(item.name)
            .on('mousedown mouseup', evt => {
              const elm = $(evt.currentTarget);
              this.toggleActiveMouseDown(elm);
            })
            .on('keypress', evt => {
              const trigger_k =
                evt.which == 13 ? 'mousedown' : evt.which == 32 ? 'click' : '';
              if (trigger_k) {
                $(evt.target).trigger(trigger_k);
              }
            })
        );
      }
    }

    $('#g2tLabelsMsg', this.$popup).hide();

    this.menuCtrl.reset({
      selectors: '#g2tLabels button',
      nonexclusive: true,
    });

    const state = this.state;
    const boardId = $('#g2tBoard', this.$popup).val();
    if (state.boardId && state.boardId === boardId && state.labelsId) {
      const settingId = state.labelsId;
      for (let i = 0; i < labels.length; i++) {
        const item = labels[i];
        if (settingId.indexOf(item.id) !== -1) {
          $(
            `#g2tLabels button[trelloId-label="${item.id}"]`,
            this.$popup
          ).click();
        }
      }
    } else {
      this.state.labelsId = ''; // Labels do not have to be set, so no default.
    }

    $g2t.show();
  }

  clearMembers_deprecated() {
    this.state.membersId = '';
    this.updateMembers();
    this.validateData();
  }

  updateMembers_deprecated() {
    const members = this.state.trello.members;
    const $g2t = $('#g2tMembers', this.$popup);
    $g2t.html(''); // Clear out

    for (let i = 0; i < members.length; i++) {
      const item = members[i];
      if (item && item.id) {
        const txt = item.initials || item.username || '?';
        const avatar =
          this.app.utils.makeAvatarUrl({
            avatarUrl: item.avatarUrl || '',
          }) ||
          chrome.runtime.getURL('images/avatar_generic_profile_gry_30x30.png'); // Default generic profile
        const size_k = 20;
        $g2t.append(
          $('<button>')
            .attr('trelloId-member', item.id)
            .attr('title', item.fullName + ' @' + item.username || '?')
            .attr('class', 'g2t-holder-button')
            .append(
              $('<img>')
                .attr('src', avatar)
                .attr('width', size_k)
                .attr('height', size_k)
            )
            .append(' ' + txt)
            .on('mousedown mouseup', evt => {
              const elm = $(evt.currentTarget);
              this.toggleActiveMouseDown(elm);
            })
            // NOTE (Ace, 2021-02-08): crlf uses mousedown, spacebar uses click:
            .on('keypress', evt => {
              const trigger_k =
                evt.which == 13 ? 'mousedown' : evt.which == 32 ? 'click' : '';
              if (trigger_k) {
                $(evt.target).trigger(trigger_k);
              }
            })
        );
      }
    }

    $('#g2tMembersMsg', this.$popup).hide();

    this.menuCtrl.reset({
      selectors: '#g2tMembers button',
      nonexclusive: true,
    });

    const state = this.state;
    if (state.membersId?.length > 0) {
      const settingId = state.membersId;
      for (let i = 0; i < members.length; i++) {
        const item = members[i];
        if (settingId.indexOf(item.id) !== -1) {
          $(
            `#g2tMembers button[trelloId-member="${item.id}"]`,
            this.$popup
          ).click();
        }
      }
    } else {
      this.state.membersId = '';
    }

    $g2t.show();
  }

  mime_array_deprecated(tag) {
    const self = this;
    const tag_formatted = `#${tag} input[type="checkbox"]`;
    const $jTags = $(tag_formatted, self.$popup);
    let array = [];
    let item = {};
    let checked_total = 0;

    $jTags.each(function () {
      const checked = $(this).is(':checked');
      if (checked) {
        checked_total++;
      }
      item = {
        url: $(this).attr('url'),
        name: $(this).attr('name'),
        mimeType: $(this).attr('mimeType'),
        checked,
      };
      array.push(item);
    });

    return { array, checked_total };
  }

  validateData_deprecated() {
    const self = this;
    let newCard = {};
    const boardId = $('#g2tBoard', this.$popup).val();
    const listId = $('#g2tList', this.$popup).val();
    const emailId = $('#g2tDesc', this.$popup).attr(this.ck.emailIdAttr) || 0;
    g2t_log(
      `validateData: boardId="${boardId}", listId="${listId}", emailId="${emailId}"`
    );
    const position = $('#g2tPosition', this.$popup).val();
    const $card = $('#g2tCard', this.$popup).find(':selected').first();
    const cardId = $card.val() || '';
    const cardPos = $card.prop('pos') || '';
    const cardMembers = $card.prop('members') || '';
    const cardLabels = $card.prop('labels') || '';
    const dueDate = $('#g2tDue_Date', this.$popup).val();
    const dueTime = $('#g2tDue_Time', this.$popup).val();
    const title = $('#g2tTitle', this.$popup).val();
    const description = $('#g2tDesc', this.$popup).val();
    const useBackLink = $('#chkBackLink', this.$popup).is(':checked');
    const addCC = $('#chkCC', this.$popup).is(':checked');
    const markdown = $('#chkMarkdown', this.$popup).is(':checked');
    const timeStamp = $('.gH .gK .g3:first', this.$visibleMail).attr('title');
    const popupWidth = this.$popup.css('width');
    let labelsId = $('#g2tLabels button.active', this.$popup)
      .map(function (iter, item) {
        const val = $(item).attr('trelloId-label');
        return val;
      })
      .get()
      .join();
    const labelsCount = $('#g2tLabels button', self.$popup).length;

    if (!labelsCount && labelsId.length < 1 && self.state?.labelsId) {
      labelsId = self.state.labelsId; // We're not yet showing labels so override labelsId with state
    }

    let membersId = $('#g2tMembers button.active', self.$popup)
      .map(function (iter, item) {
        const val = $(item).attr('trelloId-member');
        return val;
      })
      .get()
      .join();
    const membersCount = $('#g2tMembers button', self.$popup).length;

    if (!membersCount && membersId.length < 1 && self.state?.membersId) {
      membersId = self.state.membersId; // We're not yet showing members so override membersId with state
    }

    const attach_k = this.mime_array('g2tAttachments');
    let attachments = attach_k.array;
    let attachments_checked = attach_k.checked_total;

    const images_k = this.mime_array('g2tImages');
    let images = images_k.array;
    let images_checked = images_k.checked_total;

    const validateStatus =
      boardId &&
      listId &&
      title /* && (description || attachments_checked > 0 || images_checked > 0) // Not sure we need to require these */
        ? true
        : false; // Labels are not required

    if (validateStatus) {
      this.state = {
        emailId,
        boardId,
        listId,
        cardId,
        cardPos,
        cardMembers,
        cardLabels,
        labelsId,
        membersId,
        dueDate,
        dueTime,
        title,
        description,
        attachments,
        images,
        useBackLink,
        addCC,
        markdown,
        popupWidth,
        position,
        timeStamp,
      };
      // State is already updated, just save it
      this.saveState();
    }

    const setDisabledAttrToFalseWhenValid = validateStatus ? false : 'disabled';
    $('#addToTrello', this.$popup).attr(
      'disabled',
      setDisabledAttrToFalseWhenValid
    );

    return validateStatus;
  }

  reset_deprecated() {
    this.$popupMessage.hide();
    this.$popupContent.show();
  }

  displaySubmitCompleteForm_deprecated(params) {
    const trelloData = params?.data || {};
    const cardUrl = trelloData.url || trelloData.shortUrl || '';
    const cardTitle = trelloData.name || this.state?.title || 'Card';

    const jQueryToRawHtml = jQueryObject => {
      return jQueryObject.prop('outerHTML');
    };

    const trelloLink = $('<a>')
      .attr('href', cardUrl)
      .attr('target', '_blank')
      .append(cardTitle);

    const message =
      '<a class="hideMsg" title="Dismiss message">&times;</a>Trello card updated: ' +
      jQueryToRawHtml(trelloLink);

    this.showMessage(this, message);

    this.$popupContent.hide();

    // Fire event to notify that form display is complete
    this.app.events.fire('submittedFormShownComplete', { data: trelloData });
  }

  displayAPIFailedForm_deprecated(response) {
    let resp = {};
    if (response && response.data) {
      resp = response.data;
    }

    // Check for 400 errors and show reload option
    if (resp?.status == 400) {
      resp.statusText =
        'Board/List data may be stale. You can try reloading your Trello boards.';
    }

    if (this.state && this.state.title) {
      resp.title = this.state.title; // Put a temp copy of this over where we'll get the other data
    }

    const dict_k = {
      title: resp.title || '?',
      status: resp.status || '?',
      statusText: resp.statusText || '?',
      responseText: resp.responseText || JSON.stringify(response),
      method: resp.method || '?',
      keys: resp.keys || '?',
    };

    $.get(chrome.runtime.getURL('views/error.html'), data => {
      let lastErrorHtml_k = this.app.utils.replacer(data, dict_k);

      // Add reload button for 400 errors
      if (resp?.status == 400) {
        lastErrorHtml_k +=
          '<br><button id="reloadTrelloBoards" class="g2t-button">Reload Trello Boards</button>';
      }

      this.showMessage(this, lastErrorHtml_k);
      this.lastError = JSON.stringify(dict_k);
      this.$popupContent.hide();

      // Handle reload button click for 400 errors
      if (resp?.status == 400) {
        $('#reloadTrelloBoards').on('click', () => {
          g2t_log('User clicked reload Trello boards button');
          this.app.model.loadTrelloData();
          this.reset(); // Hide error message and show popup content
        });
      }

      if (resp?.status == 401) {
        // Invalid token, so deauthorize Trello
        this.app.events.fire('onRequestDeauthorizeTrello');
      }
    });
  }

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

  handleBoardChanged(target, params) {
    const boardId = params.boardId;
    if (boardId !== '_' && boardId !== '' && boardId !== null) {
      this.app.model.loadTrelloLists(boardId);
      this.app.model.loadTrelloLabels(boardId);
      this.app.model.loadTrelloMembers(boardId);
    }
  }

  handleListChanged(target, params) {
    const listId = params.listId;
    this.app.model.loadTrelloCards(listId);
  }



  handleSubmit_deprecated() {
    if (this.$popupContent) {
      this.$popupContent.hide();
    }
    this.form.showMessage(this, 'Submitting to Trello...');
    this.app.events.fire('onSubmit');
  }

  handleCheckTrelloAuthorized_deprecated() {
    this.form.showMessage(this.app, 'Authorizing...');
    this.app.model.checkTrelloAuthorized();
  }

  handleRequestDeauthorizeTrello_deprecated() {
    g2t_log('onRequestDeauthorizeTrello');
    this.app.model.deauthorizeTrello();
    this.clearBoard_deprecated();
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



  handleLoadTrelloListSuccess_deprecated() {
    this.updateLists_deprecated();
    this.validateData_deprecated();
  }

  handleLoadTrelloCardsSuccess_deprecated() {
    this.updateCards_deprecated();
    this.validateData_deprecated();
  }

  handleLoadTrelloLabelsSuccess_deprecated() {
    this.updateLabels_deprecated();
    this.validateData_deprecated();
  }

  handleLoadTrelloMembersSuccess_deprecated() {
    this.updateMembers_deprecated();
    this.validateData_deprecated();
  }

  handleAPIFailure(target, params) {
    this.form.displayAPIFailedForm(params);
  }

  handleNewCardUploadsComplete(target, params) {
    this.form.displaySubmitCompleteForm(params);
    // Fire final event for data manipulations
    this.app.events.fire('postCardCreateUploadDisplayDone', {
      data: params.data,
    });
  }

  handleRuntimeMessage(request, sender, sendResponse) {
    if (request?.message === 'g2t_keyboard_shortcut') {
      this.showPopup();
    }
  }

  handleOnMenuClick(target, params) {
    this.validateData_deprecated();
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
      this.form.showMessage(this.pendingMessage.parent, this.pendingMessage.text);
      this.pendingMessage = null;
    }

    // Bind all events now that DOM is ready
    this.bindPopupEvents();

    // DOM event bindings moved from bindEvents()
    this.resetDragResize();

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
      .hover(
        function () {
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
      } else {
        $members.hide();
        $labels.hide();
      }
      this.app.events.fire('onBoardChanged', { boardId });
      if (this.form.comboBox) this.form.comboBox('updateValue');
      this.validateData_deprecated();
    });

    const $list = $('#g2tList', this.$popup);
    $list.off('change').on('change', () => {
      const listId = $list.val();
      this.app.events.fire('onListChanged', { listId });
      if (this.form.comboBox) this.form.comboBox('updateValue');
      this.validateData_deprecated();
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
        this.validateData_deprecated();
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
        this.validateData_deprecated();
      });

    $('#g2tSubmit', this.$popup)
      .off('click')
      .on('click', () => {
        this.form.submit();
      });

    $('#g2tSignOut', this.$popup)
      .off('click')
      .on('click', () => {
        this.app.events.fire('onRequestDeauthorizeTrello');
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

    // Attachment and image header click handlers for toggling checkboxes
    $('#g2tAttachHeader', this.$popup)
      .off('click')
      .on('click', event => {
        if (this.app.utils.modKey(event)) {
          this.form.toggleCheckboxes('g2tAttachments');
        }
      });

    $('#g2tImagesHeader', this.$popup)
      .off('click')
      .on('click', event => {
        if (this.app.utils.modKey(event)) {
          this.form.toggleCheckboxes('g2tImages');
        }
      });
  }

  init() {
    // g2t_log('PopupView:init');

    // Create MenuControl instance
    this.menuCtrl = new G2T.MenuControl({ app: this.app });

    // Initialize form component
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
