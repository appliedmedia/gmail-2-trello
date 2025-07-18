/*
 Flows:
    + 1st loading (onDocumentReady)
        - load user settings()
        - initPopup() // html, data binding & event binding
        - initTrelloData()
        - extractData()
 
    + 2nd loading (onButtonToggle)
        - initTrelloData()
        - extractData()
 */

/**
 * Variable for debugging purpose only
 */
let globalInit = false;

/**
 * Generic hasOwnProperty check that can be easily changed if needed
 * @param {Object} obj - The object to check
 * @param {string} prop - The property name to check
 * @returns {boolean} - True if the object has the property as its own property
 */
function g2t_has(obj, prop) {
  // Use modern Object.hasOwn() if available, otherwise fall back to hasOwnProperty
  if (typeof Object.hasOwn === 'function') {
    return Object.hasOwn(obj, prop);
  } else {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }
}

/**
 * g2t_each: Iterate over arrays or objects like jQuery's $.each
 * @param {Array|Object} obj - The array or object to iterate
 * @param {Function} callback - function(value, keyOrIndex, obj)
 */
function g2t_each(obj, callback) {
  if (Array.isArray(obj)) {
    obj.forEach(function (value, index) {
      callback(value, index, obj);
    });
  } else if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach(function (key) {
      callback(obj[key], key, obj);
    });
  }
  // else: do nothing for null/undefined
}

/**
 * Global log. A wrapper for console.log, depend on logEnabled flag
 * @param  {any} data data to write log
 */
function g2t_log(data) {
  window.g2t_log_g ??= {
    memory: [],
    count: 0,
    max: 100,
    debugMode: false,
  };

  try {
    window.g2t_app.chrome.storageSyncGet('debugMode', function (response) {
      if (response?.debugMode) {
        window.g2t_log_g.debugMode = true;
      }
    });
  } catch (error) {
    // Extension context invalidated, continue without debug mode
  }

  let l = window.g2t_log_g;

  if (data) {
    const count_size_k = l.max.toString().length;
    const counter_k = ('0'.repeat(count_size_k) + l.count.toString()).slice(
      -count_size_k
    );
    const now_k = new Date().toISOString();

    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }

    data = `${now_k}.${counter_k} G2T→${data}`;

    l.memory[l.count] = data;
    if (++l.count >= l.max) {
      l.count = 0;
    }
    if (l.debugMode) {
      console.log(data);
    }
  } else {
    return (
      l.memory.slice(l.count).join('\n') + l.memory.slice(0, l.count).join('\n')
    );
  }
}

/**
 * Show extension context invalidated dialog
 */
function extensionInvalidConfirmReload() {
  if (
    confirm(
      'Gmail-2-Trello extension needs to be reloaded to work correctly.\n\nReload now?'
    )
  ) {
    window.location.reload();
  }
}

/**
 * Inject code: for accessing Gmail's GLOBALS object
 * reference: http://stackoverflow.com/questions/9602022/chrome-extension-retrieving-gmails-original-message
 * and: https://github.com/KartikTalwar/gmail.js/blob/master/src/gmail.js
 * Note, the customEvent is expecting to transfer data in the 'detail' variable
 */

function getGmailObject() {
  document.addEventListener('g2t_connect_extension', function (e) {
    app.model.userEmail = e.detail.userEmail; // Was: e.detail[10];
  });

  const scripts_to_inject = ['inject.js']; // Just one, currently
  for (const item of scripts_to_inject) {
    try {
      const script = document.createElement('script');
      script.src = window.g2t_app.chrome.runtimeGetURL(item);
      (document.head || document.documentElement).appendChild(script);
      script.onload = function () {
        script.parentNode.removeChild(script);
      };
    } catch (error) {
      g2t_log(
        `getGmailObject ERROR: extension context invalidated - failed "chrome.runtime.getURL"`
      );
      extensionInvalidConfirmReload();
    }
  }
}

var G2T = G2T || {}; // Namespace initialization - must be var to guarantee correct scope
var app = new G2T.App();
window.g2t_app = app;

/**
 * Handle request from background.js
 * @param  request      Request object, contain parameters
 * @param  sender
 * @param  sendResponse Callback function
 */
function requestHandler(request, sender, sendResponse) {
  if (request?.message === 'g2t_initialize') {
    // g2t_log('GlobalInit: '+globalInit.toString());
    globalInit = true;
    // enough delay for gmail finishes rendering
    // g2t_log('tabs.onUpdated - complete');
    jQuery(document).ready(function () {
      g2t_log('document.ready');
      app.init();
      getGmailObject();
    });
    // Was:
    // setTimeout(function() {
    //     jQuery(document).ready(function() {
    //         g2t_log('document.ready');
    //         getGmailObject();
    //         app.initialize();
    //     });
    // }, 1000); // But now we're more resiliant with no data, so pop on immediately.
  }
}

// Register Handler
try {
  chrome.runtime.onMessage.addListener(requestHandler); // Was: chrome.extension.onMessage.addListener
} catch (error) {
  g2t_log(
    `requestHandler ERROR: extension context invalidated - failed "chrome.runtime.onMessage.addListener"`
  );
  extensionInvalidConfirmReload();
}

// end, content-script.js
