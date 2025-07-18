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
    if (!data) return;

    this.parent.state = { ...this.parent.state, ...data };

    // Update form fields
    if (data.boardId) {
      $(`#g2tBoard option[value="${data.boardId}"]`, this.parent.$popup).prop('selected', true);
    }

    if (data.listId) {
      $(`#g2tList option[value="${data.listId}"]`, this.parent.$popup).prop('selected', true);
    }

    if (data.cardName) {
      $('#g2tCardName', this.parent.$popup).val(data.cardName);
    }

    if (data.cardDesc) {
      $('#g2tCardDesc', this.parent.$popup).val(data.cardDesc);
    }

    if (data.labels && Array.isArray(data.labels)) {
      data.labels.forEach(labelId => {
        $(`#g2tLabel${labelId}`, this.parent.$popup).prop('checked', true);
      });
    }

    if (data.members && Array.isArray(data.members)) {
      data.members.forEach(memberId => {
        $(`#g2tMember${memberId}`, this.parent.$popup).prop('checked', true);
      });
    }
  }

  bindGmailData(data = {}) {
    if (!data) return;

    // Extract Gmail data and bind to form
    const gmailData = {
      cardName: data.subject || '',
      cardDesc: data.body || '',
      // Add other Gmail-specific data as needed
    };

    this.bindData(gmailData);
  }

  updateBody(data = {}) {
    if (!data || !data.body) return;

    const $body = $('#g2tCardDesc', this.parent.$popup);
    const currentBody = $body.val();
    
    if (currentBody && currentBody.trim() !== '') {
      // Append to existing body
      $body.val(currentBody + '\n\n' + data.body);
    } else {
      // Set new body
      $body.val(data.body);
    }
  }

  mime_array(tag) {
    const attachments = [];
    const $attachments = $(tag, this.parent.$popup);
    
    $attachments.each((index, element) => {
      const $element = $(element);
      const attachment = {
        name: $element.attr('data-name') || '',
        type: $element.attr('data-type') || '',
        size: $element.attr('data-size') || 0,
        data: $element.attr('data-content') || ''
      };
      attachments.push(attachment);
    });

    return attachments;
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
    const lists = this.parent.state.lists || [];
    const $listSelect = $('#g2tList', this.parent.$popup);
    
    $listSelect.empty();
    $listSelect.append('<option value="">Select a list...</option>');
    
    lists.forEach(list => {
      $listSelect.append(`<option value="${list.id}">${list.name}</option>`);
    });

    if (tempId > 0) {
      $listSelect.val(tempId);
    }
  }

  updateCards(tempId = 0) {
    const cards = this.parent.state.cards || [];
    const $cardSelect = $('#g2tCard', this.parent.$popup);
    
    $cardSelect.empty();
    $cardSelect.append('<option value="">Select a card...</option>');
    
    cards.forEach(card => {
      $cardSelect.append(`<option value="${card.id}">${card.name}</option>`);
    });

    if (tempId > 0) {
      $cardSelect.val(tempId);
    }
  }

  updateLabels() {
    const labels = this.parent.state.labels || [];
    const $labelContainer = $('#g2tLabels', this.parent.$popup);
    
    $labelContainer.empty();
    
    labels.forEach(label => {
      const labelHtml = `
        <div class="label-item">
          <input type="checkbox" id="g2tLabel${label.id}" value="${label.id}" />
          <label for="g2tLabel${label.id}" style="background-color: ${label.color}">
            ${label.name}
          </label>
        </div>
      `;
      $labelContainer.append(labelHtml);
    });
  }

  updateMembers() {
    const members = this.parent.state.members || [];
    const $memberContainer = $('#g2tMembers', this.parent.$popup);
    
    $memberContainer.empty();
    
    members.forEach(member => {
      const memberHtml = `
        <div class="member-item">
          <input type="checkbox" id="g2tMember${member.id}" value="${member.id}" />
          <label for="g2tMember${member.id}">
            <img src="${member.avatarUrl}" alt="${member.fullName}" />
            ${member.fullName}
          </label>
        </div>
      `;
      $memberContainer.append(memberHtml);
    });
  }

  clearBoard() {
    $('#g2tBoard', this.parent.$popup).val('');
    this.clearLists();
    this.clearCards();
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
    const errors = this.validateData();
    if (errors.length > 0) {
      this.showMessage('#g2tForm', errors.join('<br>'));
      return false;
    }

    // Collect form data
    const formData = {
      boardId: $('#g2tBoard', this.parent.$popup).val(),
      listId: $('#g2tList', this.parent.$popup).val(),
      cardName: $('#g2tCardName', this.parent.$popup).val(),
      cardDesc: $('#g2tCardDesc', this.parent.$popup).val(),
      labels: $('input[name="labels"]:checked', this.parent.$popup).map(function() {
        return this.value;
      }).get(),
      members: $('input[name="members"]:checked', this.parent.$popup).map(function() {
        return this.value;
      }).get()
    };

    // Fire submit event
    this.app.events.fire('formSubmit', formData);
    return true;
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