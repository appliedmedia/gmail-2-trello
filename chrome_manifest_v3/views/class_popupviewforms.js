var G2T = G2T || {}; // must be var to guarantee correct scope

class PopupViewForm {
  static get id() {
    return 'g2t_popupviewform';
  }

  get id() {
    return PopupViewForm.id;
  }

  constructor(args) {
    this.parent = args.parent;
    this.app = args.app;
    this.isInitialized = false;
  }

  init() {
    this.isInitialized = true;
    this.bindEvents();
  }

  bindEvents() {
    // Form event handlers - these belong in PopupViewForm
    this.app.events.addListener('onSubmit', this.handleSubmit.bind(this));
    this.app.events.addListener('checkTrelloAuthorized', this.handleCheckTrelloAuthorized.bind(this));
    this.app.events.addListener('onRequestDeauthorizeTrello', this.handleRequestDeauthorizeTrello.bind(this));
    this.app.events.addListener('onLoadTrelloListSuccess', this.handleLoadTrelloListSuccess.bind(this));
    this.app.events.addListener('onLoadTrelloCardsSuccess', this.handleLoadTrelloCardsSuccess.bind(this));
    this.app.events.addListener('onLoadTrelloLabelsSuccess', this.handleLoadTrelloLabelsSuccess.bind(this));
    this.app.events.addListener('onLoadTrelloMembersSuccess', this.handleLoadTrelloMembersSuccess.bind(this));
    this.app.events.addListener('onAPIFailure', this.handleAPIFailure.bind(this));
    this.app.events.addListener('newCardUploadsComplete', this.handleNewCardUploadsComplete.bind(this));
    this.app.events.addListener('onMenuClick', this.handleOnMenuClick.bind(this));
  }

  // Form Data & Validation
  validateData() {
    const data = this.parent.state;
    const errors = [];

    if (!data.boardId || data.boardId === '') {
      errors.push('Please select a board');
    }

    if (!data.listId || data.listId === '') {
      errors.push('Please select a list');
    }

    if (!data.cardName || data.cardName.trim() === '') {
      errors.push('Please enter a card name');
    }

    if (data.cardName && data.cardName.length > 16384) {
      errors.push('Card name is too long (max 16384 characters)');
    }

    if (data.cardDesc && data.cardDesc.length > 16384) {
      errors.push('Card description is too long (max 16384 characters)');
    }

    return errors;
  }

