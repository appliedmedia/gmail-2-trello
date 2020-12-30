/** Gmail2Trello Application
 */

var Gmail2Trello = Gmail2Trello || {}; // Namespace initialization

Gmail2Trello.App = function () {
    this.CHROME_SETTINGS_ID = "g2t_user_settings";
    this.UNIQUE_URI_VAR = "g2t_filename";

    this.model = new Gmail2Trello.Model(this);
    this.gmailView = new Gmail2Trello.GmailView(this);
    this.popupView = new Gmail2Trello.PopupView(this);

    this.bindEvents();
};

Gmail2Trello.App.prototype.bindEvents = function () {
    var self = this;

    const dl_k = self.deep_link;

    /*** Data's events binding ***/
    this.model.event.addListener("onBeforeAuthorize", function () {
        self.popupView.bindData(""); // Intentionally blank
        self.popupView.showMessage(self, "Authorizing...");
    });

    this.model.event.addListener("onAuthorizeFail", function () {
        // self.model.isInitialized = false;
        self.popupView.showMessage(
            self,
            'Trello authorization failed <button id="showsignout">Sign out and try again</button>'
        );
    });

    this.model.event.addListener("onAuthorized", function () {
        // g2t_log('onAuthorized');
        // g2t_log("Status: " + Trello.authorized().toString());
        self.popupView.$popupContent.show();
        self.popupView.hideMessage();
    });

    this.model.event.addListener("onBeforeLoadTrello", function () {
        self.popupView.showMessage(self, "Loading Trello data...");
    });

    this.model.event.addListener("onTrelloDataReady", function () {
        self.popupView.$popupContent.show();
        self.popupView.hideMessage();

        self.popupView.bindData(self.model);
    });

    this.model.event.addListener("onLoadTrelloListSuccess", function () {
        self.popupView.updateLists();
        self.popupView.validateData();
    });

    this.model.event.addListener("onLoadTrelloCardsSuccess", function () {
        self.popupView.updateCards();
        self.popupView.validateData();
    });

    this.model.event.addListener("onLoadTrelloLabelsSuccess", function () {
        self.popupView.updateLabels();
        self.popupView.validateData();
    });

    this.model.event.addListener("onLoadTrelloMembersSuccess", function () {
        self.popupView.updateMembers();
        self.popupView.validateData();
    });

    this.model.event.addListener(
        "onCardSubmitComplete",
        function (target, params) {
            self.popupView.displaySubmitCompleteForm();
            // If card lists or labels have been updated, reload:
            const data_k = dl_k(params, ["data"]);
            const emailId = dl_k(data_k, ["emailId"]);
            const boardId_k = dl_k(data_k, ["data", "board", "id"]);
            const listId_k = dl_k(data_k, ["data", "list", "id"]);
            const cardId_k = dl_k(data_k, ["data", "card", "id"]);
            const idBoard_k = dl_k(data_k, ["idBoard"]);
            const idList_k = dl_k(data_k, ["idList"]);
            const idCard_k = dl_k(data_k, ["idCard"]);
            const boardId = boardId_k || idBoard_k || 0;
            const listId = listId_k || idList_k || 0;
            const cardId = cardId_k || idCard_k || 0;
            // NOTE (acoven@2020-05-23): Users expect when creating a brand new card,
            // we'll remember that new card ID and then keep defaulting to it for
            // subsequent updates to that email. That means we'll have to get the return
            // value/url from Trello and dissect that, potentially doing this update
            // in that routine:
            self.model.emailBoardListCardMapUpdate({
                emailId,
                boardId,
                listId,
                cardId,
            });

            if (boardId) {
                self.model.loadTrelloLabels(boardId);
                self.model.loadTrelloMembers(boardId);
            }
            if (listId) {
                self.model.loadTrelloCards(listId);
            }
        }
    );

    this.model.event.addListener("onAPIFailure", function (target, params) {
        self.popupView.displayAPIFailedForm(params);
    });

    /*** PopupView's events binding ***/

    this.popupView.event.addListener("onPopupVisible", function () {
        if (!self.model.isInitialized) {
            self.popupView.showMessage(self, "Initializing...");
            self.popupView.$popupContent.hide();
            self.model.init();
        } else {
            self.popupView.reset();
        }
        self.gmailView.parsingData = false;
        self.model.gmail = self.gmailView.parseData();
        self.popupView.bindGmailData(self.model.gmail);
        self.popupView.event.fire("periodicChecks");
    });

    this.popupView.event.addListener("periodicChecks", function () {
        setTimeout(function () {
            self.popupView.periodicChecks();
        }, 3000);
    });

    this.popupView.event.addListener(
        "onBoardChanged",
        function (target, params) {
            var boardId = params.boardId;
            if (boardId !== "_" && boardId !== "" && boardId !== null) {
                self.model.loadTrelloLists(boardId);
                self.model.loadTrelloLabels(boardId);
                self.model.loadTrelloMembers(boardId);
            }
        }
    );

    this.popupView.event.addListener(
        "onListChanged",
        function (target, params) {
            var listId = params.listId;
            self.model.loadTrelloCards(listId);
        }
    );

    this.popupView.event.addListener("onSubmit", function () {
        self.model.submit();
    });

    this.popupView.event.addListener("checkTrelloAuthorized", function () {
        self.popupView.showMessage(self, "Authorizing...");
        self.model.checkTrelloAuthorized();
    });

    this.popupView.event.addListener("onRequestDeauthorizeTrello", function () {
        g2t_log("onRequestDeauthorizeTrello");
        self.model.deauthorizeTrello();
        self.popupView.clearBoard();
    });

    var eventDetectButton = function () {
        if (self.gmailView.preDetect()) {
            self.popupView.$toolBar = self.gmailView.$toolBar;
            self.popupView.confirmPopup();
        }
    };

    this.popupView.event.addListener("detectButton", function () {
        eventDetectButton();
    });

    // GMailView's events:

    this.gmailView.event.addListener("onDetected", function () {
        self.popupView.$toolBar = self.gmailView.$toolBar;
        self.popupView.init();
    });

    this.gmailView.event.addListener("detectButton", function () {
        eventDetectButton();
    });

    chrome.runtime.onMessage.addListener(function (
        request,
        sender,
        sendResponse
    ) {
        if (
            request &&
            request.hasOwnProperty("message") &&
            request.message === "g2t_keyboard_shortcut"
        ) {
            self.popupView.showPopup();
        }
    });
};

