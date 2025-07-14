var Gmail2Trello = Gmail2Trello || {};

Gmail2Trello.PopupView = function () {
    this.event = new EventTarget();
    this.isInitialized = false;

    this.data = null;

    this.MIN_WIDTH = 450;

    // process
    this.waitingHiddenThread = false;
    this.waitingHiddenThreadProcId = null;
};

Gmail2Trello.PopupView.prototype.init = function () {
    log("view::initializing...");

    //check if already init
    if (this.detectPopup()) return true;

    // inject a button & a popup

    var strAddCardButtonHtml =
        '\
<div id="g2tButton" class="T-I J-J5-Ji ar7 nf T-I-ax7 L3" data-tooltip="Add this card to Trello"> \
    <div aria-haspopup="true" role="button" class="J-J5-Ji W6eDmd L3 J-Zh-I J-J5-Ji Bq L3" tabindex="0"> \
        <img class="f tk3N6e-I-J3" src="' +
        self.options.urlprefix +
        'images/icon-13.jpg"> \
        <span class="button-text">Add card</span> \
    </div> \
</div>';

    /* Sample data:
     <div id="g2tButton" class="T-I J-J5-Ji ar7 nf T-I-ax7 L3" data-tooltip="Add this card to Trello">
     <div aria-haspopup="true" role="button" class="J-J5-Ji W6eDmd L3 J-Zh-I J-J5-Ji Bq L3" tabindex="0">
     <img class="f tk3N6e-I-J3" src="chrome-extension://dmphibjhlehaljceeocbdeoaedkknipg/images/icon-13.jpg">
     <span class="button-text">Add card</span>
     </div>
     </div>
     */

    var strPopupHtml =
        '\
<div id="g2tPopup" class="J-M jQjAxd open" style="display:none"> \
    <div id="g2tPopupSlider"></div> \
    <div class="inner"> \
    <div class="hdr clearfix"> \
        <div class="userinfo"><span class="item">&nbsp;&nbsp;GMail to Trello</span> \
        </div> \
        <span class="item">|</span> \
        <a class="item" href="https://github.com/SethBoyd/gmail-2-trello-extension/issues" target="_blank"><img src="' +
        self.options.urlprefix +
        'images/new_icon.gif" /> Features/Bugs</a> \
        <a class="item" href="javascript:void(0)" id="close-button">[x] Close</a>   \
    </div> \
    <div class="popupMsg">Loading...</div> \
        <div class="content menuInnerContainer hidden"> \
            <dl> \
                <dt style="display:none">Orgs. filter:</dt> \
                <dd style="display:none"> \
                   <select id="g2tOrg"> \
                      <option value="all">All</option> \
                      <option value="-1">My Boards</option> \
                   </select> \
                </dd> \
                <dt>Board.:</dt> \
                <dd><select id="g2tBoard"><option value="">-</option></select></dd> \
                <dt>List:</dt> \
                <dd class="clearfix listrow">\
                    <span id="g2tListMsg">Pickup a board above</span>\
                    <ul id="g2tList"></ul>\
                </dd> \
                <dt>Due Date:</dt> \
                <dd><input type="text" id="g2tDue"></dd> \
                <dt>Title:</dt> \
                <dd><input type="text" id="g2tTitle" /></dd> \
                <dt>Description:</dt> \
                <dd><textarea id="g2tDesc" style="height:180px;width:300px"></textarea></dd> \
                <dd>\
                    <input type="checkbox" checked="checked" id="chkBackLink"/>\
                    <label for="chkBackLink">Link back to GMail</label>\
                    <input type="checkbox" checked="checked" id="chkSelfAssign" style="margin-left:30px"> \
                    <label for="chkSelfAssign">Assign me to this card</label> \
                </dd> \
                <dd><input type="button" disabled="true" id="addTrelloCard" value="Add to Trello card"></input></dd> \
           </dl> \
       </div> \
   </div> \
</div>';

    this.$toolBar.append(strAddCardButtonHtml + strPopupHtml);
    this.$addCardButton = $("#g2tButton", this.$toolBar);
    this.$popup = $("#g2tPopup", this.$toolBar);

    this.$popupMessage = $(".popupMsg", this.$popup);
    this.$popupContent = $(".content", this.$popup);
    this.$popupChkGmail = $("#chkBackLink", this.$popup);
    this.$popupChkSelfAssign = jQuery("#chkSelfAssign", this.$popup);

    //resize popup window
    var parentWidth = this.$toolBarHolder[0].clientWidth;

    //log('resizing...');
    var left = this.$addCardButton.position().left; //related to its parent
    var minLeft = parentWidth - this.MIN_WIDTH + 1; //
    if (left > minLeft) left = minLeft;

    //    log(this.$toolBarHolder[0]);
    //log('parentWidth: '+parentWidth);
    //log('minLeft: '+minLeft);
    //log('defaultLeft: '+this.$addCardButton.position().left);
    //log('final left: '+left);

    //this.$popup.css('left', left + 'px');

    // Bind datepicker
    this.$popupContent.find("#g2tDue").datetimepicker();

    this.onResize();

    this.bindEvents();

    this.isInitialized = true;
};