  bindData(data) {
    $('.header a').each(() => {
      $(document).on('keyup', $(this), evt => {
        if (evt.which == 13 || evt.which == 32) {
          $(evt.target).trigger('click');
        }
      });
    });
    $('#g2tSignOutButton', this.parent.$popup).click(() => {
      this.parent.showSignOutOptions();
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

        const $g2t = $('#g2tDue_Shortcuts', this.parent.$popup);
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
      this.parent.handleChromeAPIError(error, 'bindData');
    }

    if (!data) {
      g2t_log("bindData shouldn't continue without data!");
      return;
    }

    const state_existing_k = this.parent?.state || {};
    const state_existing_boardId_valid_k = !!state_existing_k?.boardId;

    const state_incoming_k = data || {};
    const state_incoming_boardId_valid_k = !!state_incoming_k?.boardId;

    if (state_incoming_k && state_incoming_boardId_valid_k) {
      // leave state that came in, they look valid
      this.parent.state = data;
    } else if (state_existing_k && state_existing_boardId_valid_k) {
      // use existing state
      this.parent.state = { ...state_existing_k, ...data };
    } else {
      this.parent.state = data;
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
      $('#g2tAvatarImgOrText', this.parent.$popup).text(avatarText);
    } else {
      $('#g2tAvatarImgOrText', this.parent.$popup).html(
        '<img width="30" height="30" alt="' +
          me.username +
          '" src="' +
          avatarSrc +
          '">'
      );
    }

    $('#g2tAvatarUrl', this.parent.$popup).attr('href', me.url);

    $('#g2tUsername', this.parent.$popup)
      .attr('href', me.url)
      .text(me.username || '?');

    if (data?.useBackLink !== undefined) {
      $('#chkBackLink', this.parent.$popup).prop('checked', data.useBackLink);
    }

    if (data?.addCC !== undefined) {
      $('#chkCC', this.parent.$popup).prop('checked', data.addCC);
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
      $('#chkMarkdown', this.parent.$popup).prop('checked', data.markdown);
    }

    if (data?.dueDate !== undefined) {
      $('#g2tDue_Date', this.parent.$popup).val(data.dueDate);
    }

    if (data?.dueTime !== undefined) {
      $('#g2tDue_Time', this.parent.$popup).val(data.dueTime);
    }

    // Attach reportError function to report id if in text:
    $('#report', this.parent.$popup).click(() => {
      this.reset();

      const lastError_k = (this.parent.lastError || '') + (this.parent.lastError ? '\n' : '');

      const user_k = this.parent?.state?.trello?.user || {};
      const username_k = user_k?.username || '';
      const fullname_k = user_k?.fullName || '';
      const date_k = new Date().toISOString().substring(0, 10);

      // Modify this.data directly for error reporting
      this.parent.state.description =
        lastError_k + JSON.stringify(this.parent.state) + '\n' + g2t_log();
      this.parent.state.title =
        'Error report card: ' +
        [fullname_k, username_k].join(' @') +
        ' ' +
        date_k;

      this.updateBoards('52e1397addf85d4751f99319'); // GtT board
      $('#g2tDesc', this.parent.$popup).val(this.parent.state.description);
      $('#g2tTitle', this.parent.$popup).val(this.parent.state.title);
      this.validateData();
    });

    this.parent.$popupMessage.hide();
    this.parent.$popupContent.show();

    this.updateBoards();

    // Setting up comboboxes after loading data.
    this.comboBox();
  }

  bindGmailData(data = {}) {
    if ($.isEmptyObject(data)) {
      return;
    }

    // Merge with existing state
    Object.assign(data, this.parent.state || {});
    this.parent.updateBody(data);

    $('#g2tTitle', this.parent.$popup).val(data.subject);

    this.mime_html('attachments', false, data);
    this.mime_html('images', true, data);

    const emailId = data.emailId || 0;
    const mapAvailable_k = this.app.model.emailBoardListCardMapLookup({
      emailId,
    });

    if (
      ['boardId', 'listId', 'cardId'].every(field => !!mapAvailable_k?.[field])
    ) {
      $('#g2tPosition', this.parent.$popup).val('to');
      this.updateBoards(mapAvailable_k.boardId);
      const listId = mapAvailable_k.listId;
      const cardId = mapAvailable_k.cardId;
      this.parent.updatesPending.push({ listId });
      this.parent.updatesPending.push({ cardId });
    }

    this.parent.dataDirty = false;
    this.validateData();
  }

  updateBody(data = {}) {
    const attribute_storage_k = this.parent.ATTRIBUTE_STORAGE;

    const markdown_k =
      data?.markdown ?? $('#chkMarkdown', this.parent.$popup).is(':checked');
    const useBackLink_k =
      data?.useBackLink ?? $('#chkBackLink', this.parent.$popup).is(':checked');
    const addCC_k = data?.addCC ?? $('#chkCC', this.parent.$popup).is(':checked');
    const $g2tDesc = $('#g2tDesc', this.parent.$popup);

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
      this.parent.MAX_BODY_SIZE - (link_k.length + cc_k.length),
      '...'
    );
    const val_k = link_k + cc_k + desc_k;

    $g2tDesc.val(val_k);
    $g2tDesc.change();
  }

