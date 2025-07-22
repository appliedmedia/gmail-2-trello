var G2T = G2T || {}; // must be var to guarantee correct scope

// Uploader class for handling attachment uploads
class Uploader {
  constructor(args) {
    if (!args?.parent || !args?.app) {
      return;
    }

    Object.assign(this, args);
    this.itemsForUpload = [];
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Uploader-specific event bindings (if any)
  }

  get attachments() {
    return 'attachments';
  }

  add(args) {
    if (
      args &&
      Object.keys(args).every(key => {
        const val = args[key];
        return (
          val != null &&
          (typeof val === 'number' ||
            typeof val === 'boolean' ||
            val.length > 0)
        );
      })
    ) {
      // Add attachment to upload queue
      args.property = `cards/${this.cardId}/${args.property}`;
      this.itemsForUpload.push(args);
    }
    return this;
  }

  attach(method, property, upload1, success, failure) {
    const self = this;

    if (
      !property ||
      property.length < 6 ||
      !upload1 ||
      !upload1.value ||
      upload1.value.length < 6
    )
      return;

    const UPLOAD_ATTACH = 'g2t_upload_attach';
    const UPLOAD_ATTACH_RESULTS = 'g2t_upload_attach_results';
    const trello_url_k = 'https://api.trello.com/1/';
    const param_k = upload1.value;

    // NOTE (Ace, 2020-02-15): We have a funny problem with embedded images so breaking this up:
    // Was: const filename_k = (param_k.split('/').pop().split('#')[0].split('?')[0]) || upload1.name || param_k || 'unknown_filename'; // Removes # or ? after filename
    // Remove # or ? afer filename. Could do this as a regex, but this is a bit faster and more resiliant:
    const slash_split_k = param_k.split('/'); // First split by directory slashes
    const end_slash_split_k = slash_split_k[slash_split_k.length - 1]; // Take last slash section
    const hash_split_k = end_slash_split_k.split('#'); // Split by hash so we can split it off
    const begin_hash_split_k = hash_split_k[0]; // Take first hash
    const question_split_k = begin_hash_split_k.split('?'); // Now split by question mark to remove variables
    const begin_question_split_k = question_split_k[0]; // Take content ahead of question mark
    const filename_k =
      begin_question_split_k || upload1.name || param_k || 'unknown_filename'; // Use found string or reasonable fallbacks

    const callback = function (args) {
      if (args?.[UPLOAD_ATTACH_RESULTS] === 'success') {
        success(args);
      } else {
        failure(args);
      }
    };

    let dict = {};
    dict[UPLOAD_ATTACH] = {
      url_asset: upload1.value,
      filename: filename_k,
      trello_key: Trello.key(),
      trello_token: Trello.token(),
      url_upload: `${trello_url_k}${property}`,
    };

    this.app.chrome.runtimeSendMessage(dict, callback);
  }

  upload(data) {
    const self = this;
    const generateKeysAndValues = function (object) {
      let keysAndValues = [];
      g2t_each(object, function (value, key) {
        keysAndValues.push(
          `${key}=${value || ''} (${(value || '').toString().length})`
        );
      });
      return keysAndValues.sort().join(' ');
    };
    let upload1 = self.itemsForUpload.shift();
    if (!upload1) {
      // All attachment uploads complete
      self.app.events.fire('newCardUploadsComplete', { data });
    } else {
      const dict_k = { cardId: this.cardId || '' };

      let method = upload1.method || 'post';
      let property = this.app.utils.replacer(upload1.property, dict_k);
      upload1.method = undefined;
      upload1.property = undefined;

      const fn_k = property.endsWith(self.attachments)
        ? self.attach
        : Trello.rest;

      fn_k(
        method,
        property,
        upload1,
        function success(data) {
          Object.assign(data, {
            method: `${method} ${property}`,
            keys: generateKeysAndValues(upload1),
            emailId: self.emailId,
          });
          if (self.itemsForUpload?.length > 0) {
            self.upload();
          }
        },
        function failure(data) {
          Object.assign(data, {
            method: `${method} ${property}`,
            keys: generateKeysAndValues(upload1),
            emailId: self.emailId,
          });
          self.app.events.fire('onAPIFailure', { data });
        }
      );
    }
  }
}

