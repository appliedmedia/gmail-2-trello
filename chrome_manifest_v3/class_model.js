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

    try {
      chrome.runtime.sendMessage(dict, callback);
    } catch (error) {
      g2t_log(
        `sendMessage ERROR: extension context invalidated - failed "chrome.runtime.sendMessage"`
      );
      self?.parent?.popupView?.displayExtensionInvalidReload();
    }
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
  constructor(args) {
    this.parent = args.parent;
    this.data = [];
    this.maxSize = 100;
    this.chrome_storage_key = 'gmail2trello_eblc_map';
  }

  static get id() {
    return 'emailBoardListCardMap';
  }

  get id() {
    return EmailBoardListCardMap.id;
  }

  add(args = {}) {
    const entry = {
      email: args.email || '',
      boardId: args.boardId || '',
      listId: args.listId || '',
      cardId: args.cardId || '',
      timestamp: Date.now(),
    };

    this.push(entry);
    return entry;
  }

  chrome_restore_onSuccess(result) {
    if (result[this.chrome_storage_key]) {
      this.data = result[this.chrome_storage_key];
      g2t_log('EmailBoardListCardMap: restored from chrome storage');
    }
  }

  chrome_save_onSuccess() {
    g2t_log('EmailBoardListCardMap: saved to chrome storage');
  }

  chrome_restore() {
    chrome.storage.local.get(
      [this.chrome_storage_key],
      this.chrome_restore_onSuccess.bind(this)
    );
  }

  chrome_save() {
    chrome.storage.local.set(
      { [this.chrome_storage_key]: this.data },
      this.chrome_save_onSuccess.bind(this)
    );
  }

  find(key_value = {}) {
    return this.data.find(entry => {
      return Object.keys(key_value).every(key => entry[key] === key_value[key]);
    });
  }

  lookup(key_value = {}) {
    const entry = this.find(key_value);
    return entry || null;
  }

  makeRoom(index = -1) {
    if (this.data.length >= this.maxSize) {
      if (index === -1) {
        this.data.shift(); // Remove oldest
      } else {
        this.data.splice(index, 1); // Remove specific index
      }
    }
  }

  max() {
    return this.maxSize;
  }

  maxxed() {
    return this.data.length >= this.maxSize;
  }

  oldest() {
    if (this.data.length === 0) return null;

    let oldestEntry = this.data[0];
    let oldestTime = oldestEntry.timestamp;

    for (let i = 1; i < this.data.length; i++) {
      if (this.data[i].timestamp < oldestTime) {
        oldestTime = this.data[i].timestamp;
        oldestEntry = this.data[i];
      }
    }

    return oldestEntry;
  }

  push(entry = {}) {
    this.makeRoom();
    this.data.push(entry);
    this.chrome_save();
  }

  remove(index = -1) {
    if (index === -1) {
      this.data.pop();
    } else {
      this.data.splice(index, 1);
    }
    this.chrome_save();
  }
}

class Model {
  constructor(args) {
    this.trello = {
      apiKey: '21b411b1b5b549c54bd32f0e90738b41', // Was: "c50413b23ee49ca49a5c75ccf32d0459"
      user: null,
      boards: null,
    };
    this.app = args.app;
    this.settings = {};
    this.isInitialized = false;
    this.newCard = null;
    this.userEmail = null; // Set this when user data loads
  }

  init() {
    const eblcMapID = G2T.Model.EmailBoardListCardMap.id;

    this[eblcMapID] = new G2T.Model.EmailBoardListCardMap({
      parent: this,
    });

    // Initialize Uploader
    this.uploader = new Uploader({
      parent: this,
      app: this.app,
    });
    this.uploader.init();

    this.isInitialized = true;

    // Bind internal events (if any)
    this.bindEvents();

    // init Trello
    this.initTrello();
  }

  uploadAttachments(data = {}) {
    // Extract attachments from data
    const cardId = data.cardId || 0;
    const itemsToUpload = (data.images || [])
      .concat(data.attachments || [])
      .filter(item => item?.checked && item.url?.length > 5);

    if (!itemsToUpload.length || !cardId) {
      // No attachments to upload, fire uploads complete immediately
      this.app.events.fire('newCardUploadsComplete', { data });
      return;
    }

    // Configure uploader for this attachment session
    this.uploader.cardId = cardId;
    this.uploader.position = 'at'; // Add to existing card
    this.uploader.cardPos = 0;
    this.uploader.emailId = data.emailId || 0;
    this.uploader.itemsForUpload = []; // Clear previous data

    // Add each attachment
    g2t_each(
      itemsToUpload,
      function (item) {
        this.uploader.add({
          property: this.uploader.attachments,
          value: item.url,
          name: item.name,
        });
      }.bind(this)
    );

    this.uploader.upload(data);
  }