Gmail2Trello.PopupView.prototype.detectPopup = function () {
    //detect duplicate toolBar
    var $button = $("#g2tButton");
    var $popup = $("#g2tPopup");
    if ($button && $button.length > 0) {
        log("Found Button at:");
        log($button);
        if ($button[0].clientWidth <= 0) {
            log("Button is in an inactive region. Moving...");
            //relocate
            $button.appendTo(this.$toolBar);
            $popup.appendTo(this.$toolBar);
        }
        // update when visible
        if ($popup[0].clientWidth > 0) {
            //log($popup[0]);
            //log($popup[0].clientWidth);
            this.event.fire("onRequestUpdateGmailData");
        }

        return true;
    } else {
        return false;
    }
};

Gmail2Trello.PopupView.prototype.loadSettings = function () {};

Gmail2Trello.PopupView.prototype.onResize = function () {
    var textWidth = this.$popup.width() - 111;
    jQuery("input[type=text],textarea", this.$popup).css(
        "width",
        textWidth + "px"
    );
};

Gmail2Trello.PopupView.prototype.bindEvents = function () {
    // bind events
    var self = this;

    /** Popup's behavior **/

    //slider
    var $slider = jQuery("#g2tPopupSlider", this.$popup);
    var constraintRight = jQuery(window).width() - this.MIN_WIDTH;

    $slider.draggable({
        axis: "x",
        containment: [0, 0, constraintRight, 0],
        stop: function (event, ui) {
            var distance = ui.position.left - ui.originalPosition.left;
            self.$popup.css("width", self.$popup.width() - distance + "px");
            $slider.css("left", "0");
            //self.$popup.css('left', (self.$popup.position().left + distance) + 'px');
            //$slider.css('left', ui.originalPosition.left + 'px');
            self.onResize();
        },
    });

    jQuery("#close-button", this.$popup).click(function () {
        self.$popup.toggle();
    });

    /** Add Card Panel's behavior **/

    this.$addCardButton.click(function () {
        self.$popup.toggle();
        if (self.$popup.css("display") === "block")
            self.event.fire("onPopupVisible");
        else {
            self.stopWaitingHiddenThread();
        }
    });

    jQuery("#g2tOrg", this.$popup).change(function () {
        //log(boardId);
        self.updateBoards();
    });

    var $board = jQuery("#g2tBoard", this.$popup);
    $board.change(function () {
        var boardId = $board.val();

        if (boardId === "_") {
            $board.val("");
        }

        var $list = jQuery("#g2tList", self.$popup);
        var $listMsg = jQuery("#g2tListMsg", self.$popup);

        $list.html("").hide();
        if (boardId === "_" || boardId === "") {
            $listMsg.text("Pickup a board above").show();
        } else {
            $listMsg.text("Loading...").show();
        }

        self.event.fire("onBoardChanged", { boardId: boardId });

        self.validateData();
    });

    jQuery("#addTrelloCard", this.$popup).click(function () {
        if (self.validateData()) {
            //jQuery('#addTrelloCard', this.$popup).attr('disabled', 'disabled');
            self.$popupContent.hide();
            self.showMessage("Submiting new card...");
            self.event.fire("onSubmit");
        }
    });

    //this.bindEventHiddenEmails();
};

