var G2T = G2T || {}; // Namespace initialization - must be var to guarantee correct scope

class Goog {
  static get ck() {
    // class keys here to assure they're treated like consts
    const ck = {
      id: 'g2t_goog',
      errorPrefix: 'Error:',
      contextInvalidError: 'Extension context invalidated',
      reloadMessage: 'Extension needs to be reloaded.',
    };
    return ck;
  }

  get ck() {
    return Goog.ck;
  }

  constructor({ app } = {}) {
    this.app = app;
    this.bindEvents();
  }

  bindEvents() {
    // Listen for storage changes to refresh debug mode
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes?.debugMode && this.app?.utils?.refreshDebugMode) {
        // Debug mode changed, refresh the state
        this.app.utils.refreshDebugMode();
      }
    });
  }

  /**
   * Wraps Chrome API calls with context validation and error handling
   * @param {Function} apiCall - The Chrome API function to call
   * @param {string} operation - Description of the operation for logging
   * @param {Function} callback - Optional callback for the result
   */
  wrapApiCall(apiCall, operation = 'Goog API call', callback) {
    try {
      return apiCall(callback);
    } catch (error) {
      window.console.log(
        `${this.ck.errorPrefix} ${operation} failed: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Handles Chrome API errors, specifically context invalidation
   * @param {Error} error - The error from Chrome API
   * @param {string} operation - Description of the operation that failed
   */
  handleChromeError(error, operation) {
    const errorMessage = error?.message || 'Unknown error';

    // Check for context invalidation
    if (errorMessage.includes(this.ck.contextInvalidError)) {
      window.console.log(
        `${this.ck.errorPrefix} Context invalidated during ${operation}. ${this.ck.reloadMessage}`
      );
      // Show alert directly instead of firing event that might not be handled
      if (
        confirm(
          'Gmail-2-Trello extension needs to be reloaded to work correctly.\n\nReload now?'
        )
      ) {
        window.location.reload();
      }
      return;
    }

    // Log other Chrome API errors
    window.console.log(
      `${this.ck.errorPrefix} ${operation} failed: ${errorMessage}`
    );
  }

  /**
   * Shows user-friendly message about context invalidation
   */
  showContextInvalidMessage() {
    // Check if popup is available and use it for error display
    if (this.app?.popupView?.displayExtensionInvalidReload) {
      this.app.popupView.displayExtensionInvalidReload();
      return;
    }

    // Fallback: Create notification element if popup not available
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff6b6b;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
      word-wrap: break-word;
    `;

    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">Extension Error</div>
      <div>${this.ck.reloadMessage}</div>
      <button onclick="this.parentElement.remove()" style="
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        margin-top: 10px;
        cursor: pointer;
        font-size: 12px;
      ">Dismiss</button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  // Chrome Storage API wrappers (sync storage used in this project)
  storageSyncGet(keys, callback) {
    return this.wrapApiCall(
      cb => chrome.storage.sync.get(keys, cb),
      `storage.sync.get(${JSON.stringify(keys)})`,
      callback
    );
  }

  storageSyncSet(items, callback) {
    return this.wrapApiCall(
      cb => chrome.storage.sync.set(items, cb),
      `storage.sync.set(${JSON.stringify(Object.keys(items))})`,
      callback
    );
  }

  // Chrome Runtime API wrappers (used in class_model.js and class_popupView.js)
  runtimeSendMessage(message, callback) {
    return this.wrapApiCall(
      cb => chrome.runtime.sendMessage(message, cb),
      `runtime.sendMessage(${JSON.stringify(message)})`,
      callback
    );
  }

  runtimeGetURL(path) {
    return this.wrapApiCall(
      () => chrome.runtime.getURL(path),
      `runtime.getURL(${path})`
    );
  }
}

// Assign class to namespace
G2T.Goog = Goog;
