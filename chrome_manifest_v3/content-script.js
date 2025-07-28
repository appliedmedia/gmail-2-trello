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
 * Show extension context invalidated dialog
 */
function extensionInvalidConfirmReload() {
  if (
    confirm(
      'Gmail-2-Trello extension needs to be reloaded to work correctly.\n\nReload now?',
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
      // Handle context invalidation if app isn't ready yet
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
    globalInit = true;
    // enough delay for gmail finishes rendering
    jQuery(function () {
      app.init();
      getGmailObject();
    });
    // Was:
    // setTimeout(function() {
    //     jQuery(document).ready(function() {
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
  console.error(
    `requestHandler ERROR: extension context invalidated - failed "chrome.runtime.onMessage.addListener"`,
  );
  // Handle context invalidation if app isn't ready yet
  extensionInvalidConfirmReload();
}

// end, content-script.js