Gmail2Trello.App.prototype.updateData = function () {
    var self = this;

    if (self.model.trello.user !== null && self.model.trello.boards !== null) {
        self.popupView.bindData(self.model);
    }
    self.gmailView.parsingData = false;
    self.model.gmail = self.gmailView.parseData();
    self.popupView.bindGmailData(self.model.gmail);
};

Gmail2Trello.App.prototype.initialize = function () {
    var self = this;

    this.model.isInitialized = false;

    // g2t_log('App:initialize');

    this.gmailView.detect();

    service = analytics.getService("gmail-2-trello");

    // Get a Tracker using your Google Analytics app Tracking ID.
    tracker = service.getTracker("UA-42442437-4"); // Was: UA-8469046-1"

    // Record an "appView" each time the user launches your app or goes to a new
    // screen within the app.
    tracker.sendAppView("PopupView");
};

/**
 * Correctly escape RegExp
 */
Gmail2Trello.App.prototype.escapeRegExp = function (str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
};

/**
 * Utility routine to replace variables
 */
Gmail2Trello.App.prototype.replacer = function (text, dict) {
    var self = this;

    if (!text || text.length < 1) {
        // g2t_log('Require text!');
        return "";
    } else if (!dict || dict.length < 2) {
        g2t_log("replacer: Require dictionary!");
        return text;
    }

    var re, new_text;
    var replacify = function () {
        $.each(dict, function (key, value) {
            re = new RegExp("%" + self.escapeRegExp(key) + "%", "gi");
            new_text = text.replace(re, value);
            text = new_text;
        });
    };

    var runaway_max = 3;
    while (text.indexOf("%") !== -1 && runaway_max-- > 0) {
        replacify();
    }

    return text;
};

/**
 * Make displayable URI
 */
Gmail2Trello.App.prototype.uriForDisplay = function (uri) {
    const uri_display_trigger_length_k = 20;
    const uri_length_max_k = 40;
    var uri_display = uri || "";
    if (uri_display.length > uri_display_trigger_length_k) {
        var re = RegExp("^\\w+://([\\w./_-]+).*?([\\w._-]*)$");
        var matched = uri_display.match(re);
        if (matched && matched.length > 1) {
            const filename_k =
                matched[2].length < uri_length_max_k
                    ? matched[2]
                    : matched[2].slice(-uri_length_max_k);
            var prelude = matched[1].substr(0, uri_length_max_k);
            if (matched[1].length > uri_length_max_k) {
                prelude += "...";
            } else if (filename_k.length > 0) {
                prelude += ":";
            }

            uri_display = prelude + filename_k;
        }
    }
    return uri_display;
};

