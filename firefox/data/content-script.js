/*
 Flows:
    + 1st loading (onDocumentReady)
        - loadUserSettings()
        - initPopup() // html, data binding & event binding
        - initTrelloData()
        - extractData()

    + 2nd loading (onButtonToggle)
        - initTrelloData()
        - extractData()
 */

/**
 * Turn on/off debug mode with logging
 */
var logEnabled = true;

/**
 * Variable for debugging purpose only
 */
var globalInit = true;

/**
 * Global log. A wrapper for console.log, depend on logEnabled flag
 * @param  {any} data data to write log
 */
function log(data) {
    if (logEnabled) console.log(data);
}

var Gmail2Trello = Gmail2Trello || {}; // Namespace initialization
var app = new Gmail2Trello.App();

function getGmailObject() {
    // Inject code: for accessing Gmail's GLOBALS object
    // reference: http://stackoverflow.com/questions/9602022/chrome-extension-retrieving-gmails-original-message
    document.addEventListener("G2T_connectExtension", function (e) {
        //console.log(e.detail);
        app.data.userEmail = e.detail[10];
        //    console.log(app.data);
    });

    var actualCode = [
        "setTimeout(function() {",
        'document.dispatchEvent(new CustomEvent("G2T_connectExtension", { ',
        "    detail: GLOBALS",
        "}));}, 0);",
    ].join("\n");

    var script = document.createElement("script");
    script.textContent = actualCode;
    (document.head || document.documentElement).appendChild(script);
    script.parentNode.removeChild(script);
}

log("GlobalInit: " + globalInit.toString());
globalInit = true;
// enough delay for gmail finishes rendering
log("tabs.onUpdated - complete");
setTimeout(function () {
    jQuery(document).ready(function () {
        log("document.ready");
        getGmailObject();
        app.initialize();
    });
}, 100);

/*
 *  UNIT TESTS GOES HERE. AFFECT TO EVERY PAGES
 */
