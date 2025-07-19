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

  // Extract the Gmail nav selectors into a single constant for easier maintenance
  static get GMAIL_NAV_SELECTORS() {
    return '[role="navigation"], .bq9, .bqA, .bqB, .bqC, .bqD, .bqE, .bqF, .bqG, .bqH, .bqI, .bqJ, .bqK, .bqL, .bqM, .bqN, .bqO, .bqP, .bqQ, .bqR, .bqS, .bqT, .bqU, .bqV, .bqW, .bqX, .bqY, .bqZ, [data-tooltip*="Inbox"], [data-tooltip*="Starred"], [data-tooltip*="Sent"], [data-tooltip*="Drafts"], [data-tooltip*="Spam"], [data-tooltip*="Trash"], [aria-label*="Inbox"], [aria-label*="Starred"], [aria-label*="Sent"], [aria-label*="Drafts"], [aria-label*="Spam"], [aria-label*="Trash"]';
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
    this.state = {};
    
    // Navigation detection variables
    this.navigationTimeout = null;
    this.navigationObserver = null;
  }

  loadState() {
    const fire_on_done = 'classAppStateLoaded';
    this.utils.loadFromChromeStorage(this.ck.id, fire_on_done);
  }

  saveState() {
    this.utils.saveToChromeStorage(this.ck.id, this.state);
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

  // Handle Gmail navigation changes
  handleGmailNavigation() {
    g2t_log('App: Gmail navigation detected, triggering redraw');
    // Force a complete redraw to ensure the button appears in the new view
    this.gmailView.forceRedraw();
    // Also fire the force redraw event for the popup view
    this.events.fire('forceRedraw');
  }

  // Clean up navigation observers and timeouts
  cleanup() {
    if (this.navigationTimeout) {
      clearTimeout(this.navigationTimeout);
      this.navigationTimeout = null;
    }
    
    if (this.navigationObserver) {
      this.navigationObserver.disconnect();
      this.navigationObserver = null;
    }
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
    window.addEventListener('hashchange', () => {
      this.handleGmailNavigation();
    });

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', () => {
      this.handleGmailNavigation();
    });

    // Listen for Gmail's internal navigation events
    // Gmail dispatches custom events when views change
    document.addEventListener('click', (event) => {
      // Check if the click is on a Gmail navigation element
      const $target = $(event.target);
      const isGmailNav = $target.closest(App.GMAIL_NAV_SELECTORS).length > 0;
      
      if (isGmailNav) {
        // Add a small delay to allow Gmail to complete the navigation
        setTimeout(() => {
          this.handleGmailNavigation();
        }, 100);
      }
    });

    // Listen for Gmail's internal route changes
    // Gmail uses a custom router that dispatches events
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    const app = this;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      // Trigger navigation detection after a short delay
      setTimeout(() => {
        app.handleGmailNavigation();
      }, 50);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      // Trigger navigation detection after a short delay
      setTimeout(() => {
        app.handleGmailNavigation();
      }, 50);
    };

    // Listen for Gmail's internal DOM changes that indicate navigation
    // Gmail updates the main content area when views change
    const observer = new MutationObserver((mutations) => {
      let shouldRedraw = false;
      
      mutations.forEach((mutation) => {
        // Check if the main Gmail content area has changed
        if (mutation.type === 'childList' && mutation.target) {
          const $target = $(mutation.target);
          const isMainContent = $target.closest('.AO, .nH, .aia, [role="main"]').length > 0;
          const isToolbarChange = $target.closest('[gh="mtb"]').length > 0;
          
          if (isMainContent || isToolbarChange) {
            shouldRedraw = true;
          }
        }
      });
      
      if (shouldRedraw) {
        // Debounce the redraw to avoid excessive calls
        clearTimeout(this.navigationTimeout);
        this.navigationTimeout = setTimeout(() => {
          this.handleGmailNavigation();
        }, 200);
      }
    });
    
    // Start observing the document body for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Store the observer for cleanup if needed
    this.navigationObserver = observer;
  }

  init() {
    // g2t_log('App:initialize');
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