/**
 * Make anchored backlink
 */
Gmail2Trello.App.prototype.anchorMarkdownify = function (text, href, comment) {
    var text1 = (text || "").trim();
    var text1lc = text1.toLowerCase();
    var href1 = (href || "").trim();
    var href1lc = href1.toLowerCase();
    var comment1 = (comment || "").trim();

    var retn = "";

    if (text1.length < 1 && href1.length < 1) {
        // Intetionally blank
    } else if (text1lc === href1lc) {
        retn = " <" + href1 + "> "; // This renders correctly in Trello as a sole URL
        // NOTE (Ace, 17-Feb-2017): Turns out Trello doesn't support markdown [] only, so we'll construct a nice displayable text vs url:
        // text1 = this.uriForDisplay(text1);
    } else if ("mailto:" + text1lc === href1lc) {
        retn = " <" + text1 + "> "; // This renders correctly in Trello as a mailto: url
    } else {
        retn =
            " [" +
            text1 +
            "](" +
            href1 +
            (comment1 ? ' "' + comment1 + '"' : "") +
            ") ";
    }

    return retn;
};

/**
 * Split an email into name and domain
 */
Gmail2Trello.App.prototype.splitEmailDomain = function (email = "") {
    const split = email.split("@");
    const name = split[0] || "";
    const domain = split[1] || "";
    return {
        name,
        domain,
    };
};

/**
 * Add trailing space if not empty:
 */
Gmail2Trello.App.prototype.addSpace = function (front = "", back = "") {
    if (front.length > 0) {
        if (back.length > 0) {
            return front + " " + back;
        } else {
            return front + " ";
        }
    } else {
        return "";
    }
};

/**
 * Markdownify a text block
 */
