/** Gmail2Trello Application - ES6 Class Version
 */

var G2T = G2T || {}; // Namespace initialization - must be var to guarantee correct scope

class App {
  static CHROME_SETTINGS_ID = 'g2t_user_settings';
  static UNIQUE_URI_VAR = 'g2t_filename';
  static EMAIL_ID_ATTR = 'g2t-attr-emailId';
  static get id() {
    return 'g2t_app';
  }

  constructor() {
    this.events = new G2T.EventTarget({ app: this });
    this.model = new G2T.Model({ app: this });
    this.gmailView = new G2T.GmailView({ app: this });
    this.popupView = new G2T.PopupView({ app: this });
    this.utils = new G2T.Utils({ app: this });
  }

  loadState() {
    const fire_on_done = 'classAppStateLoaded';
    this.utils.loadFromChromeStorage(this.id, fire_on_done);
  }

  saveState() {
    this.utils.saveToChromeStorage(this.id, this.state);
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
    this.state = params || {};
  }

  // Event binding
  bindEvents() {
    this.events.addListener(
      'classAppStateLoaded',
      this.handleClassAppStateLoaded.bind(this)
    );
  }

  init() {
    // g2t_log('App:initialize');
    this.bindEvents();
    this.model.init();
    this.gmailView.init();
    this.popupView.init();
    this.utils.init();
    this.loadState();

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
