var Gmail2Trello = Gmail2Trello || {};

class Gmail2TrelloModel {
    constructor() {
        this.trello = {
            apiKey: "c50413b23ee49ca49a5c75ccf32d0459",
            user: null,
            orgs: null,
            boards: null,
        };
        this.settings = {};
        this.isInitialized = false;
        this.event = new EventTarget();
        this.newCard = null;
    }

    retrieveSettings() {
        const settingsJson = localStorage["userSettings"];

        if (!settingsJson) {
            return {};
        }

        return JSON.parse(settingsJson);
    }

    initTrello() {
        log("initTrelloData()");

        this.trello.user = this.trello.orgs = this.trello.boards = null;

        Trello.setKey(this.trello.apiKey);
        Trello.authorize({
            interactive: false,
            success: () => {
                this.event.fire("onAuthorized");
                this.loadTrelloData();
            },
        });

        if (!Trello.authorized()) {
            this.event.fire("onBeforeAuthorize");

            Trello.authorize({
                type: "popup",
                name: "Gmail to Trello",
                persit: true,
                scope: { read: true, write: true },
                expiration: "never",
                success: (data) => {
                    log("Trello authorization successfully");
                    log(data);
                    this.event.fire("onAuthorized");
                    this.loadTrelloData();
                },
                error: () => {
                    this.event.fire("onAuthenticateFailed");
                },
            });
        } else {
            //log(Trello);
            //log(Trello.token());
        }
    }

    loadTrelloData() {
        log("loading trello data");

        this.event.fire("onBeforeLoadTrello");
        this.trello.user = null;

        // get user's info
        log("Getting user info");
        Trello.get("members/me", {}, (data) => {
            this.trello.user = data;

            if (!data || !data.hasOwnProperty("id")) return false;

            // get user orgs
            this.trello.orgs = [{ id: -1, displayName: "My Boards" }];
            if (
                data.hasOwnProperty("idOrganizations") &&
                data.idOrganizations.length > 0
            ) {
                log("Getting user orgs");
                Trello.get(
                    "members/me/organizations",
                    { fields: "displayName" },
                    (data) => {
                        log(data);
                        for (let i = 0; i < data.length; i++) {
                            this.trello.orgs.push(data[i]);
                        }
                        this.checkTrelloDataReady();
                    }
                );
            }

            // get boards list, including orgs
            if (data.hasOwnProperty("idBoards") && data.idBoards.length > 0) {
                log("Getting user boards");
                this.trello.boards = null;
                Trello.get(
                    "members/me/boards",
                    { fields: "closed,name,idOrganization" },
                    (data) => {
                        for (let i = 0; i < data.length; i++) {
                            if (data[i].idOrganization === null)
                                data[i].idOrganization = -1;
                        }
                        log(data);
                        this.trello.boards = data;
                        this.checkTrelloDataReady();
                    }
                );
            }

            this.checkTrelloDataReady();
        });
    }

    checkTrelloDataReady() {
        if (
            this.trello.user !== null &&
            this.trello.orgs !== null &&
            this.trello.boards !== null
        ) {
            // yeah! the data is ready
            //log('checkTrelloDataReady: YES');
            //log(this);
            this.event.fire("onTrelloDataReady");
        }
        //else log('checkTrelloDataReady: NO');
    }

    loadTrelloLists(boardId) {
        log("loadTrelloLists");

        this.trello.lists = null;

        Trello.get(
            "boards/" + boardId,
            { lists: "open", list_fields: "name" },
            (data) => {
                /*
             var saveSettingId = null;
             var saveSettingFound = false;
             
             if (this.userSettings !== null) {
             saveSettingId = this.userSettings.listId;
             log('Found userSettings.listId');
             log(saveSettingId);
             }
             */
                this.trello.lists = data.lists;
                this.event.fire("onLoadTrelloListSuccess");

                //        listNode.html(strOptions).show();
                //        msgNode.hide();

                //        if (saveSettingFound)
                //            listNode.val(saveSettingId);
                //        listNode.change();

                //this.validateData();
            }
        );
    }

    submit() {
        if (this.newCard === null) {
            log("Submit data is empty");
            return false;
        }
        const data = this.newCard;

        if (data.useBacklink) {
            const email = this.userEmail.replace("@", "\\@");
            const txtDirect =
                "[" +
                email +
                "](" +
                document.location.href +
                ' "Direct link to creator\'s email, not acccessible from anyone else")';

            //subject = subject.replace('"', '');
            //subject = subject.replace(' ', '+');
            // https://mail.google.com/mail/u/1/#advanced-search/subset=all&has=Bug&within=1d&date=nov+14?compose=14269f3a0707acb9
            // <span id=":1v" class="g3" title="Mon, Nov 18, 2013 at 11:20 AM" alt="Mon, Nov 18, 2013 at 11:20 AM">11:20 AM (2 hours ago)</span>
            // //*[@id=":1v"]
            const subject = encodeURIComponent(data.title);

            //parse date
            log("parsing time");
            log(data.timeStamp);
            let dateSearch = data.timeStamp
                ? data.timeStamp.replace("at", "").trim()
                : null;
            dateSearch = dateSearch ? Date.parse(dateSearch) : null;
            dateSearch = dateSearch ? dateSearch.toString("MMM d, yyyy") : null;
            log(dateSearch);

            let txtSearch = "";
            if (dateSearch) {
                data.date = dateSearch;
                dateSearch = encodeURIComponent(dateSearch);
                txtSearch +=
                    "[Search](https://mail.google.com/mail/#advanced-search/subset=all&has=" +
                    subject +
                    "&within=1d&date=" +
                    dateSearch +
                    ' "Advance search by email subject and time")';
            } else
                txtSearch +=
                    "[Search](https://mail.google.com/mail/#search/" +
                    subject +
                    ' "Search by email subject")';

            data.description +=
                "\n\n---\nImported from Gmail: " + txtDirect + " | " + txtSearch;
            //after:2013/11/17 before:2013/11/20
            //#advanced-search/subset=all&has=bug&within=1d&date=Nov+18%2C+2013
            //
            //log(this.data.desc);
            //https://mail.google.com/mail/u/1/#advanced-search/subset=all&has=%5BTiki.vn+Bug&within=1d&date=nov+18%2C+2013
        }

        //save settings
        localStorage["userSettings"] = JSON.stringify({
            orgId: data.orgId,
            boardId: data.boardId,
            listId: data.listId,
            useBacklink: data.useBacklink,
            selfAssign: data.selfAssign,
        });

        let idMembers = null;
        if (data.selfAssign) {
            idMembers = this.trello.user.id;
        }
        //
        //submit data
        const card = {
            name: data.title,
            desc: data.description,
            idList: data.listId,
            idMembers: idMembers,
        };
        if (data.due) card.due = data.due;
        Trello.post("cards", card, (data) => {
            this.event.fire("onSubmitComplete", { data: data });
            log(data);
            //setTimeout(() => {this.popupNode.hide();}, 10000);
        });

        //    log(data);
    }

    init() {
        this.isInitialized = true;

        // load user settings
        this.settings = this.retrieveSettings();
        logEnabled = true;
        if (this.settings) {
            if (this.settings.orgId == "-1") this.settings.orgId = "all";
            log("Here are user settings:");
            log(this.settings);
        }
        // init Trello
        this.initTrello();

        return true;
    }
}

// Assign the class to the global namespace for backward compatibility
Gmail2Trello.Model = Gmail2TrelloModel;