/** Gmail2Trello Application - ES6 Class Version
 */

/* global analytics */ // Declare analytics as global from Google Analytics library

var G2T = G2T || {}; // Namespace initialization - must be var to guarantee correct scope

class App {
  static get ck() {
    // class keys here to assure they're treated like consts
    const ck = {
      id: 'g2t_app',
    };
    return ck;
  }

  get ck() {
    return App.ck;
  }

  constructor() {
    // Trello API key is not a secure key - it's meant to be public and is locked to this extension
    // This is the prescribed usage pattern for Trello API keys in client-side applications
    this.trelloApiKey = '21b411b1b5b549c54bd32f0e90738b41'; // Was: "c50413b23ee49ca49a5c75ccf32d0459"
    this.chrome = new G2T.Chrome({ app: this });
    this.events = new G2T.EventTarget({ app: this });
    this.model = new G2T.Model({ app: this });
    this.gmailView = new G2T.GmailView({ app: this });
    this.popupView = new G2T.PopupView({ app: this });
    this.utils = new G2T.Utils({ app: this });

    // Persistent state management
    this.persist = {
      // Gmail layout state
      layoutMode: 0, // LAYOUT_DEFAULT
      // Model state
      trelloAuthorized: false,
      // Trello data (flattened)
      user: null,
      emailBoardListCardMap: [],
      // PopupView state
      popupWidth: 700,
      popupHeight: 464,
      // Utils state
      storageHashes: {},
      // Form state (persisted)
      boardId: null,
      listId: null,
      cardId: null,
      useBackLink: true,
      addCC: false,
      // User preferences (persisted)
      labelsId: '',
      membersId: '',
    };

    // Temporary state (not saved to storage)
    this.temp = {
      lastHash: '',
      log: {
        memory: [],
        count: 0,
        max: 100,
        debugMode: false,
      },
      updatesPending: [],
      comboInitialized: false,
      pendingMessage: null,
      // Personal data (not persisted)
      description: '',
      title: '',
      attachment: [],
      image: [],
      // Trello data (not persisted - reloaded from API)
      boards: [],
      lists: [],
      cards: [],
      members: [],
      labels: [],
    };

    // App initialization flag (local, not persisted)
    this.initialized = false;

    // Initialize navigation detection
    this.temp.lastHash = window.location.hash;
  }

  persistLoad() {
    this.utils.loadFromChromeStorage(this.ck.id, 'classAppStateLoaded');
  }

  persistSave() {
    this.utils.saveToChromeStorage(this.ck.id, this.persist);
  }

  updateData() {
    const fullName = this?.model?.trello?.user?.fullName || '';

    this.popupView.bindData(this.model);

    this.gmailView.parsingData = false;
    this.model.gmail = this.gmailView.parseData({ fullName });
    this.popupView.bindGmailData(this.model.gmail);
  }

  // Event handlers
  handleClassAppStateLoaded(event, params = {}) {
    // Merge loaded data into persist state
    Object.assign(this.persist, params);

    this.initialized = true;
  }

  // Handle Gmail navigation changes
  handleGmailNavigation() {
    this.utils.log('App: Gmail navigation detected, triggering redraw');
    // Force a complete redraw to ensure the button appears in the new view
    this.gmailView.forceRedraw();
    // Also emit the force redraw event for the popup view
    this.events.emit('forceRedraw');
  }

  handleGmailHashChange() {
    this.utils.log('App: Gmail view change detected via hashchange');
    this.gmailView.forceRedraw();
  }

  // Event binding
  bindEvents() {
    this.events.addListener(
      'classAppStateLoaded',
      this.handleClassAppStateLoaded.bind(this),
    );
  }

  // Bind Gmail navigation events
  bindGmailNavigationEvents() {
    // Listen for URL hash changes (Gmail's primary navigation method)
    window.addEventListener('hashchange', event => {
      const oldHash = (event?.oldURL || '').match(/#([^/]+)/)?.[1] || '';
      const newHash = (event?.newURL || '').match(/#([^/]+)/)?.[1] || '';

      // Only trigger redraw if this is a view change (not just content change)
      if (oldHash !== newHash) {
        this.handleGmailHashChange();
      }

      this.temp.lastHash = newHash;
    });
  }

  init() {
    // this.utils.log('App:initialize');
    this.bindEvents();
    this.model.init();
    this.gmailView.init();
    this.popupView.init();
    this.utils.init();
    this.persistLoad();

    // Bind Gmail navigation events to detect view changes
    this.bindGmailNavigationEvents();

    // Google Analytics tracking (only if analytics is available)
    if (typeof analytics !== 'undefined') {
      try {
        const service = analytics.getService('gmail-2-trello');
        const tracker = service.getTracker('G-0QPEDL7YDL'); // Was: UA-8469046-1 -> UA-42442437-4
        tracker.sendAppView('PopupView');
      } catch (error) {
        this.utils.log('Google Analytics failed:', error);
      }
    } else {
      this.utils.log('Google Analytics not available - tracking disabled');
    }
  }
}

// Assign class to namespace
G2T.App = App;

// End, class_app.js