Gmail2Trello.App.prototype.markdownify = function (
    $emailBody,
    features,
    preprocess
) {
    if (!$emailBody || $emailBody.length < 1) {
        g2t_log("markdownify: Require emailBody!");
        return;
    }
    var self = this;

    const min_text_length_k = 4;
    const max_replace_attempts_k = 10;
    const regexp_k = {
        begin: "(^|\\s+|<|\\[|\\(|\\b|(?=\\W+))",
        end: "($|\\s+|>|\\]|\\)|\\b|(?=\\W+))",
    };
    const unique_placeholder_k = "g2t_placeholder:"; // Unique placeholder tag

    var count = 0;
    var replacer_dict = {};

    var featureEnabled = function (elementTag) {
        // Assume TRUE to process, unless explicitly restricted:
        if (typeof features === "undefined") {
            return true;
        }
        if (features === false) {
            return false;
        }
        if (!features.hasOwnProperty(elementTag)) {
            return true;
        }
        if (features[elementTag] !== false) {
            return true;
        }
        return false;
    };

    var body = $emailBody.innerText || "";
    var $html = $emailBody || ""; // Was: $emailBody.innerHTML || "";

    // Replace hr:
    var replaced = body.replace(/\s*-{3,}\s*/g, "---\n");
    body = replaced;

    // Convert crlf x 2 (or more) to paragraph markers:
    replaced = body.replace(/\s*[\n\r]+\s*[\n\r]+\s*/g, "<p />\n");
    body = replaced;

    var toProcess = {};

    /**
     * 5 explicit steps in 3 passes:
     * (1) Collect tagged items
     * (2) Remove duplicates
     * (3) Sort force-lowercase by length
     * (4) Replace with placeholder
     * (5) Replace placeholders with final text
     */
    var sortAndPlaceholderize = function (tooProcess) {
        if (tooProcess) {
            $.each(
                Object.keys(tooProcess).sort(function (a, b) {
                    // Go by order of largest to smallest
                    return b.length - a.length;
                }),
                function (index, value) {
                    var replace = tooProcess[value];
                    var swap = unique_placeholder_k + (count++).toString();
                    var re = new RegExp(
                        regexp_k.begin +
                            self.escapeRegExp(value) +
                            regexp_k.end,
                        "gi"
                    );
                    var replaced = body.replace(re, "%" + swap + "%"); // Replace occurance with placeholder
                    if (body !== replaced) {
                        body = replaced;
                        replacer_dict[swap] = replace;
                    }
                }
            );
        }
    };
    var processMarkdown = function (elementTag, replaceText) {
        if (elementTag && replaceText && featureEnabled(elementTag)) {
            toProcess = preprocess[elementTag] || {};
            $(elementTag, $html).each(function (index, value) {
                var text = ($(this).text() || "").trim();
                if (text && text.length > min_text_length_k) {
                    var replace = self.replacer(replaceText, { text: text });
                    toProcess[text.toLowerCase()] = replace; // Intentionally overwrites duplicates
                }
            });
            sortAndPlaceholderize(toProcess);
        }
    };
    /**
     * Repeat replace for max attempts or when done, whatever comes first
     */
    var repeatReplace = function (body, inRegexp, replaceWith) {
        var replace1 = "";
        for (var iter = max_replace_attempts_k; iter > 0; iter--) {
            replace1 = body.replace(inRegexp, replaceWith);
            if (body === replace1) {
                iter = 0; // All done
            } else {
                body = replace1;
            }
        }
        return body;
    };

    // bullet lists:
    // ul li -> " * "
    processMarkdown("ul li", "<p />* %text%<p />");

    // numeric lists:
    // ol li -> " 1. "
    processMarkdown("ol li", "<p />1. %text%<p />");

    // headers:
    // H1 -> #
    // H2 -> ##
    // H3 -> ###
    // H4 -> ####
    // H5 -> #####
    // H6 -> ######
    if (featureEnabled("h")) {
        toProcess = preprocess["h"] || {};
        $(":header", $html).each(function (index, value) {
            var text = ($(this).text() || "").trim();
            var nodeName = $(this).prop("nodeName") || "0";
            if (nodeName && text && text.length > min_text_length_k) {
                var x = nodeName.substr(-1);
                toProcess[text.toLowerCase()] =
                    "\n" + "#".repeat(x) + " " + text + "\n"; // Intentionally overwrites duplicates
            }
        });
        sortAndPlaceholderize(toProcess);
    }

    replaced = this.replacer(body, replacer_dict); // Replace initial batch of <div> like placeholders
    body = replaced;
    replacer_dict = {}; // Reset
    count = 0; // Reset

    // bold: b -> **text**
    processMarkdown("b", " **%text%** ");

    // italics: i -> _text_
    processMarkdown("i", " _%text%_ ");

    // links:
    // a -> [text](html)
    if (featureEnabled("a")) {
        toProcess = preprocess["a"] || {};
        $("a", $html).each(function (index, value) {
            var text = ($(this).text() || "").trim();
            var href = ($(this).prop("href") || "").trim(); // Was attr
            /*
            var uri_display = self.uriForDisplay(href);
            var comment = ' "' + text + ' via ' + uri_display + '"';
            var re = new RegExp(self.escapeRegExp(text), "i");
            if (uri.match(re)) {
                comment = ' "Open ' + uri_display + '"';
            }
            */
            if (href && text && text.length >= min_text_length_k) {
                toProcess[text.toLowerCase()] = self.anchorMarkdownify(
                    text,
                    href
                ); // Comment seemed like too much extra text // Intentionally overwrites duplicates
            }
        });
        sortAndPlaceholderize(toProcess);
    }

    /* DISABLED (Ace, 16-Jan-2017): Images kinda make a mess, until requested lets not markdownify them:
    // images:
    // img -> ![alt_text](html)
    if (featureEnabled('img')) {
        $('img', $html).each(function(index, value) {
            var text = ($(this).prop("alt") || "").trim(); // Was attr
            var href = ($(this).prop("src") || "").trim(); // Was attr
            // var uri_display = self.uriForDisplay(href);
            if (href && text && text.length >= min_text_length_k) {
                toProcess[text.toLowerCase()] = self.anchorMarkdownify(text, href); // Comment seemed like too much extra text // Intentionally overwrites duplicates
            }
        });
        sortAndPlaceholderize(toProcess);
    }
    */

    replaced = this.replacer(body, replacer_dict); // Replace second batch of <span> like placeholders
    body = replaced;

    // Replace bullets following a CRLF:
    replaced = body.replace(/\s*[\n\r]+\s*[·-]+\s*/g, "<p />* "); // = [\u00B7\u2022]
    body = replaced;

    // Replace remaining bullets with asterisks:
    replaced = body.replace(/[·]/g, "*");
    body = replaced;

    // ORDER MATTERS FOR THIS NEXT SET:
    // (1) Replace <space>CRLF<space> with just CR:
    replaced = body.replace(/\s*[\n\r]+\s*/g, "\n");
    body = replaced;

    // (2) Replace 2 or more spaces with just one:
    replaced = repeatReplace(body, new RegExp("\\s{2,}", "g"), " ");
    body = replaced;

    // (3) Replace paragraph markers with CR+CR:
    replaced = body.replace(/\s*<p \/>\s*/g, "\n\n");
    body = replaced;

    // (4) Replace 3 or more CRs with just two:
    replaced = repeatReplace(body, new RegExp("\\n{3,}", "g"), "\n\n");
    body = replaced;

    // (5) Trim excess at beginning and end:
    replaced = body.trim();
    body = replaced;

    return body;
};