// EmailBoardListCardMap class
class EmailBoardListCardMap {
  static get ck() {
    // class keys here to assure they're treated like consts
    const ck = {
      id: 'g2t_emailboardlistcardmap',
    };
    return ck;
  }

  get ck() {
    return EmailBoardListCardMap.ck;
  }

  constructor(args) {
    this.parent = args.parent;
    this.app = args.app;
    this._state = [];
    this.maxSize = 100;
    this.chrome_storage_key = 'gmail2trello_eblc_map';
  }

  get state() {
    return this._state;
  }

  set state(newState) {
    this._state = newState;
  }

  loadState() {
    this.app.utils.loadFromChromeStorage(
      this.ck.id,
      'classEmailBoardListCardMapStateLoaded'
    );
  }

  saveState() {
    this.app.utils.saveToChromeStorage(this.ck.id, this.state);
  }

  add(args = {}) {
    const entry = {
      email: args.email || '',
      boardId: args.boardId || 0,
      listId: args.listId || 0,
      cardId: args.cardId || 0,
      timestamp: Date.now(),
    };

    this.push(entry);
  }

  find(key_value = {}) {
    return this.state.find(entry => {
      return Object.keys(key_value).every(key => entry[key] === key_value[key]);
    });
  }

  lookup(key_value = {}) {
    const entry = this.find(key_value);
    return entry || null;
  }

  makeRoom(index = -1) {
    if (this.state.length >= this.maxSize) {
      if (index === -1) {
        this.state.shift(); // Remove oldest
      } else {
        this.state.splice(index, 1); // Remove specific index
      }
    }
  }

  max() {
    return this.maxSize;
  }

  maxxed() {
    return this.state.length >= this.maxSize;
  }

  oldest() {
    if (this.state.length === 0) return null;

    let oldestEntry = this.state[0];
    let oldestTime = oldestEntry.timestamp;

    for (let i = 1; i < this.state.length; i++) {
      if (this.state[i].timestamp < oldestTime) {
        oldestTime = this.state[i].timestamp;
        oldestEntry = this.state[i];
      }
    }

    return oldestEntry;
  }

  push(entry = {}) {
    this.makeRoom();
    this.state.push(entry);
    this.saveState();
  }

  remove(index = -1) {
    if (index === -1) {
      this.state.pop();
    } else {
      this.state.splice(index, 1);
    }
    this.saveState();
  }
}

class Model {
  static get ck() {
    // class keys here to assure they're treated like consts
    const ck = {
      id: 'g2t_model',
    };
    return ck;
  }

  get ck() {
    return Model.ck;
  }

  constructor(args) {
    this.parent = args.parent;
    this.app = args.app;
    this._state = {
      trelloAuthorized: false,
      trelloData: {},
      emailBoardListCardMap: new EmailBoardListCardMap({
        parent: this,
        app: this.app,
      }),
    };
  }

  get state() {
    return this._state;
  }

  set state(newState) {
    this._state = newState;
  }

  loadState() {
    this.app.utils.loadFromChromeStorage(this.ck.id, 'classModelStateLoaded');
  }

  saveState() {
    this.app.utils.saveToChromeStorage(this.ck.id, this.state);
  }

  init() {
    this.loadState();
    this.bindEvents();
    this.initTrello();
  }

  uploadAttachments(data = {}) {
    if (!data.attachments || data.attachments.length === 0) {
      this.app.events.fire('newCardUploadsComplete', { data });
      return;
    }

    const uploader = new Uploader({
      parent: this,
      app: this.app,
      cardId: data.cardId,
      emailId: data.emailId,
    });

    uploader.init();

    data.attachments.forEach(attachment => {
      uploader.add({
        method: 'post',
        property: 'attachments',
        value: attachment.url,
        name: attachment.name,
      });
    });

    uploader.upload(data);
  }

  checkTrelloAuthorized_success(data) {
    this.state.trelloAuthorized = true;
    this.app.events.fire('trelloAuthorized', { data });
  }

  checkTrelloAuthorized_failure(data) {
    this.state.trelloAuthorized = false;
    this.app.events.fire('trelloUnauthorized', { data });
  }

