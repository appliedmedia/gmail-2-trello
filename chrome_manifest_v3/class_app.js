/** Gmail2Trello Application - ES6 Class Version
 */

var G2T = G2T || {}; // Namespace initialization - must be var to guarantee correct scope

class App {
  constructor() {
    this.CHROME_SETTINGS_ID = 'g2t_user_settings';
    this.UNIQUE_URI_VAR = 'g2t_filename';

    this.model = new G2T.Model(this);
    this.gmailView = new G2T.GmailView(this);
    this.popupView = new G2T.PopupView(this);
    this.utils = new G2T.Utils(this);
  }

  init() {
    // Initialize all components
    this.model.init();
    this.gmailView.init();
    this.popupView.init();
    this.utils.init();
  }

  updateData() {
    const fullName = this?.model?.trello?.user?.fullName || '';

    this.popupView.bindData(this.model);

    this.gmailView.parsingData = false;
    this.model.gmail = this.gmailView.parseData({ fullName });
    this.popupView.bindGmailData(this.model.gmail);
  }

  init() {
    this.model.isInitialized = false;

    // g2t_log('App:initialize');

    this.gmailView.detect();

    // Declare before use to avoid undeclared globals
    let service, tracker;
    service = analytics.getService('gmail-2-trello');

    // Get a Tracker using your Google Analytics app Tracking ID.
    tracker = service.getTracker('G-0QPEDL7YDL'); // Was: UA-8469046-1 -> UA-42442437-4

    // Record an "appView" each time the user launches your app or goes to a new
    // screen within the app.
    tracker.sendAppView('PopupView');
  }

  // Callback methods for loadSettings
  loadSettings_onSuccess(popup, response) {
    const setID = this.CHROME_SETTINGS_ID;
    if (response?.[setID]) {
      // NOTE (Ace, 7-Feb-2017): Might need to store these off the app object:
      try {
        this.popupView.data.settings = JSON.parse(response[setID]);
      } catch (err) {
        g2t_log(
          'loadSettings: JSON parse failed! Error: ' + JSON.stringify(err)
        );
      }
    }
    if (popup) {
      popup.init_popup();
      this.updateData();
    }
  }

  /**
   * Load settings
   */
  loadSettings(popup) {
    const setID = this.CHROME_SETTINGS_ID;
    chrome.storage.sync.get(
      setID,
      this.loadSettings_onSuccess.bind(this, popup)
    );
  }

  /**
   * Save settings
   */
  saveSettings() {
    const setID = this.CHROME_SETTINGS_ID;
    const { description, title, attachments, images, ...settings } =
      this.popupView.data.settings;
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