/**
 * Determine luminance of a color so we can augment with darker/lighter background
 */
Gmail2Trello.App.prototype.luminance = function (color) {
    var bkColorLight = "lightGray"; // or white
    var bkColorDark = "darkGray"; // 'gray' is even darker
    var bkColorReturn = bkColorLight;

    var re = new RegExp("rgb\\D+(\\d+)\\D+(\\d+)\\D+(\\d+)");
    var matched = color.match(re, "i");
    if (matched && matched.length > 2) {
        // 0 is total string:
        var r = matched[1];
        var g = matched[2];
        var b = matched[3];
        // var 1 = matched[4]; // if alpha is provided

        var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

        if (luma < 40) {
            bkColorReturn = bkColorDark;
        } else {
            bkColorReturn = bkColorLight;
        }
    } else {
        bkColorReturn = bkColorLight; // RegExp failed, assume dark color
    }

    return "inherit"; // Use: bkColorReturn if you want to adjust background based on text perceived brightness
};

/**
 * HTML bookend a string
 */
Gmail2Trello.App.prototype.bookend = function (bookend, text, style) {
    return (
        "<" +
        bookend +
        (style ? ' style="' + style + '"' : "") +
        ">" +
        (text || "") +
        "</" +
        bookend +
        ">"
    );
};

/**
 * Get selected text
 * http://stackoverflow.com/questions/5379120/get-the-highlighted-selected-text
 */
Gmail2Trello.App.prototype.getSelectedText = function () {
    var text = "";
    var activeEl = document.activeElement;
    var activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
    if (
        (activeElTagName == "textarea" || activeElTagName == "input") &&
        /^(?:text|search|password|tel|url)$/i.test(activeEl.type) &&
        typeof activeEl.selectionStart == "number"
    ) {
        text = activeEl.value
            .slice(activeEl.selectionStart, activeEl.selectionEnd)
            .trim();
    } else if (document.selection) {
        text = document.selection.createRange().text.trim();
    } else if (document.getSelection) {
        text = document.getSelection().toString().trim();
    } else if (window.getSelection) {
        text = window.getSelection().toString().trim();
    }
    return text;
};

/**
 * Truncate a string
 */
Gmail2Trello.App.prototype.truncate = function (text, max, add) {
    var retn = text || "";
    const add_k = this.decodeEntities(add || "");
    const max_k = max - add_k.length;

    if (text && text.length > max_k) {
        retn = text.slice(0, max_k) + add_k;
    }
    return retn;
};

/***
 * Middle-truncate a string
 */
Gmail2Trello.App.prototype.midTruncate = function (text, max, add) {
    var retn = text || "";
    const add_k = this.decodeEntities(add || "");
    const max_k = Math.abs((max || 0) - add_k.length);
    const mid_k = (max_k + 0.01) / 2;

    if (text && text.length > max_k) {
        retn = text.slice(0, mid_k + 1) + add_k + text.slice(-mid_k);
    }
    return retn;
};
/**
 * Load settings
 */
Gmail2Trello.App.prototype.loadSettings = function (popup) {
    let self = this;
    const setID = this.CHROME_SETTINGS_ID;
    chrome.storage.sync.get(setID, function (response) {
        if (response && response.hasOwnProperty(setID)) {
            // NOTE (Ace, 7-Feb-2017): Might need to store these off the app object:
            try {
                self.popupView.data.settings = JSON.parse(response[setID]);
            } catch (err) {
                g2t_log(
                    "loadSettings: JSON parse failed! Error: " +
                        JSON.stringify(err)
                );
            }
        }
        if (popup) {
            popup.init_popup();
            self.updateData();
        }
    });
};