Gmail2Trello.PopupView.prototype.bindData = function (data) {
    var self = this;

    this.data = data;

    //log(data.gmail);

    this.$popupMessage.hide();
    this.$popupContent.show();

    //bind trello data
    var user = data.trello.user;
    var strUserAvatarHtml = "";
    if (user.avatarUrl)
        strUserAvatarHtml =
            '<img class="member-avatar" src="' + user.avatarUrl + '"/>';
    else
        strUserAvatarHtml =
            '<span class="member-avatar">' +
            user.username.substr(0, 1).toUpperCase() +
            "</span>";
    var strUserHtml =
        '<a class="item" href="' +
        user.url +
        '" target="_blank">' +
        strUserAvatarHtml +
        '</a> \
            <a class="item" href="' +
        user.url +
        '" target="_blank">' +
        user.username +
        '</a>   \
            <span class="item">|</span> \
            <a class="item signOutButton" href="javascript:void(0)">Logout?</a>';

    jQuery(".userinfo", this.$popup).html(strUserHtml);

    jQuery(".signOutButton", this.$popup).click(function () {
        self.showMessage(
            'Sorry! I have not known yet :(. You may try the following: \
            <ol><li>Press Ctrl+Shift+Delete to open up "Clear browsing data" window</li> \
            <li>Choose "Clear data from hosted apps"</li> \
            <li>Proceed the "Clear browsing data" button</li> \
            </ol> \
            <a href="javascript:void(0)" class="hideMsg">Hide me</a>'
        );
        jQuery(".hideMsg").click(function () {
            self.hideMessage();
        });
    });

    var orgs = data.trello.orgs;

    var strOptions = '<option value="all">All</option>';
    for (var i = 0; i < orgs.length; i++) {
        var item = orgs[i];
        strOptions +=
            '<option value="' + item.id + '">' + item.displayName + "</option>";
    }
    var $org = jQuery("#g2tOrg", this.$popup);
    $org.html(strOptions);
    $org.val("all");

    this.updateBoards();

    if (data.settings.hasOwnProperty("useBacklink")) {
        jQuery("#chkBackLink", this.$popup).prop(
            "checked",
            data.settings.useBacklink
        );
    }

    if (data.settings.hasOwnProperty("selfAssign")) {
        jQuery("#chkSelfAssign", this.$popup).prop(
            "checked",
            data.settings.selfAssign
        );
    }
};

Gmail2Trello.PopupView.prototype.bindGmailData = function (data) {
    //auto bind gmail data
    jQuery("#g2tTitle", this.$popup).val(data.subject);
    //log(data.body);
    jQuery("#g2tDesc", this.$popup).val(data.body);
    //jQuery('#g2tDesc', this.$popup)[0].value = data.body;

    this.dataDirty = false;
};

Gmail2Trello.PopupView.prototype.showMessage = function (text) {
    this.$popupMessage.html(text).show();
};

Gmail2Trello.PopupView.prototype.hideMessage = function (text) {
    this.$popupMessage.hide();
};

Gmail2Trello.PopupView.prototype.updateBoards = function () {
    var $org = jQuery("#g2tOrg", this.$popup);
    var orgId = $org.val();

    var orgs = this.data.trello.orgs;
    var filteredOrgs = [];

    if (orgId === "all") filteredOrgs = orgs;
    else {
        for (var i = 0; i < orgs.length; i++) {
            if (orgs[i].id == orgId) filteredOrgs.push(orgs[i]);
        }
    }

    var boards = this.data.trello.boards;

    var strOptions = '<option value="">Please select ... </option>';
    for (var i = 0; i < filteredOrgs.length; i++) {
        var orgItem = filteredOrgs[i];
        if (i > 0 && filteredOrgs && filteredOrgs.length > 1)
            strOptions += '<option value="_">-----</option>';
        for (var j = 0; j < boards.length; j++) {
            if (boards[j].idOrganization == orgItem.id) {
                var item = boards[j];
                strOptions +=
                    '<option value="' +
                    item.id +
                    '">' +
                    orgItem.displayName +
                    " &raquo; " +
                    item.name +
                    "</option>";
            }
        }
    }
    var $board = jQuery("#g2tBoard", this.$popup);
    $board.html(strOptions);

    var settings = this.data.settings;
    if (settings.orgId && settings.orgId == orgId && settings.boardId) {
        var settingId = this.data.settings.boardId;
        for (var i = 0; i < boards.length; i++) {
            var item = boards[i];
            if (item.id == settingId) {
                $board.val(settingId);
                break;
            }
        }
    }

    $board.change();
};

Gmail2Trello.PopupView.prototype.updateLists = function () {
    var self = this;
    var lists = this.data.trello.lists;
    var strOptions = "";
    for (var i = 0; i < lists.length; i++) {
        var item = lists[i];
        //        strOptions += '<option value="' + item.id + '">' + item.name + '</option>';
        strOptions += '<li value="' + item.id + '">' + item.name + "</li>";
        //            if (item.id == saveSettingId)
        //                saveSettingFound = true;
    }

    jQuery("#g2tListMsg", this.$popup).hide();
    jQuery("#g2tList", this.$popup).html(strOptions).show();

    var listControl = new MenuControl("#g2tList li");
    listControl.event.addListener("onMenuClick", function (e, params) {
        self.validateData();
    });

    var settings = this.data.settings;
    var orgId = jQuery("#g2tOrg", this.$popup).val();
    var boardId = jQuery("#g2tBoard", this.$popup).val();
    if (
        settings.orgId &&
        settings.orgId == orgId &&
        settings.boardId &&
        settings.boardId == boardId &&
        settings.listId
    ) {
        var settingId = settings.listId;
        for (var i = 0; i < lists.length; i++) {
            var item = lists[i];
            if (item.id == settingId) {
                jQuery('#g2tList li[value="' + item.id + '"]').click();
                break;
            }
        }
    }
    //select 1st list item
    else jQuery("#g2tList li:first").click();
};