  // Callback methods for checkTrelloAuthorized
  checkTrelloAuthorized_onSuccess(data) {
    this.app.events.fire('onAuthorized');
    this.loadTrelloData();
  }

  checkTrelloAuthorized_onError(data) {
    if (!Trello.authorized()) {
      // Assure token is invalid
      this.app.events.fire('onBeforeAuthorize');
      Trello.authorize({
        type: 'popup',
        name: 'Gmail-2-Trello',
        interactive: true,
        persit: true,
        scope: { read: true, write: true },
        expiration: 'never',
        success: this.checkTrelloAuthorized_popup_onSuccess.bind(this),
        error: this.checkTrelloAuthorized_popup_onError.bind(this),
      });
    } else {
      g2t_log('Model:checkTrelloAuthorized: failed');
      // We have a valid token, so...how did we get here?
      // this.event.dispatchEvent(new CustomEvent('onAuthorized'));
      // this.loadTrelloData();
      // g2t_log(Trello);
      // g2t_log(Trello.token());
    }
  }

  checkTrelloAuthorized_popup_onSuccess(data) {
    g2t_log('checkTrelloAuthorized: Trello authorization successful');
    // g2t_log(data);
    this.app.events.fire('onAuthorized');
    this.loadTrelloData();
  }

  checkTrelloAuthorized_popup_onError(data) {
    this.app.events.fire('onAuthorizeFail');
  }

  initTrello() {
    // g2t_log("Model:initTrello");

    this.trello.user = null;
    this.trello.boards = null;

    Trello.setKey(this.trello.apiKey);
    this.checkTrelloAuthorized();
  }

  checkTrelloAuthorized() {
    // g2t_log("checkTrelloAuthorized");

    // Assures there's a token or not:
    Trello.authorize({
      interactive: false,
      success: this.checkTrelloAuthorized_onSuccess.bind(this),
      error: this.checkTrelloAuthorized_onError.bind(this),
    });
  }

  deauthorizeTrello() {
    g2t_log('deauthorizeTrello');

    Trello.deauthorize();
    this.isInitialized = false;
  }

  loadTrelloData_success_user(data) {
    if (!data?.id) {
      return false;
    }

    this.trello.user = data;
    this.userEmail = data.email || '';

    // g2t_log('loadTrelloData: User boards');
    this.trello.boards = null;
    Trello.get(
      'members/me/boards',
      {
        organization: 'true',
        organization_fields: 'displayName',
        filter: 'open',
        fields: 'name' /* "name,closed" */,
      },
      this.loadTrelloData_success_boards.bind(this),
      this.loadTrelloData_failure.bind(this)
    );
    this.checkTrelloDataReady();
  }

  loadTrelloData_success_boards(data) {
    let validData = Array();
    for (let i = 0; i < data.length; i++) {
      // if (data[i].idOrganization === null)
      //   data[i].idOrganization = '-1';

      // Only accept opening boards
      if (i == 0) {
        // g2t_log(JSON.stringify(data[i]));
      }
      if (data[i].closed != true) {
        validData.push(data[i]);
      }
    }
    // g2t_log('loadTrelloData: Boards data');
    // g2t_log(JSON.stringify(data));
    // g2t_log(JSON.stringify(validData));
    this.trello.boards = validData;
    this.checkTrelloDataReady();
  }

  loadTrelloData_failure(data) {
    this.app.events.fire('onAPIFailure', { data });
  }

  loadTrelloData() {
    // g2t_log('loadTrelloData');

    this.app.events.fire('onBeforeLoadTrello');
    this.trello.user = null;

    // get user's info
    // g2t_log('loadTrelloData: User info');
    Trello.get(
      'members/me',
      {},
      this.loadTrelloData_success_user.bind(this),
      this.loadTrelloData_failure.bind(this)
    );
  }

  checkTrelloDataReady() {
    if (this.trello.user !== null && this.trello.boards !== null) {
      // yeah! the data is ready
      //g2t_log('checkTrelloDataReady: YES');
      //g2t_log(this);
      this.app.events.fire('onTrelloDataReady');
    }
    //else g2t_log('checkTrelloDataReady: NO');
  }

  loadTrelloLists_success(data) {
    this.trello.lists = data.lists;
    // g2t_log('loadTrelloLists: lists:' + JSON.stringify(this.trello.lists));
    this.app.events.fire('onLoadTrelloListSuccess');
  }

  loadTrelloLists_failure(data) {
    this.app.events.fire('onAPIFailure', { data });
  }

  loadTrelloLists(boardId) {
    // g2t_log('loadTrelloLists');

    this.trello.lists = null;

    Trello.get(
      `boards/${boardId}`,
      { lists: 'open', list_fields: 'name' },
      this.loadTrelloLists_success.bind(this),
      this.loadTrelloLists_failure.bind(this)
    );
  }