/**
 * Save settings
 */
Gmail2Trello.App.prototype.saveSettings = function () {
    let self = this;
    const setID = this.CHROME_SETTINGS_ID;
    let settings = $.extend({}, this.popupView.data.settings);

    // Delete large, potentially needing secure, data bits:
    settings.description = "";
    settings.title = "";
    settings.attachments = [];
    settings.images = [];
    delete settings.description;
    delete settings.title;
    delete settings.attachments;
    delete settings.images;

    const settings_string_k = JSON.stringify(settings);

    hash = {};
    hash[setID] = settings_string_k;

    if (!self.lastSettingsSave || self.lastSettingsSave !== settings_string_k) {
        chrome.storage.sync.set(hash); // NOTE (Ace, 7-Feb-2017): Might need to store these off the app object
        self.lastSettingsSave = settings_string_k;
    }
};

/**
 * Encode entities
 */
Gmail2Trello.App.prototype.encodeEntities = function (s) {
    var ta = document.createElement("textarea");
    ta.value = s;
    return ta.innerHTML;
    // jQuery way, less safe: return $("<textarea />").text(s).html();
};

/**
 * Decode entities
 */
Gmail2Trello.App.prototype.decodeEntities = function (s) {
    var self = this;
    const dict_k = { "...": "&hellip;", "*": "&bullet;", "-": "&mdash;" };
    var re, new_s;
    $.each(dict_k, function (key, value) {
        re = new RegExp(self.escapeRegExp(key), "gi");
        new_s = s.replace(re, value);
        s = new_s;
    });
    try {
        new_s = decodeURIComponent(s);
        s = new_s;
    } catch (e) {
        // Didn't work. Ignore.
    }
    var ta = document.createElement("textarea");
    ta.innerHTML = s;
    return ta.value;
    // jQuery way, less safe: return $("<textarea />").html(s).text();
};

/**
 * Check for ctrl/alt/shift down:
 */
Gmail2Trello.App.prototype.modKey = function (event) {
    var retn = "";

    if (event.ctrlKey) {
        retn = "ctrl-";
        if (event.ctrlLeft) {
            retn = "left";
        }
    } else if (event.altKey) {
        retn = "alt-";
        if (event.altLeft) {
            retn = "left";
        }
    } else if (event.shiftKey) {
        retn = "shift-";
        if (event.shiftLeft) {
            retn += "left";
        }
    } else if (event.metaKey) {
        retn = "metakey-";
        if (window.navigator.platform.indexOf("Mac") !== -1) {
            retn += "clover";
        } else {
            retn += "windows";
        }
    }

    // If the string is partial, then it was the right-side key:
    if (retn.slice(-1) === "-") {
        retn += "right";
    }

    return retn;
};

/**
 * Validate deep link or return empty object:
 */
Gmail2Trello.App.prototype.deep_link = function (obj, fields) {
    if (!obj) return "";
    if (!fields) return "";

    var field1,
        obj_ptr = obj;
    var valid = true;
    while ((field1 = fields.shift()) && valid) {
        if ((valid = obj_ptr.hasOwnProperty(field1))) {
            obj_ptr = obj_ptr[field1];
        }
    }
    return valid ? obj_ptr : "";
};

/**
 * Validate hash table entries are non-blank
 */
Gmail2Trello.App.prototype.validHash = function (args, reqs = []) {
    if (!args) {
        g2t_log("validHash: Require args!");
        return false;
    }

    var fields = reqs && reqs.length ? reqs : Object.keys(args),
        field1,
        valid = true;

    while ((field1 = fields.shift()) && valid) {
        if (!args.hasOwnProperty(field1) || args[field1].length < 1) {
            valid = false;
        }
    }

    return valid;
};

Gmail2Trello.App.prototype.url_add_var = function (url_in = "", var_in = "") {
    let add = "";
    if (url_in && url_in.length && var_in && var_in.length) {
        add = "&";
        if (url_in.indexOf("?") === -1) {
            add = "?";
        }
    }

    return url_in + add + var_in;
};

// End, app.js