Gmail2Trello.PopupView.prototype.stopWaitingHiddenThread = function () {
    if (this.waitingHiddenThreadProcId !== null) {
        this.waitingHiddenThread = false;
        this.waitingHiddenThreadRetries = 0;
        clearInterval(this.waitingHiddenThreadProcId);
    }
};

Gmail2Trello.PopupView.prototype.bindEventHiddenEmails = function () {
    var self = this;
    // update gmail thread on click
    jQuery("#g2tTitle", this.$popup).change(function () {
        self.dataDirty = true;
    });
    jQuery("#g2tDesc", this.$popup).change(function () {
        self.dataDirty = true;
    });

    log("debug hidden threads");
    this.$expandedEmails
        .parent()
        .find("> .kx,> .kv,> .kQ,> .h7")
        .click(function () {
            if (self.$popup.css("display") === "none") return;

            log("Hidden email thread clicked");
            log(this.classList);
            if (self.dataDirty) return;

            if (this.classList.contains("kx") || this.classList.contains("kQ"))
                return;
            else self.parseData();

            self.waitingHiddenThreadRetries = 10;
            self.waitingHiddenThreadElement = this;

            if (!self.waitingHiddenThread) {
                //loading, give it a change
                self.waitingHiddenThread = true;
                self.waitingHiddenThreadProcId = setInterval(function () {
                    log(
                        "waitingHiddenThread. round " +
                            self.waitingHiddenThreadRetries
                    );
                    var elm = self.waitingHiddenThreadElement;
                    if (
                        elm.classList.contains("h7") ||
                        elm.classList.contains("kv")
                    ) {
                        self.stopWaitingHiddenThread();
                        self.parseData();
                    }
                    if (self.waitingHiddenThreadRetries > 0)
                        self.waitingHiddenThreadRetries--;
                    else self.stopWaitingHiddenThread();
                }, 1000);
            }
        });
    //jQuery(this.selectors.hiddenEmails).click(function() {
    //log(this.classList);
    //    if (!self.dataDirty)
    //        self.parseData();
    //});
};

Gmail2Trello.PopupView.prototype.validateData = function () {
    var newCard = {};
    var orgId = jQuery("#g2tOrg", this.$popup).val();
    var boardId = jQuery("#g2tBoard", this.$popup).val();
    var listId = jQuery("#g2tList li.active", this.$popup).attr("value");
    var due = jQuery("#g2tDue", this.$popup).val();
    var title = jQuery("#g2tTitle", this.$popup).val();
    var description = jQuery("#g2tDesc", this.$popup).val();
    var useBacklink = jQuery("#chkBackLink", this.$popup).is(":checked");
    var selfAssign = jQuery("#chkSelfAssign", this.$popup).is(":checked");
    var timeStamp = jQuery(".gH .gK .g3:first", this.$visibleMail).attr(
        "title"
    );

    var validateStatus = boardId && listId && title;
    log("validateData: " + boardId + " - " + listId);

    if (validateStatus) {
        newCard = {
            orgId: orgId,
            boardId: boardId,
            listId: listId,
            due: due,
            title: title,
            description: description,
            useBacklink: useBacklink,
            selfAssign: selfAssign,
            timeStamp: timeStamp,
        };
        this.data.newCard = newCard;
    }
    jQuery("#addTrelloCard", this.$popup).attr("disabled", !validateStatus);

    return validateStatus;
};

Gmail2Trello.PopupView.prototype.reset = function () {
    this.$popupMessage.hide();
    this.$popupContent.show();
};

Gmail2Trello.PopupView.prototype.displaySubmitCompleteForm = function () {
    var data = this.data.newCard;
    log(this.data);
    this.showMessage(
        'A Trello card has been added <br /> <br /> \
        <a href="' +
            data.url +
            '" target="_blank">' +
            data.title +
            "</a>" +
            "<br /><br /><hr />"
    );

    this.$popupContent.hide();
};
