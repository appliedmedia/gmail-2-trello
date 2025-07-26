// Setup file for Jest tests - ensures G2T namespace is available

console.log('Setup file is being loaded...');

// Mock G2T namespace and classes
global.G2T = {};

// Create proper function constructors for G2T classes
function MockChrome(args) {
  this.storageSyncGet = jest.fn();
  this.storageSyncSet = jest.fn();
  this.storageLocalGet = jest.fn();
  this.storageLocalSet = jest.fn();
  this.runtimeSendMessage = jest.fn();
}

function MockEventTarget(args) {
  this.addEventListener = jest.fn();
  this.removeEventListener = jest.fn();
  this.dispatchEvent = jest.fn();
}

function MockModel(args) {
  this.data = {};
  this.get = jest.fn();
  this.set = jest.fn();
  this.update = jest.fn();
}

function MockGmailView(args) {
  this.init = jest.fn();
  this.render = jest.fn();
  this.update = jest.fn();
}

function MockPopupView(args) {
  this.init = jest.fn();
  this.render = jest.fn();
  this.update = jest.fn();
}

function MockUtils(args) {
  this.markdownify = jest.fn();
  this.debounce = jest.fn();
  this.throttle = jest.fn();
}

// Assign constructors to G2T namespace
G2T.Chrome = MockChrome;
G2T.EventTarget = MockEventTarget;
G2T.Model = MockModel;
G2T.GmailView = MockGmailView;
G2T.PopupView = MockPopupView;
G2T.Utils = MockUtils;

console.log('G2T namespace setup complete:', {
  Chrome: typeof G2T.Chrome,
  EventTarget: typeof G2T.EventTarget,
  Model: typeof G2T.Model,
  GmailView: typeof G2T.GmailView,
  PopupView: typeof G2T.PopupView,
  Utils: typeof G2T.Utils
});

// Mock jQuery for testing
global.$ = jest.fn();

// Mock chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  runtime: {
    sendMessage: jest.fn()
  }
};

// Mock console for testing
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Mock window object
global.window = {
  location: {
    hash: '#test-hash'
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock analytics
global.analytics = {
  track: jest.fn(),
  getService: jest.fn(() => ({
    getTracker: jest.fn(() => ({
      send: jest.fn()
    }))
  }))
};

console.log('Setup file loading complete');