  mime_array(tag) {
    const self = this;
    const tag_formatted = `#${tag} input[type="checkbox"]`;
    const $jTags = $(tag_formatted, self.parent.$popup);
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

  reset() {
    // Reset form to initial state
    $('#g2tCardName', this.parent.$popup).val('');
    $('#g2tCardDesc', this.parent.$popup).val('');
    $('#g2tBoard', this.parent.$popup).val('');
    $('#g2tList', this.parent.$popup).val('');
    
    // Clear checkboxes
    $('input[type="checkbox"]', this.parent.$popup).prop('checked', false);
  }

  // UI Updates
  updateBoards(tempId = 0) {
    const boards = this.parent.state.boards || [];
    const $boardSelect = $('#g2tBoard', this.parent.$popup);
    
    $boardSelect.empty();
    $boardSelect.append('<option value="">Select a board...</option>');
    
    boards.forEach(board => {
      $boardSelect.append(`<option value="${board.id}">${board.name}</option>`);
    });

    if (tempId > 0) {
      $boardSelect.val(tempId);
    }
  }

  updateLists(tempId = 0) {
    const array_k = this.parent?.state?.trello?.lists || [];

    if (!array_k) {
      return;
    }

    const settings_k = this.parent?.state?.settings || {};

    const boardId_k = $('#g2tBoard', this.parent.$popup).val();

    const prev_item_k =
      settings_k?.boardId == boardId_k && settings_k?.listId
        ? settings_k.listId
        : 0;

    const first_item_k = array_k.length ? array_k[0].id : 0; // Default to first item

    const updatePending_k = this.parent.updatesPending[0]?.listId
      ? this.parent.updatesPending.shift().listId
      : 0;

    const restoreId_k =
      updatePending_k || tempId || prev_item_k || first_item_k || 0;

    const $g2t = $('#g2tList', this.parent.$popup);
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

  updateCards(tempId = 0) {
    const new_k = '<option value="-1">(new card at top)</option>';

    const array_k = this.parent?.state?.trello?.cards || [];

    if (!array_k) {
      return;
    }

    const settings_k = this.parent?.state?.settings || {};

    const listId_k = $('#g2tList', this.parent.$popup).val();

    const prev_item_k =
      settings_k?.listId == listId_k && settings_k?.cardId
        ? settings_k.cardId
        : 0;

    const first_item_k = array_k.length ? array_k[0].id : 0; // Default to first item

    const updatePending_k = this.parent.updatesPending[0]?.cardId
      ? this.parent.updatesPending.shift().cardId
      : 0;

    const restoreId_k =
      updatePending_k || tempId || prev_item_k || first_item_k || 0;

    const $g2t = $('#g2tCard', this.parent.$popup);
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

  updateLabels() {
    const labels = this.parent.state.trello.labels;
    const $g2t = $('#g2tLabels', this.parent.$popup);
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
              this.parent.toggleActiveMouseDown(elm);
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

    $('#g2tLabelsMsg', this.parent.$popup).hide();

    this.parent.menuCtrl.reset({
      selectors: '#g2tLabels button',
      nonexclusive: true,
    });

    const state = this.parent.state;
    const boardId = $('#g2tBoard', this.parent.$popup).val();
    if (state.boardId && state.boardId === boardId && state.labelsId) {
      const settingId = state.labelsId;
      for (let i = 0; i < labels.length; i++) {
        const item = labels[i];
        if (settingId.indexOf(item.id) !== -1) {
          $(
            '#g2tLabels button[trelloId-label="' + item.id + '"]',
            this.parent.$popup
          ).click();
        }
      }
    } else {
      this.parent.state.labelsId = ''; // Labels do not have to be set, so no default.
    }

    $g2t.show();
  }

  updateMembers() {
    const members = this.parent.state.trello.members;
    const $g2t = $('#g2tMembers', this.parent.$popup);
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
              this.parent.toggleActiveMouseDown(elm);
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

    $('#g2tMembersMsg', this.parent.$popup).hide();

    this.parent.menuCtrl.reset({
      selectors: '#g2tMembers button',
      nonexclusive: true,
    });

    const state = this.parent.state;
    if (state.membersId?.length > 0) {
      const settingId = state.membersId;
      for (let i = 0; i < members.length; i++) {
        const item = members[i];
        if (settingId.indexOf(item.id) !== -1) {
          $(
            '#g2tMembers button[trelloId-member="' + item.id + '"]',
            this.parent.$popup
          ).click();
        }
      }
    } else {
      this.parent.state.membersId = '';
    }

    $g2t.show();
  }

  clearBoard() {
    const $g2t = $('#g2tBoard', this.parent.$popup);
    $g2t.html(''); // Clear it.

    $g2t.append($('<option value="">Select a board....</option>'));

    $g2t.change();
  }

  clearLabels() {
    this.parent.state.labelsId = '';
    this.updateLabels();
    this.validateData();
  }

  clearMembers() {
    this.parent.state.membersId = '';
    this.updateMembers();
    this.validateData();
  }

  toggleCheckboxes(tag) {
    const $checkboxes = $(tag, this.parent.$popup);
    const allChecked = $checkboxes.length > 0 && $checkboxes.filter(':checked').length === $checkboxes.length;
    
    $checkboxes.prop('checked', !allChecked);
  }

  // Form Display
  showMessage(parent, text) {
    const $parent = $(parent, this.parent.$popup);
    const $message = $('<div class="g2t-message">' + text + '</div>');
    
    $parent.append($message);
    $message.fadeIn();
  }

  hideMessage() {
    $('.g2t-message', this.parent.$popup).fadeOut().remove();
  }

  displaySubmitCompleteForm(params) {
    const $form = $('#g2tForm', this.parent.$popup);
    const $success = $('<div class="g2t-success">Card created successfully!</div>');
    
    $form.hide();
    $form.after($success);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      $success.fadeOut(() => {
        $success.remove();
        $form.show();
        this.reset();
      });
    }, 3000);
  }

  displayAPIFailedForm(response) {
    const $form = $('#g2tForm', this.parent.$popup);
    const errorMessage = response.error || 'API request failed';
    const $error = $('<div class="g2t-error">' + errorMessage + '</div>');
    
    $form.hide();
    $form.after($error);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      $error.fadeOut(() => {
        $error.remove();
        $form.show();
      });
    }, 5000);
  }

  // Form Components
  comboBox(update) {
    const $jVals = { Board: '', Card: '', List: '' };
    const setJQueryVals = () => {
      g2t_each($jVals, (value, key) => {
        $jVals[key] = $(`#g2t${key}`, this.parent.$popup);
      });
    };
    const set_max_autocomplete_size = () => {
      const max_k = window.innerHeight;
      const $board_k = $jVals.Board;
      const popup_offset_k = this.parent.$popup.offset();
      const popup_top_k = popup_offset_k.top;
      const board_height_k = $board_k.outerHeight();
      const calc_k =
        max_k -
        popup_top_k -
        board_height_k -
        90;
      const val_k = calc_k > this.parent.size_k.text.min ? calc_k : '60%';
      $('.ui-autocomplete').css('max-height', val_k);
    };
    if (!update) {
      setTimeout(() => {
        this.parent.comboInitialized = true;
        setJQueryVals();
        g2t_each($jVals, ($value, key) => {
          $value.combobox();
        });
        set_max_autocomplete_size();
      }, 1000);
    } else if (this.parent.comboInitialized) {
      setJQueryVals();
      g2t_each($jVals, ($value, key) => {
        $value.combobox(
          'setInputValue',
          $value.children('option:selected').text()
        );
      });
      set_max_autocomplete_size();
    }
  }

  mime_html(tag, isImage, data) {
    if (!data || !data.name) return '';

    const attachmentHtml = `
      <div class="g2t-attachment" data-name="${data.name}" data-type="${data.type}" data-size="${data.size}" data-content="${data.content}">
        <span class="attachment-name">${data.name}</span>
        <span class="attachment-size">${this.formatFileSize(data.size)}</span>
      </div>
    `;

    return attachmentHtml;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Form Actions
  submit() {
    if (this.parent.$popupContent) {
      this.parent.$popupContent.hide();
    }
    this.parent.showMessage(this.parent, 'Submitting to Trello...');
    this.app.events.fire('onSubmit');
  }

  // Form Event Handlers
  handleBoardChanged(target, params) {
    const boardId = $(target).val();
    if (boardId) {
      this.parent.state.boardId = boardId;
      this.app.events.fire('boardChanged', { boardId });
    }
  }

  handleListChanged(target, params) {
    const listId = $(target).val();
    if (listId) {
      this.parent.state.listId = listId;
      this.app.events.fire('listChanged', { listId });
    }
  }

  handleSubmit() {
    this.parent.app.model.submit(this.parent.state);
  }

  handleCheckTrelloAuthorized() {
    this.parent.showMessage(this.parent.app, 'Authorizing...');
    this.parent.app.model.checkTrelloAuthorized();
  }

  handleRequestDeauthorizeTrello() {
    g2t_log('onRequestDeauthorizeTrello');
    this.parent.app.model.deauthorizeTrello();
    this.clearBoard();
  }

  handleLoadTrelloListSuccess() {
    this.parent.updateLists_deprecated();
    this.validateData();
  }

  handleLoadTrelloCardsSuccess() {
    this.parent.updateCards_deprecated();
    this.validateData();
  }

  handleLoadTrelloLabelsSuccess() {
    this.parent.updateLabels_deprecated();
    this.validateData();
  }

  handleLoadTrelloMembersSuccess() {
    this.parent.updateMembers_deprecated();
    this.validateData();
  }

  handleAPIFailure(target, params) {
    this.displayAPIFailedForm(params);
  }

  handleNewCardUploadsComplete(target, params) {
    this.displaySubmitCompleteForm(params);
  }

  handleOnMenuClick(target, params) {
    // Handle menu clicks - delegate to parent if needed
    this.app.events.fire('menuClick', { target, params });
  }
}

// Export the class
G2T.PopupViewForm = PopupViewForm;