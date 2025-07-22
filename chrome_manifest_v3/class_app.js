/** Gmail2Trello Application - ES6 Class Version
 */

var G2T = G2T || {}; // Namespace initialization - must be var to guarantee correct scope

class App {
  static get ck() {
    // class keys here to assure they're treated like consts
    const ck = {
      id: 'g2t_app',
      emailIdAttr: 'g2t-attr-emailId',
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

    // Centralized state management
    this.state = {
      // App-level state
      app: {
        initialized: false,
        lastHash: '',
      },
      // Model state
      model: {
        trelloAuthorized: false,
        trelloData: {
          user: null,
          boards: [],
          lists: [],
          cards: [],
          members: [],
          labels: [],
        },
        emailBoardListCardMap: [],
      },
      // PopupView state
      popupView: {
        popupWidth: 700,
        popupHeight: 464,
        boardId: null,
        listId: null,
        cardId: null,
        useBackLink: true,
        addCC: false,
        updatesPending: [],
        comboInitialized: false,
        pendingMessage: null,
      },
      // GmailView state
      gmailView: {
        layoutMode: 0, // LAYOUT_DEFAULT
      },
      // Utils state
      utils: {
        storageHashes: {},
      },
      // Log state (not persisted to Chrome storage)
      log: {
        memory: [],
        count: 0,
        max: 100,
        debugMode: false,
      },
    };

    // Navigation detection variables
    this.lastHash = window.location.hash;
  }

  loadState() {
    // Preserve current log state before loading
    const currentLogState = this.state.log;

    this.utils.loadFromChromeStorage(this.ck.id, 'classAppStateLoaded');

    // Restore log state after loading (it shouldn't be overwritten from storage)
    this.state.log = currentLogState;
  }

  saveState() {
    // Temporarily remove log state before saving (it shouldn't be persisted)
    const logState = this.state.log;
    delete this.state.log;

    this.utils.saveToChromeStorage(this.ck.id, this.state);

    // Restore log state after saving
    this.state.log = logState;
  }

  updateData() {
    const fullName = this?.model?.trello?.user?.fullName || '';

    this.popupView.bindData(this.model);

    this.gmailView.parsingData = false;
    this.model.gmail = this.gmailView.parseData({ fullName });
    this.popupView.bindGmailData(this.model.gmail);
  }

  // Event handlers
  handleClassAppStateLoaded(event, params) {
    if (params) {
      // Preserve current log state
      const currentLogState = this.state.log;

      // Merge loaded state with centralized state structure
      if (params.app) {
        this.state.app = { ...this.state.app, ...params.app };
      }
      if (params.model) {
        this.state.model = { ...this.state.model, ...params.model };
      }
      if (params.popupView) {
        this.state.popupView = { ...this.state.popupView, ...params.popupView };
      }
      if (params.gmailView) {
        this.state.gmailView = { ...this.state.gmailView, ...params.gmailView };
      }
      if (params.utils) {
        this.state.utils = { ...this.state.utils, ...params.utils };
      }

      // Restore log state (it shouldn't be overwritten from storage)
      this.state.log = currentLogState;
    }
  }

  // Parse hash to extract view level (before first '/')
  getViewLevelFromHash(hash) {
    const cleanHash = hash.replace(/^#/, '');
    const viewLevel = cleanHash.split('/')[0];
    return viewLevel || '';
  }

  // Check if hash change represents a view change (not just content change)
  isViewChange(oldHash, newHash) {
    const oldView = this.getViewLevelFromHash(oldHash);
    const newView = this.getViewLevelFromHash(newHash);
    return oldView !== newView;
  }

  // Handle Gmail navigation changes
  handleGmailNavigation() {
    this.utils.log('App: Gmail navigation detected, triggering redraw');
    // Force a complete redraw to ensure the button appears in the new view
    this.gmailView.forceRedraw();
    // Also fire the force redraw event for the popup view
    this.events.fire('forceRedraw');
  }

  handleGmailHashChange() {
    this.utils.log('App: Gmail view change detected via hashchange');
    this.gmailView.forceRedraw();
  }

  // Event binding
  bindEvents() {
    this.events.addListener(
      'classAppStateLoaded',
      this.handleClassAppStateLoaded.bind(this)
    );
  }

  // Bind Gmail navigation events
  bindGmailNavigationEvents() {
    // Listen for URL hash changes (Gmail's primary navigation method)
    window.addEventListener('hashchange', event => {
      const newHash = window.location.hash;

      // Only trigger redraw if this is a view change (not just content change)
      if (this.isViewChange(this.lastHash, newHash)) {
        this.handleGmailHashChange();
      }

      this.lastHash = newHash;
    });
  }

  init() {
    // this.utils.log('App:initialize');
    this.bindEvents();
    this.model.init();
    this.gmailView.init();
    this.popupView.init();
    this.utils.init();
    this.loadState();

    // Bind Gmail navigation events to detect view changes
    this.bindGmailNavigationEvents();

    // Declare before use to avoid undeclared globals
    const service = analytics.getService('gmail-2-trello');

    // Get a Tracker using your Google Analytics app Tracking ID.
    const tracker = service.getTracker('G-0QPEDL7YDL'); // Was: UA-8469046-1 -> UA-42442437-4

    // Record an "appView" each time the user launches your app or goes to a new
    // screen within the app.
    tracker.sendAppView('PopupView');
  }
}

// Assign class to namespace
G2T.App = App;

// End, class_app.js