  loadTrelloCards_success(data) {
    this.trello.cards = data;
    // g2t_log('loadTrelloCards: cards:' + JSON.stringify(this.trello.cards));
    this.app.events.fire('onLoadTrelloCardsSuccess');
  }

  loadTrelloCards_failure(data) {
    this.app.events.fire('onAPIFailure', { data });
  }

  loadTrelloCards(listId) {
    // g2t_log('loadTrelloCards');

    this.trello.cards = null;

    Trello.get(
      `lists/${listId}/cards`,
      { fields: 'name,desc,due,idMembers' },
      this.loadTrelloCards_success.bind(this),
      this.loadTrelloCards_failure.bind(this)
    );
  }

  loadTrelloMembers_success(data) {
    this.trello.members = data;
    // g2t_log('loadTrelloMembers: members:' + JSON.stringify(this.trello.members));
    this.app.events.fire('onLoadTrelloMemberSuccess');
  }

  loadTrelloMembers_failure(data) {
    this.app.events.fire('onAPIFailure', { data });
  }

  loadTrelloMembers(boardId) {
    // g2t_log('loadTrelloMembers');

    this.trello.members = null;

    Trello.get(
      `boards/${boardId}/members`,
      { fields: 'fullName,username,avatarUrl' },
      this.loadTrelloMembers_success.bind(this),
      this.loadTrelloMembers_failure.bind(this)
    );
  }

  loadTrelloLabels_success(data) {
    this.trello.labels = data;
    // g2t_log('loadTrelloLabels: labels:' + JSON.stringify(this.trello.labels));
    this.app.events.fire('onLoadTrelloLabelsSuccess');
  }

  loadTrelloLabels_failure(data) {
    this.app.events.fire('onAPIFailure', { data });
  }

  loadTrelloLabels(boardId) {
    // g2t_log('loadTrelloLabels');

    this.trello.labels = null;

    Trello.get(
      `boards/${boardId}/labels`,
      { fields: 'color,name' },
      this.loadTrelloLabels_success.bind(this),
      this.loadTrelloLabels_failure.bind(this)
    );
  }

  submit(data) {
    if (!data) {
      g2t_log('Submit data is empty');
      return false;
    }

    if (data.useBacklink) {
      const email = this.userEmail.replace('@', '\\@');
      const txtDirect =
        '[' +
        email +
        '](' +
        document.location.href +
        ' "Direct link to creator\'s email, not accessible from anyone else")';

      const subject = encodeURIComponent(data.title);

      //parse date
      g2t_log('parsing time');
      g2t_log(data.timeStamp);
      let dateSearch = data.timeStamp
        ? data.timeStamp.replace('at', '').trim()
        : null;
      dateSearch = dateSearch ? Date.parse(dateSearch) : null;
      dateSearch = dateSearch ? dateSearch.toString('MMM d, yyyy') : null;
      g2t_log(dateSearch);

      let txtSearch = '';
      if (dateSearch) {
        data.date = dateSearch;
        dateSearch = encodeURIComponent(dateSearch);
        txtSearch +=
          '[Search](https://mail.google.com/mail/#advanced-search/subset=all&has=' +
          subject +
          '&within=1d&date=' +
          dateSearch +
          ' "Advance search by email subject and time")';
      } else
        txtSearch +=
          '[Search](https://mail.google.com/mail/#search/' +
          subject +
          ' "Search by email subject")';

      data.description +=
        '\n\n---\nImported from Gmail: ' + txtDirect + ' | ' + txtSearch;
    }

    //save settings
    localStorage['userSettings'] = JSON.stringify({
      orgId: data.orgId,
      boardId: data.boardId,
      listId: data.listId,
      useBacklink: data.useBacklink,
    });

    // Create card first (without attachments)
    this.createCard(data);
  }

