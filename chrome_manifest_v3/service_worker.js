const CLEAR_EXT_BROWSING_DATA = 'g2t_clear_extension_browsing_data';
const UPLOAD_ATTACH = 'g2t_upload_attach';
const UPLOAD_ATTACH_STORE = 'g2t_upload_attach_store';
const UPLOAD_ATTACH_RESULTS = 'g2t_upload_attach_results';
let debugMode_g;

/**
 * Call console.log if in DEBUG mode only
 */
function logbs(data) {
  if (typeof debugMode_g === 'undefined') {
    chrome.storage.sync.get('debugMode', function (response) {
      if (response?.debugMode) {
        debugMode_g = true;
      }
    });
  }

  if (debugMode_g) {
    console.log(`g2t→${data}`);
  }
}

/**
 * Detect Gmail's URL everytimes a tab is reloaded or openned
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  logbs(changeInfo.status);
  if (changeInfo.status === 'complete') {
    g2t_checkForValidUrl(tab);
  }
});

/**
 * Manage Keyboard Shortcut
 */
chrome.commands.onCommand.addListener(function (command) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { message: 'g2t_keyboard_shortcut' },
      function (response) {}
    );
  });
});

function g2t_clearExtensionBrowsingData(callback) {
  logbs('clearExtensionBrowsingData');
  const opts_k = {
    since: 0,
    originTypes: { extension: true },
  };
  if (chrome?.browsingData?.remove) {
    logbs('clearExtensionBrowsingData: browsingData exists!');
    chrome.browsingData.remove(
      opts_k,
      {
        appcache: true,
        cache: true,
        cookies: true,
        downloads: false,
        fileSystems: false,
        formData: false,
        history: false,
        indexedDB: false,
        localStorage: false,
        serverBoundCertificates: false,
        pluginData: true,
        passwords: false,
        webSQL: false,
      },
      callback
    );
  } else {
    logbs('clearExtensionBrowsingData: browsingData invalid!');
  }
}

/**
 * Check if current URL is on Gmail
 * @param  https://developer.chrome.com/extensions/tabs#type-Tab tab Tab to check
 * @return bool     Return True if you're on Gmail
 */
function g2t_checkForValidUrl(tab) {
  chrome.action.disable(tab.id);
  if (tab.url.indexOf('https://mail.google.com/') == 0) {
    chrome.action.enable(tab.id);

    logbs(tab.url);

    // Call content-script initialize function
    chrome.tabs.sendMessage(
      //Selected tab id
      tab.id,
      //Params inside a object data
      { message: 'g2t_initialize' }
    );
  }
}

/**
 * Assure all keys are present in a dict and have values
 * @param 'dict' dictionary/hash to iterate
 * @param 'keys' array of required keys
 * @return true if present with value, false if not
 */
function g2t_hasAllKeys(dict, keys) {
  const size_k = keys.length;
  for (let iter = 0; iter < size_k; iter++) {
    if (!dict?.[keys[iter]]?.length) {
      return false;
    }
  }
  return true;
}

/**
 * Upload/attach grab initial content
 * @param 'url' to grab
 * @return blob
 */
function g2t_uploadAttach(args, callback) {
  const callback_return = function (status = 'failure', data = {}) {
    if (callback && typeof callback === 'function') {
      data[UPLOAD_ATTACH_RESULTS] = status;
      callback(data);
    } else {
      logbs(
        `ERROR: g2t_uploadAttach callback failed data:${JSON.stringify(data)}`
      );
    }
  };

  const callback_failure = function (data = {}) {
    callback_return('failure', data);
  };

  const callback_success = function (data = {}) {
    callback_return('success', data);
  };

  if (
    !g2t_hasAllKeys(args, [
      'url_asset',
      'filename',
      'trello_key',
      'trello_token',
      'url_upload',
    ])
  ) {
    return callback_failure({
      responseText: 'Missing keys in g2t_uploadAttach!',
    });
  }

  fetch(args['url_asset'])
    .then(response => response.blob())
    .then(blob => {
      const filename_k = args['filename'];
      const file_k = new File([blob], filename_k);
      logbs(`Attaching filename:"${filename_k}" size:${file_k.size}`);
      if (!file_k.size) {
        const msg = `ERROR: Empty content! Filename:"${filename_k}"`;
        logbs(msg);
        const data = {
          status: 'size:0',
          statusText: msg,
          responseText: `Attachment retrieval failure: Try creating/updating card again without attachment "${filename_k}"`,
          keys: '<none>',
        };
        return callback_failure(data);
      }
      var form = new FormData();
      form.append('file', file_k);
      form.append('key', args['trello_key']);
      form.append('token', args['trello_token']);

      fetch(args['url_upload'], {
        method: 'POST',
        body: form,
      })
        .then(response => response.json())
        .then(data => callback_success(data))
        .catch(error => callback_failure(error));
    })
    .catch(error => callback_failure(error));
}

/**
 * Manage content script activities that for security reasons and otherwise need to beh andled in background script:
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // Was: chrome.extension.onMessage.addListener
  // local storage request
  if (!request) {
    // Intentionally blank, don't do anything in this case
  } else if (request?.storage) {
    // OBSOLETE (Ace@2017.08.31): Not sure this is ever called anymore:
    // Commented out as this code path is not used and localStorage is not available in service workers
    /*
    if (typeof request.value !== 'undefined') {
      chrome.storage.local.set(
        { [request.storage]: request.value },
        function () {
          logbs('backgroundOnMessage: storage requested!');
        }
      );
    }
    chrome.storage.local.get([request.storage], function (result) {
      sendResponse({ storage: result[request.storage] });
    });
    return true; // Asynchronous
    */
    logbs(
      'backgroundOnMessage: storage requested! (deprecated - no longer supported)'
    );
    sendResponse({ storage: null });
  } else if (
    request?[CLEAR_EXT_BROWSING_DATA] === true &&
    
  ) {
    g2t_clearExtensionBrowsingData(sendResponse);
    return true; // Asynchronous
  } else if (request?.[UPLOAD_ATTACH] != null) {
    g2t_uploadAttach(request[UPLOAD_ATTACH], sendResponse);
    return true; // Asynchronous
  } else {
    sendResponse({});
  }
});

// End, background.js