  checkTrelloAuthorized_popup_success(data) {
    this.state.trelloAuthorized = true;
    this.app.events.fire('trelloAuthorizedPopup', { data });
  }

  checkTrelloAuthorized_popup_failure(data) {
    this.state.trelloAuthorized = false;
    this.app.events.fire('trelloUnauthorizedPopup', { data });
  }

  initTrello() {
    Trello.setKey(this.app.trelloApiKey);
    this.checkTrelloAuthorized();
  }

  checkTrelloAuthorized() {
    Trello.rest(
      'get',
      'members/me',
      {},
      this.checkTrelloAuthorized_success.bind(this),
      this.checkTrelloAuthorized_failure.bind(this)
    );
  }

  deauthorizeTrello() {
    this.state.trelloAuthorized = false;
    this.state.trelloData = {};
    this.app.events.fire('trelloDeauthorized', {});
  }

  loadTrelloData_user_success(data) {
    this.state.trelloData.user = data;
    this.loadTrelloData_boards_success();
  }

  loadTrelloData_boards_success(data) {
    if (data) {
      this.state.trelloData.boards = data;
    }
    this.app.events.fire('trelloDataLoaded', { data: this.state.trelloData });
  }

  loadTrelloData_failure(data) {
    this.app.events.fire('trelloDataLoadFailed', { data });
  }

  loadTrelloData() {
    if (!this.state.trelloAuthorized) {
      return;
    }

    Trello.rest(
      'get',
      'members/me',
      {},
      this.loadTrelloData_user_success.bind(this),
      this.loadTrelloData_failure.bind(this)
    );

    Trello.rest(
      'get',
      'members/me/boards',
      {},
      this.loadTrelloData_boards_success.bind(this),
      this.loadTrelloData_failure.bind(this)
    );
  }

  checkTrelloDataReady() {
    return (
      this.state.trelloAuthorized &&
      this.state.trelloData.user &&
      this.state.trelloData.boards
    );
  }

  loadTrelloLists_success(data) {
    this.state.trelloData.lists = data;
    this.app.events.fire('loadTrelloListSuccess', { data });
  }

  loadTrelloLists_failure(data) {
    this.app.events.fire('loadTrelloListFailed', { data });
  }

  loadTrelloLists(boardId) {
    if (!this.state.trelloAuthorized) {
      return;
    }

    Trello.rest(
      'get',
      `boards/${boardId}/lists`,
      {},
      this.loadTrelloLists_success.bind(this),
      this.loadTrelloLists_failure.bind(this)
    );
  }

  loadTrelloCards_success(data) {
    this.state.trelloData.cards = data;
    this.app.events.fire('loadTrelloCardsSuccess', { data });
  }

  loadTrelloCards_failure(data) {
    this.app.events.fire('loadTrelloCardsFailed', { data });
  }

  loadTrelloCards(listId) {
    if (!this.state.trelloAuthorized) {
      return;
    }

    Trello.rest(
      'get',
      `lists/${listId}/cards`,
      {},
      this.loadTrelloCards_success.bind(this),
      this.loadTrelloCards_failure.bind(this)
    );
  }

  loadTrelloMembers_success(data) {
    this.state.trelloData.members = data;
    this.app.events.fire('loadTrelloMembersSuccess', { data });
  }

  loadTrelloMembers_failure(data) {
    this.app.events.fire('loadTrelloMembersFailed', { data });
  }

  loadTrelloMembers(boardId) {
    if (!this.state.trelloAuthorized) {
      return;
    }

    Trello.rest(
      'get',
      `boards/${boardId}/members`,
      {},
      this.loadTrelloMembers_success.bind(this),
      this.loadTrelloMembers_failure.bind(this)
    );
  }

  loadTrelloLabels_success(data) {
    this.state.trelloData.labels = data;
    this.app.events.fire('loadTrelloLabelsSuccess', { data });
  }

  loadTrelloLabels_failure(data) {
    this.app.events.fire('loadTrelloLabelsFailed', { data });
  }

  loadTrelloLabels(boardId) {
    if (!this.state.trelloAuthorized) {
      return;
    }

    Trello.rest(
      'get',
      `boards/${boardId}/labels`,
      {},
      this.loadTrelloLabels_success.bind(this),
      this.loadTrelloLabels_failure.bind(this)
    );
  }