  createCard(data) {
    let text = data.title || '';
    if (text.length > 0) {
      if (data.markdown) {
        text = `**${text}**\n\n`;
      }
    }
    text += data.description;

    text = this.app.utils.truncate(
      text,
      this.app.popupView.MAX_BODY_SIZE,
      '...'
    );

    let desc = this.app.utils.truncate(
      data.description,
      this.app.popupView.MAX_BODY_SIZE,
      '...'
    );

    let due_text = '';

    if (data.dueDate?.length > 1) {
      // Will 400 if not valid date:
      /* Workaround for quirk in Date object,
       * See: http://stackoverflow.com/questions/28234572/html5-datetime-local-chrome-how-to-input-datetime-in-current-time-zone
       * Was: dueDate.replace('T', ' ').replace('-','/')
       */
      let due = data.dueDate.replace('-', '/');

      if (data.dueTime?.length > 1) {
        due += ` ${data.dueTime}`;
      } else {
        due += ' 00:00'; // Must provide time
      }
      due_text = new Date(due).toISOString();
      /* (NOTE (Ace, 27-Feb-2017): When we used datetime-local object, this was:
            trelloPostableData.due = (new Date(data.dueDate.replace('T', ' ').replace('-','/'))).toISOString();
            */
    }

    // Build card data for Trello API
    let cardData = {
      name: data.title,
      desc: desc,
      idList: data.listId,
    };

    // Add optional fields
    if (due_text) {
      cardData.due = due_text;
    }

    if (data.membersId) {
      let members = data.membersId
        .split(',')
        .filter(id => !data.cardMembers || data.cardMembers.indexOf(id) === -1);
      if (members.length > 0) {
        cardData.idMembers = members.join(',');
      }
    }

    if (data.labelsId) {
      let labels = data.labelsId
        .split(',')
        .filter(id => !data.cardLabels || data.cardLabels.indexOf(id) === -1);
      if (labels.length > 0) {
        cardData.idLabels = labels.join(',');
      }
    }

    // Create card using Trello API directly
    Trello.post(
      'cards',
      cardData,
      response => {
        // Card creation successful
        if (response?.id) {
          // Extract card ID and shortLink from Trello response
          data.cardId = response.id;
          data.shortLink = response.shortLink;
          this.app.events.fire('trelloCardCreateSuccess', { data });
        } else {
          // Card couldn't be created - no ID returned
          this.app.events.fire('onAPIFailure', {
            data: { error: 'Card creation failed - no ID returned' },
          });
        }
      },
      error => {
        // Card creation failed
        this.app.events.fire('onAPIFailure', { data: error });
      }
    );
  }

  retrieveSettings() {
    const settingsJson = localStorage['userSettings'];

    if (!settingsJson) {
      return {};
    }

    return JSON.parse(settingsJson);
  }

  saveSettings(settings) {
    localStorage['userSettings'] = JSON.stringify(settings);
  }

  emailBoardListCardMapLookup(key_value = {}) {
    const mapInstance = this[G2T.Model.EmailBoardListCardMap.id];
    return mapInstance ? mapInstance.lookup(key_value) : null;
  }

  emailBoardListCardMapUpdate(key_value = {}) {
    const mapInstance = this[G2T.Model.EmailBoardListCardMap.id];
    return mapInstance ? mapInstance.add(key_value) : null;
  }

  bindEvents() {
    // Model-specific event bindings (if any)
    // Most models don't need to bind to their own events
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
  }

  // Cross-component event handler
  handleSubmittedFormShownComplete(target, params) {
    // If card lists or labels have been updated, reload:
    const data_k = params?.data || {};
    const emailId = data_k.emailId || 0;
    const boardId = data_k.boardId || 0;
    const listId = data_k.listId || 0;
    const cardId = data_k.cardId || 0;

    // Extract card ID from the response data
    const responseCardId = data_k.cardId || cardId;

    // NOTE (acoven@2020-05-23): Users expect when creating a brand new card,
    // we'll remember that new card ID and then keep defaulting to it for
    // subsequent updates to that email. That means we'll have to get the return
    // value/url from Trello and dissect that, potentially doing this update
    // in that routine:
    this.emailBoardListCardMapUpdate({
      emailId,
      boardId,
      listId,
      cardId: responseCardId,
    });

    if (boardId) {
      this.loadTrelloLabels(boardId);
      this.loadTrelloMembers(boardId);
    }
    if (listId) {
      this.loadTrelloCards(listId);
    }
  }

  handleTrelloCardCreateSuccess(target, params) {
    // Card creation completed successfully - upload attachments
    let data = params?.data || {};
    this.uploadAttachments(data);
  }

  handlePostCardCreateUploadDisplayDone(target, params) {
    // Final data manipulations after card creation, uploads, and display
    const data_k = params?.data || {};
    const emailId = data_k.emailId || 0;
    const boardId = data_k.boardId || 0;
    const listId = data_k.listId || 0;
    const cardId = data_k.cardId || 0;

    // Extract card ID from the response data
    const responseCardId = data_k.cardId || cardId;

    // NOTE (acoven@2020-05-23): Users expect when creating a brand new card,
    // we'll remember that new card ID and then keep defaulting to it for
    // subsequent updates to that email. That means we'll have to get the return
    // value/url from Trello and dissect that, potentially doing this update
    // in that routine:
    this.emailBoardListCardMapUpdate({
      emailId,
      boardId,
      listId,
      cardId: responseCardId,
    });

    if (boardId) {
      this.loadTrelloLabels(boardId);
      this.loadTrelloMembers(boardId);
    }
    if (listId) {
      this.loadTrelloCards(listId);
    }
  }
}

// Assign classes to namespace
G2T.Model = Model;
G2T.Model.EmailBoardListCardMap = EmailBoardListCardMap;

// End, class_model.js
