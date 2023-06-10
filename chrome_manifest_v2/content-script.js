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
var globalInit = false;

/**
 * Global log. A wrapper for console.log, depend on logEnabled flag
 * @param  {any} data data to write log
 */
function g2t_log(data) {
    if (!window.hasOwnProperty("g2t_log_g")) {
        window.g2t_log_g = {
            memory: [],
            count: 0,
            max: 100,
            debugMode: false,
        };
        chrome.storage.sync.get("debugMode", function (response) {
            if (response.hasOwnProperty("debugMode") && response["debugMode"]) {
                window.g2t_log_g.debugMode = true;
            }
        });
    }

    var l = window.g2t_log_g;

    if (data) {
        const count_size_k = l.max.toString().length;
        const counter_k = ("0".repeat(count_size_k) + l.count.toString()).slice(
            -count_size_k
        );
        const now_k = new Date().toISOString();

        if (typeof data !== "string") {
            data = JSON.stringify(data);
        }

        data = now_k + "." + counter_k + " G2T→" + data;

        l.memory[l.count] = data;
        if (++l.count >= l.max) {
            l.count = 0;
        }
        if (l.debugMode) {
            console.log(data);
        }
    } else {
        return (
            l.memory.slice(l.count).join("\n") +
            l.memory.slice(0, l.count).join("\n")
        );
    }
}

/**
 * Handle request from background.js
 * @param  request      Request object, contain parameters
 * @param  sender
 * @param  sendResponse Callback function
 */
function requestHandler(request, sender, sendResponse) {
    if (
        request &&
        request.hasOwnProperty("message") &&
        request.message === "g2t_initialize"
    ) {
        // g2t_log('GlobalInit: '+globalInit.toString());
        globalInit = true;
        // enough delay for gmail finishes rendering
        // g2t_log('tabs.onUpdated - complete');
        jQuery(document).ready(function () {
            g2t_log("document.ready");
            getGmailObject();
            app.initialize();
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
chrome.runtime.onMessage.addListener(requestHandler); // Was: chrome.extension.onMessage.addListener

var Gmail2Trello = Gmail2Trello || {}; // Namespace initialization
var app = new Gmail2Trello.App();

/**
 * Inject code: for accessing Gmail's GLOBALS object
 * reference: http://stackoverflow.com/questions/9602022/chrome-extension-retrieving-gmails-original-message
 * and: https://github.com/KartikTalwar/gmail.js/blob/master/src/gmail.js
 * Note, the customEvent is expecting to transfer data in the 'detail' variable
 */

function getGmailObject() {
    document.addEventListener("g2t_connect_extension", function (e) {
        app.model.userEmail = e.detail.userEmail; // Was: e.detail[10];
    });

    ["inject.js"].forEach(function (item, iter) {
        var script = document.createElement("script");
        script.src = chrome.runtime.getURL(item);
        (document.head || document.documentElement).appendChild(script);
        script.onload = function () {
            script.parentNode.removeChild(script);
        };
    });
}

/*
 *  UNIT TESTING GOES HERE. AFFECT TO EVERY PAGES
 */
