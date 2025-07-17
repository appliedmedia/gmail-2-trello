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

  bindEvents() {
    this.events.addListener(
      'classAppInitDone',
      this.handleClassAppInitDone.bind(this)
    );
    this.events.addListener(
      'classAppLoadStateDone',
      this.handleClassAppLoadStateDone.bind(this)
    );
  }

  init() {
    // g2t_log('App:initialize');
    this.bindEvents();
    this.events.init();
    this.model.init();
    this.gmailView.init();
    this.popupView.init();
    this.utils.init();
    this.loadState('classAppLoadStateDone');

    // Declare before use to avoid undeclared globals
    const service = analytics.getService('gmail-2-trello');

    // Get a Tracker using your Google Analytics app Tracking ID.
    const tracker = service.getTracker('G-0QPEDL7YDL'); // Was: UA-8469046-1 -> UA-42442437-4

    // Record an "appView" each time the user launches your app or goes to a new
    // screen within the app.
    tracker.sendAppView('PopupView');
  }

  loadState() {
    const fire_on_done = 'classAppStateLoaded';
    this.utils.loadFromChromeStorage(this.id, fire_on_done);
  }
  async saveState() {
    this.utils.saveToChromeStorage(this.id, this.state);
  }

  updateData() {
    const fullName = this?.model?.trello?.user?.fullName || '';

    this.popupView.bindData(this.model);

    this.gmailView.parsingData = false;
    this.model.gmail = this.gmailView.parseData({ fullName });
    this.popupView.bindGmailData(this.model.gmail);
  }

  handleClassAppInitDone() {
    this.loadState();
  }

  handleClassAppLoadStateDone(event, params) {
    if (params?.data) {
      this.state = params.data;
    }
  }

  // Callback methods for loadSettings
  loadSettings_onSuccess(popup, response) {
    const setID = G2T.App.CHROME_SETTINGS_ID;
    if (response?.[setID]) {
      // NOTE (Ace, 7-Feb-2017): Might need to store these off the app object:
      try {
        this.popupView.state = JSON.parse(response[setID]);
      } catch (err) {
        g2t_log(
          'loadSettings: JSON parse failed! Error: ' + JSON.stringify(err)
        );
      }
    }
    if (popup) {
      this.updateData();
    }
  }

  /**
   * Load settings
   */
  loadSettings(popup) {
    const setID = G2T.App.CHROME_SETTINGS_ID;
    chrome.storage.sync.get(
      setID,
      this.loadSettings_onSuccess.bind(this, popup)
    );
  }

  /**
   * Save settings
   */
  saveSettings() {
    const setID = G2T.App.CHROME_SETTINGS_ID;
    const { description, title, attachments, images, ...settings } =
      this.popupView.state;
    void (description || title || attachments || images); // silence linter unused var warnings

    const settings_string_k = JSON.stringify(settings);

    let hash = {};
    hash[setID] = settings_string_k;

    if (this.lastSettingsSave !== settings_string_k) {
      try {
        chrome.storage.sync.set(hash); // NOTE (Ace, 7-Feb-2017): Might need to store these off the app object
        this.lastSettingsSave = settings_string_k;
      } catch (error) {
        g2t_log(
          `saveSettings ERROR: extension context invalidated - failed "chrome.storage.sync.set"`
        );
        this?.popupView?.displayExtensionInvalidReload();
      }
    }
  }
}

// Assign class to namespace
G2T.App = App;

// End, class_app.js