  submit(data) {
    if (!this.state.trelloAuthorized) {
      this.app.events.fire('trelloUnauthorized', {});
      return;
    }

    if (!data || !data.boardId || !data.listId) {
      this.app.events.fire('invalidFormData', { data });
      return;
    }

    this.createCard(data);
  }

  createCard(data) {
    const cardData = {
      name: data.subject || 'No Subject',
      desc: data.body || '',
      idList: data.listId,
      idBoard: data.boardId,
      pos: 'top',
    };

    if (data.labels && data.labels.length > 0) {
      cardData.idLabels = data.labels;
    }

    if (data.members && data.members.length > 0) {
      cardData.idMembers = data.members;
    }

    if (data.dueDate) {
      cardData.due = data.dueDate;
    }

    Trello.rest(
      'post',
      'cards',
      cardData,
      response => {
        const cardId = response.id;

        // Add attachments if any
        if (data.attachments && data.attachments.length > 0) {
          data.cardId = cardId;
          this.uploadAttachments(data);
        } else {
          this.app.events.fire('trelloCardCreated', {
            data: { ...data, cardId },
          });
        }
      },
      error => {
        this.app.events.fire('trelloCardCreateFailed', { data: error });
      }
    );
  }

  emailBoardListCardMapLookup(key_value = {}) {
    return this.state.emailBoardListCardMap?.lookup(key_value) || null;
  }

  emailBoardListCardMapUpdate(key_value = {}) {
    return this.state.emailBoardListCardMap?.add(key_value) || null;
  }

  handleClassModelStateLoaded(event, params) {
    if (params) {
      // Only update specific state properties that were loaded
      if (params.trelloAuthorized !== undefined) {
        this.state.trelloAuthorized = params.trelloAuthorized;
      }
      if (params.trelloData) {
        this.state.trelloData = params.trelloData;
      }

      if (params.emailBoardListCardMap) {
        this.state.emailBoardListCardMap = params.emailBoardListCardMap;
      }
    }
  }

  handleSubmittedFormShownComplete(target, params) {
    const data = params.data;

    if (!data) {
      this.app.events.fire('invalidFormData', { data });
      return;
    }

    this.submit(data);
  }

  handleTrelloCardCreateSuccess(target, params) {
    const { data } = params;

    // Update the email-board-list-card mapping
    if (data.emailId && data.boardId && data.listId && data.cardId) {
      this.state.emailBoardListCardMap.add({
        email: data.emailId,
        boardId: data.boardId,
        listId: data.listId,
        cardId: data.cardId,
      });
    }

    this.app.events.fire('cardCreationComplete', { data });
  }

  handlePostCardCreateUploadDisplayDone(target, params) {
    this.app.events.fire('cardCreationComplete', { data: params.data });
  }

  // Form event handlers - moved from PopupView
  handleBoardChanged(target, params) {
    const boardId = params.boardId;
    if (boardId !== '_' && boardId !== '' && boardId !== null) {
      this.loadTrelloLists(boardId);
      this.loadTrelloLabels(boardId);
      this.loadTrelloMembers(boardId);
    }
  }

  handleListChanged(target, params) {
    const listId = params.listId;
    this.loadTrelloCards(listId);
  }

  bindEvents() {
    this.app.events.addListener(
      'classModelStateLoaded',
      this.handleClassModelStateLoaded.bind(this)
    );
    this.app.events.addListener(
      'submittedFormShownComplete',
      this.handleSubmittedFormShownComplete.bind(this)
    );
    this.app.events.addListener(
      'trelloCardCreateSuccess',
      this.handleTrelloCardCreateSuccess.bind(this)
    );
    this.app.events.addListener(
      'postCardCreateUploadDisplayDone',
      this.handlePostCardCreateUploadDisplayDone.bind(this)
    );

    // Listen to board and list change events
    this.app.events.addListener(
      'boardChanged',
      this.handleBoardChanged.bind(this)
    );
    this.app.events.addListener(
      'listChanged',
      this.handleListChanged.bind(this)
    );
  }
}

// Assign classes to namespace
G2T.Model = Model;
G2T.Model.EmailBoardListCardMap = EmailBoardListCardMap;

// End, class_model.js
