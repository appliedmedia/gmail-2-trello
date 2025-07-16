var G2T = G2T || {}; // must be var to guarantee correct scope

class Model {
  constructor(parent) {
    this.trello = {
      apiKey: '21b411b1b5b549c54bd32f0e90738b41', // Was: "c50413b23ee49ca49a5c75ccf32d0459"
      user: null,
      boards: null,
    };
    this.parent = parent;
    this.settings = {};
    this.isInitialized = false;
    this.event = new G2T.EventTarget();
    this.newCard = null;
    this.userEmail = null; // Set this when user data loads
  }

  init() {
    const eblcMapID = G2T.Model.EmailBoardListCardMap.id;

    this[eblcMapID] = new G2T.Model.EmailBoardListCardMap({
      parent: this,
    });

    this.isInitialized = true;

    // Bind internal events (if any)
    this.bindEvents();

    // init Trello
    this.initTrello();
  }

  bindEvents() {
    // Model-specific event bindings (if any)
    // Most models don't need to bind to their own events
  }

  // Callback methods for checkTrelloAuthorized
  checkTrelloAuthorized_onSuccess(data) {
    this.event.fire('onAuthorized');
    this.loadTrelloData();
  }

  checkTrelloAuthorized_onError(data) {
    if (!Trello.authorized()) {
      // Assure token is invalid
      this.event.fire('onBeforeAuthorize');
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
    this.event.fire('onAuthorized');
    this.loadTrelloData();
  }

  checkTrelloAuthorized_popup_onError(data) {
    this.event.fire('onAuthorizeFail');
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

  // NOTE (Ace@2020-04-03): 403s: "https://trello-avatars.s3.amazonaws.com/" + avatarHash + "/30.png";
  // Gravatar requires md5 hash of lowercase email address [see "https://www.gravatar.com/site/implement/images/"]:
  // "https://www.gravatar.com/avatar/" + gravatarHash + ".jpg?s=30";
  // avatarUrl return format is "https://trello-members.s3.amazonaws.com/{member-id}/{member-avatar-hash}/30.png"
  makeAvatarUrl(args) {
    return args?.avatarUrl ? `${args.avatarUrl}/30.png` : '';
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
    this.event.fire('onAPIFailure', { data: data });
  }

  loadTrelloData() {
    // g2t_log('loadTrelloData');

    this.event.fire('onBeforeLoadTrello');
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
      this.event.fire('onTrelloDataReady');
    }
    //else g2t_log('checkTrelloDataReady: NO');
  }

  loadTrelloLists_success(data) {
    this.trello.lists = data.lists;
    // g2t_log('loadTrelloLists: lists:' + JSON.stringify(this.trello.lists));
    this.event.fire('onLoadTrelloListSuccess');
  }

  loadTrelloLists_failure(data) {
    this.event.fire('onAPIFailure', { data: data });
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
    this.event.fire('onLoadTrelloCardsSuccess');
  }

  loadTrelloCards_failure(data) {
    this.event.fire('onAPIFailure', { data: data });
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
    this.event.fire('onLoadTrelloMemberSuccess');
  }

  loadTrelloMembers_failure(data) {
    this.event.fire('onAPIFailure', { data: data });
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
    this.event.fire('onLoadTrelloLabelsSuccess');
  }

  loadTrelloLabels_failure(data) {
    this.event.fire('onAPIFailure', { data: data });
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

  submit() {
    if (this.newCard === null) {
      g2t_log('Submit data is empty');
      return false;
    }
    const data = this.newCard;

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
      selfAssign: data.selfAssign,
    });

    const idMembers = data.selfAssign ? this.trello.user.id : null;

    //submit data
    const card = {
      name: data.title,
      desc: data.description,
      idList: data.listId,
      idMembers: idMembers,
    };
    if (data.due) card.due = data.due;
    Trello.post('cards', card, this.submit_onSuccess.bind(this));
  }

  submit_onSuccess(data) {
    this.event.fire('onCardSubmitComplete', { data: data });
    g2t_log(data);
    //setTimeout(() => {this.popupNode.hide();}, 10000);
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

// Assign classes to namespace
G2T.Model = Model;
G2T.Model.EmailBoardListCardMap = EmailBoardListCardMap;

// End, class_model.js
