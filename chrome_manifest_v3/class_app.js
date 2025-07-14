/** Gmail2Trello Application - ES6 Class Version
 */

var Gmail2Trello = Gmail2Trello || {}; // Namespace initialization - must be var to guarantee correct scope

class App {
  constructor() {
    this.CHROME_SETTINGS_ID = 'g2t_user_settings';
    this.UNIQUE_URI_VAR = 'g2t_filename';

    this.model = new Gmail2Trello.Model(this);
    this.gmailView = new Gmail2Trello.GmailView(this);
    this.popupView = new Gmail2Trello.PopupView(this);

    this.bindEvents();
  }

  bindEvents() {
    /*** Data's events binding ***/
    this.model.event.addListener('onBeforeAuthorize', this.handleBeforeAuthorize.bind(this));
    this.model.event.addListener('onAuthorizeFail', this.handleAuthorizeFail.bind(this));
    this.model.event.addListener('onAuthorized', this.handleAuthorized.bind(this));
    this.model.event.addListener('onBeforeLoadTrello', this.handleBeforeLoadTrello.bind(this));
    this.model.event.addListener('onTrelloDataReady', this.handleTrelloDataReady.bind(this));
    this.model.event.addListener('onLoadTrelloListSuccess', this.handleLoadTrelloListSuccess.bind(this));
    this.model.event.addListener('onLoadTrelloCardsSuccess', this.handleLoadTrelloCardsSuccess.bind(this));
    this.model.event.addListener('onLoadTrelloLabelsSuccess', this.handleLoadTrelloLabelsSuccess.bind(this));
    this.model.event.addListener('onLoadTrelloMembersSuccess', this.handleLoadTrelloMembersSuccess.bind(this));
    this.model.event.addListener('onCardSubmitComplete', this.handleCardSubmitComplete.bind(this));
    this.model.event.addListener('onAPIFailure', this.handleAPIFailure.bind(this));

    /*** PopupView's events binding ***/
    this.popupView.event.addListener('onPopupVisible', this.handlePopupVisible.bind(this));
    this.popupView.event.addListener('periodicChecks', this.handlePeriodicChecks.bind(this));
    this.popupView.event.addListener('onBoardChanged', this.handleBoardChanged.bind(this));
    this.popupView.event.addListener('onListChanged', this.handleListChanged.bind(this));
    this.popupView.event.addListener('onSubmit', this.handleSubmit.bind(this));
    this.popupView.event.addListener('checkTrelloAuthorized', this.handleCheckTrelloAuthorized.bind(this));
    this.popupView.event.addListener('onRequestDeauthorizeTrello', this.handleRequestDeauthorizeTrello.bind(this));
    this.popupView.event.addListener('detectButton', this.handleDetectButton.bind(this));

    // GMailView's events:
    this.gmailView.event.addListener('onDetected', this.handleGmailDetected.bind(this));
    this.gmailView.event.addListener('detectButton', this.handleDetectButton.bind(this));

    chrome.runtime.onMessage.addListener(this.handleRuntimeMessage.bind(this));
  }

  // Event handler methods
  handleBeforeAuthorize() {
    this.popupView.bindData(''); // Intentionally blank
    this.popupView.showMessage(this, 'Authorizing...');
  }

  handleAuthorizeFail() {
    this.popupView.showMessage(
      this,
      'Trello authorization failed <button id="showsignout">Sign out and try again</button>'
    );
  }

  handleAuthorized() {
    this.popupView.$popupContent.show();
    this.popupView.hideMessage();
  }

  handleBeforeLoadTrello() {
    this.popupView.showMessage(this, 'Loading Trello data...');
  }

  handleTrelloDataReady() {
    this.popupView.$popupContent.show();
    this.popupView.hideMessage();
    this.popupView.bindData(this.model);
  }

  handleLoadTrelloListSuccess() {
    this.popupView.updateLists();
    this.popupView.validateData();
  }

  handleLoadTrelloCardsSuccess() {
    this.popupView.updateCards();
    this.popupView.validateData();
  }

  handleLoadTrelloLabelsSuccess() {
    this.popupView.updateLabels();
    this.popupView.validateData();
  }

  handleLoadTrelloMembersSuccess() {
    this.popupView.updateMembers();
    this.popupView.validateData();
  }

  handleCardSubmitComplete(target, params) {
    this.popupView.displaySubmitCompleteForm();
    // If card lists or labels have been updated, reload:
    const data_k = params?.data || {};
    const emailId = data_k?.emailId || 0;
    const boardId_k = data_k?.data?.board?.id || 0;
    const listId_k = data_k?.data?.list?.id || 0;
    const cardId_k = data_k?.data?.card?.id || 0;
    const idBoard_k = data_k?.idBoard || 0;
    const idList_k = data_k?.idList || 0;
    const idCard_k = data_k?.idCard || 0;
    const boardId = boardId_k || idBoard_k || 0;
    const listId = listId_k || idList_k || 0;
    const cardId = cardId_k || idCard_k || 0;
    // NOTE (acoven@2020-05-23): Users expect when creating a brand new card,
    // we'll remember that new card ID and then keep defaulting to it for
    // subsequent updates to that email. That means we'll have to get the return
    // value/url from Trello and dissect that, potentially doing this update
    // in that routine:
    this.model.emailBoardListCardMapUpdate({
      emailId,
      boardId,
      listId,
      cardId,
    });

    if (boardId) {
      this.model.loadTrelloLabels(boardId);
      this.model.loadTrelloMembers(boardId);
    }
    if (listId) {
      this.model.loadTrelloCards(listId);
    }
  }

  handleAPIFailure(target, params) {
    this.popupView.displayAPIFailedForm(params);
  }

  handlePopupVisible() {
    if (!this.model.isInitialized) {
      this.popupView.showMessage(this, 'Initializing...');
      this.popupView.$popupContent.hide();
      this.model.init();
    } else {
      this.popupView.reset();
    }

    const trelloUser_k = this?.model?.trello?.user || {};
    const fullName = trelloUser_k?.fullName || '';

    this.gmailView.parsingData = false;
    this.model.gmail = this.gmailView.parseData({ fullName });
    this.popupView.bindGmailData(this.model.gmail);
    this.popupView.event.fire('periodicChecks');
  }

  handlePeriodicChecks() {
    setTimeout(() => {
      this.popupView.periodicChecks();
    }, 3000);
  }

  handleBoardChanged(target, params) {
    const boardId = params.boardId;
    if (boardId !== '_' && boardId !== '' && boardId !== null) {
      this.model.loadTrelloLists(boardId);
      this.model.loadTrelloLabels(boardId);
      this.model.loadTrelloMembers(boardId);
    }
  }

  handleListChanged(target, params) {
    const listId = params.listId;
    this.model.loadTrelloCards(listId);
  }

  handleSubmit() {
    this.model.submit();
  }

  handleCheckTrelloAuthorized() {
    this.popupView.showMessage(this, 'Authorizing...');
    this.model.checkTrelloAuthorized();
  }

  handleRequestDeauthorizeTrello() {
    g2t_log('onRequestDeauthorizeTrello');
    this.model.deauthorizeTrello();
    this.popupView.clearBoard();
  }

  handleDetectButton() {
    if (this.gmailView.preDetect()) {
      this.popupView.$toolBar = this.gmailView.$toolBar;
      this.popupView.confirmPopup();
    }
  }

  handleGmailDetected() {
    this.popupView.$toolBar = this.gmailView.$toolBar;
    this.popupView.init();
  }

  handleRuntimeMessage(request, sender, sendResponse) {
    if (request?.message === 'g2t_keyboard_shortcut') {
      this.popupView.showPopup();
    }
  }

  updateData() {
    const fullName = this?.model?.trello?.user?.fullName || '';

    this.popupView.bindData(this.model);

    this.gmailView.parsingData = false;
    this.model.gmail = this.gmailView.parseData({ fullName });
    this.popupView.bindGmailData(this.model.gmail);
  }

  init() {
    this.model.isInitialized = false;

    // g2t_log('App:initialize');

    this.gmailView.detect();

    service = analytics.getService('gmail-2-trello');

    // Get a Tracker using your Google Analytics app Tracking ID.
    tracker = service.getTracker('G-0QPEDL7YDL'); // Was: UA-8469046-1 -> UA-42442437-4

    // Record an "appView" each time the user launches your app or goes to a new
    // screen within the app.
    tracker.sendAppView('PopupView');
  }

  /**
   * Correctly escape RegExp
   */
  escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
  }

  /**
   * Utility routine to replace variables
   */
  replacer(text, dict) {
    if (!text || text.length < 1) {
      // g2t_log('Require text!');
      return '';
    } else if (!dict || dict.length < 2) {
      g2t_log('replacer: Require dictionary!');
      return text;
    }

    let re, new_text;
    const replacify = () => {
      g2t_each(dict, this.replacer_onEach.bind(this, text, re, new_text));
    };

    let runaway_max = 3;
    while (text.indexOf('%') !== -1 && runaway_max-- > 0) {
      replacify();
    }

    return text;
  }

  replacer_onEach(text, re, new_text, value, key) {
    re = new RegExp(`%${this.escapeRegExp(key)}%`, 'gi');
    new_text = text.replace(re, value);
    text = new_text;
  }

  /**
   * Make displayable URI
   */
  uriForDisplay(uri) {
    const uri_display_trigger_length_k = 20;
    const uri_length_max_k = 40;
    let uri_display = uri || '';
    if (uri_display.length > uri_display_trigger_length_k) {
      const re = RegExp('^\\w+://([\\w./_-]+).*?([\\w._-]*)$');
      const matched = uri_display.match(re);
      if (matched && matched.length > 1) {
        const filename_k =
          matched[2].length < uri_length_max_k
            ? matched[2]
            : matched[2].slice(-uri_length_max_k);
        let prelude = matched[1].substr(0, uri_length_max_k);
        if (matched[1].length > uri_length_max_k) {
          prelude += '...';
        } else if (filename_k.length > 0) {
          prelude += ':';
        }

        uri_display = prelude + filename_k;
      }
    }
    return uri_display;
  }

  /**
   * Make anchored backlink
   */
  anchorMarkdownify(text, href, comment) {
    const text1 = (text || '').trim();
    const text1lc = text1.toLowerCase();
    const href1 = (href || '').trim();
    const href1lc = href1.toLowerCase();
    const comment1 = (comment || '').trim();

    const retn = '';

    if (text1.length < 1 && href1.length < 1) {
      // Intetionally blank
    } else if (text1lc === href1lc) {
      retn = ` <${href1}> `; // This renders correctly in Trello as a sole URL
      // NOTE (Ace, 17-Feb-2017): Turns out Trello doesn't support markdown [] only, so we'll construct a nice displayable text vs url:
      // text1 = this.uriForDisplay(text1);
    } else if (`mailto:${text1lc}` === href1lc) {
      retn = ` <${text1}> `; // This renders correctly in Trello as a mailto: url
    } else {
      const comment1QuotedSpaced = comment1.length > 0 ? ` "${comment1}"` : '';
      retn = ` [${text1}](<${href1}>${comment1QuotedSpaced}) `;
    }

    return retn;
  }

  /**
   * Split an email into name and domain
   */
  splitEmailDomain(email = '') {
    const split = email.split('@');
    const name = split[0] || '';
    const domain = split[1] || '';
    return {
      name,
      domain,
    };
  }

  /**
   * Add trailing char if not empty:
   */
  addChar(front = '', back = '', addChar = ' ') {
    if (front.length > 0) {
      if (back.length > 0) {
        return `${front}${addChar}${back}`;
      } else {
        return `${front}${addChar}`;
      }
    } else if (back.length > 0) {
      return `${addChar}${back}`;
    } else {
      return '';
    }
  }

  /**
   * Add trailing space if not empty:
   */
  addSpace(front = '', back = '') {
    return this.addChar(front, back, ' ');
  }

  /**
   * Add trailing CRLF if not empty:
   */
  addCRLF(front = '', back = '') {
    return this.addChar(front, back, '\n');
  }

  /**
   * Markdownify a text block
   */
  markdownify($emailBody, features, preprocess) {
    if (!$emailBody || $emailBody.length < 1) {
      g2t_log('markdownify: Require emailBody!');
      return;
    }

    const min_text_length_k = 4;
    const max_replace_attempts_k = 10;
    const regexp_k = {
      begin: '(^|\\s+|<|\\[|\\(|\\b|(?=\\W+))',
      end: '($|\\s+|>|\\]|\\)|\\b|(?=\\W+))',
    };
    const unique_placeholder_k = 'g2t_placeholder:'; // Unique placeholder tag

    let count = 0;
    let replacer_dict = {};

    const featureEnabled = (elementTag = '') =>
      features === false ? false : features?.[elementTag] !== false;

    const $html = $emailBody || ''; // Was: $emailBody.innerHTML || "";
    // let body = $emailBody.text() || "";
    let body = $emailBody.html() || '';

    // Different encodings handle CRLF differently, so we'll process the main body as html and convert to text:
    // Convert paragraph marker to two returns:
    let replaced = body.replace(/\s*[\n\r]*<p[^>]*>\s*[\n\r]*/g, '\n\n');
    body = replaced;

    // Convert br marker to one return:
    replaced = body.replace(/\s*[\n\r]*<br[^>]*>\s*[\n\r]*/g, '\n');
    body = replaced;

    // Remove all other html markers:
    replaced = body.replace(/<[^>]*>/g, '');
    body = replaced;

    // Decode HTML entities:
    replaced = this.decodeEntities(body);
    body = replaced;

    // Replace hr:
    replaced = body.replace(/\s*-{3,}\s*/g, '---\n');
    body = replaced;

    // Convert crlf x 2 (or more) to paragraph markers:
    replaced = body.replace(/(\s*[\n\r]\s*){2,}/g, '<p />\n');
    body = replaced;

    let toProcess = {};

    /**
     * 5 explicit steps in 3 passes:
     * (1) Collect tagged items
     * (2) Remove duplicates
     * (3) Sort force-lowercase by length
     * (4) Replace with placeholder
     * (5) Replace placeholders with final text
     */
    const sortAndPlaceholderize = (tooProcess) => {
      if (tooProcess) {
        g2t_each(
          Object.keys(tooProcess).sort(this.markdownify_sortByLength.bind(this)),
          this.markdownify_onSortEach.bind(this, tooProcess, unique_placeholder_k, count, regexp_k, body, replacer_dict)
        );
      }
    };
    const processMarkdown = (elementTag, replaceText) => {
      if (elementTag && replaceText && featureEnabled(elementTag)) {
        toProcess = preprocess[elementTag] || {};
        $(elementTag, $html).each(this.markdownify_onElementEach.bind(this, replaceText, toProcess, min_text_length_k));
        sortAndPlaceholderize(toProcess);
      }
    };
    /**
     * Repeat replace for max attempts or when done, whatever comes first
     */
    const repeatReplace = (body, inRegexp, replaceWith) => {
      let replace1 = '';
      for (let iter = max_replace_attempts_k; iter > 0; iter--) {
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
    processMarkdown('ul li', '<p />* %text%<p />');

    // numeric lists:
    // ol li -> " 1. "
    processMarkdown('ol li', '<p />1. %text%<p />');

    // headers:
    // H1 -> #
    // H2 -> ##
    // H3 -> ###
    // H4 -> ####
    // H5 -> #####
    // H6 -> ######
    if (featureEnabled('h')) {
      toProcess = preprocess['h'] || {};
      $(':header', $html).each(this.markdownify_onHeaderEach.bind(this, toProcess, min_text_length_k));
      sortAndPlaceholderize(toProcess);
    }

    replaced = this.replacer(body, replacer_dict); // Replace initial batch of <div> like placeholders
    body = replaced;
    replacer_dict = {}; // Reset
    count = 0; // Reset

    // bold: b -> **text**
    processMarkdown('b', ' **%text%** ');

    // italics: i -> _text_
    processMarkdown('i', ' _%text%_ ');

    // links:
    // a -> [text](html)
    if (featureEnabled('a')) {
      toProcess = preprocess['a'] || {};
      $('a', $html).each(this.markdownify_onLinkEach.bind(this, toProcess, min_text_length_k));
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
    replaced = body.replace(/\s*[\n\r]+\s*[·-]+\s*/g, '<p />* '); // = [\u00B7\u2022]
    body = replaced;

    // Replace remaining bullets with asterisks:
    replaced = body.replace(/[·]/g, '*');
    body = replaced;

    // ORDER MATTERS FOR THIS NEXT SET:
    // (1) Replace <space>CRLF<space> with just CR:
    replaced = body.replace(/\s*[\n\r]+\s*/g, '\n');
    body = replaced;

    // (2) Replace 2 or more spaces with just one:
    replaced = repeatReplace(body, new RegExp('\\s{2,}', 'g'), ' ');
    body = replaced;

    // (3) Replace paragraph markers with CR+CR:
    replaced = body.replace(/\s*<p \/>\s*/g, '\n\n');
    body = replaced;

    // (4) Replace 3 or more CRs with just two:
    replaced = repeatReplace(body, new RegExp('\\n{3,}', 'g'), '\n\n');
    body = replaced;

    // (5) Trim excess at beginning and end:
    replaced = body.trim();
    body = replaced;

    return body;
  }

  /**
   * Determine luminance of a color so we can augment with darker/lighter background
   */
  luminance(color) {
    const bkColorLight = 'lightGray'; // or white
    const bkColorDark = 'darkGray'; // 'gray' is even darker
    let bkColorReturn = bkColorLight;

    const re = new RegExp('rgb\\D+(\\d+)\\D+(\\d+)\\D+(\\d+)');
    const matched = color.match(re, 'i');
    if (matched && matched.length > 2) {
      // 0 is total string:
      const r = matched[1];
      const g = matched[2];
      const b = matched[3];
      // var 1 = matched[4]; // if alpha is provided

      let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

      if (luma < 40) {
        bkColorReturn = bkColorDark;
      } else {
        bkColorReturn = bkColorLight;
      }
    } else {
      bkColorReturn = bkColorLight; // RegExp failed, assume dark color
    }

    return 'inherit'; // Use: bkColorReturn if you want to adjust background based on text perceived brightness
  }

  /**
   * HTML bookend a string
   */
  bookend(bookend, text, style) {
    return (
      '<' +
      bookend +
      (style ? ' style="' + style + '"' : '') +
      '>' +
      (text || '') +
      '</' +
      bookend +
      '>'
    );
  }

  /**
   * Get selected text
   * http://stackoverflow.com/questions/5379120/get-the-highlighted-selected-text
   */
  getSelectedText() {
    let text = '';
    const activeEl = document.activeElement;
    const activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
    if (
      (activeElTagName === 'textarea' || activeElTagName === 'input') &&
      /^(?:text|search|password|tel|url)$/i.test(activeEl.type) &&
      typeof activeEl.selectionStart === 'number'
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
  }

  /**
   * Truncate a string
   */
  truncate(text, max, add) {
    const retn = text || '';
    const add_k = this.decodeEntities(add || '');
    const max_k = max - add_k.length;

    if (text && text.length > max_k) {
      retn = text.slice(0, max_k) + add_k;
    }
    return retn;
  }

  /***
   * Middle-truncate a string
   */
  midTruncate(text, max, add) {
    const retn = text || '';
    const add_k = this.decodeEntities(add || '');
    const max_k = Math.abs((max || 0) - add_k.length);
    const mid_k = (max_k + 0.01) / 2;

    if (text && text.length > max_k) {
      retn = text.slice(0, mid_k + 1) + add_k + text.slice(-mid_k);
    }
    return retn;
  }

  /**
   * Load settings
   */
  loadSettings(popup) {
    const setID = this.CHROME_SETTINGS_ID;
    chrome.storage.sync.get(setID, this.loadSettings_onSuccess.bind(this, popup));
  }

  /**
   * Save settings
   */
  saveSettings() {
    const setID = this.CHROME_SETTINGS_ID;
    const { description, title, attachments, images, ...settings } = this.popupView.data.settings;

    const settings_string_k = JSON.stringify(settings);

    let hash = {};
    hash[setID] = settings_string_k;

    if (this.lastSettingsSave !== settings_string_k) {
      try {
        chrome.storage.sync.set(hash); // NOTE (Ace, 7-Feb-2017): Might need to store these off the app object
        this.lastSettingsSave = settings_string_k;
      } catch (error) {
        g2t_log(
          `saveSettings ERROR: extension context invalidated - failed "chrome.storage.sync.set"`
        );
        this?.popupView?.displayExtensionInvalidReload();
      }
    }
  }

  /**
   * Encode entities
   */
  encodeEntities(sourceText) {
    const ta = document.createElement('textarea');
    ta.value = sourceText;
    return ta.innerHTML;
    // jQuery way, less safe: return $("<textarea />").text(sourceText).html();
  }

  /**
   * Decode entities
   */
  decodeEntities(sourceText) {
    const dict_k = { '...': '&hellip;', '*': '&bullet;', '-': '&mdash;' };
    let re, new_s;
    g2t_each(dict_k, this.decodeEntities_onEach.bind(this, sourceText, re, new_s));
    try {
      new_s = decodeURIComponent(sourceText);
      sourceText = new_s;
    } catch (e) {
      // Didn't work. Ignore.
    }
    const ta = document.createElement('textarea');
    ta.style.cssText = 'white-space: pre-line;';
    ta.innerHTML = sourceText;
    return ta.value;
    // jQuery way, less safe: return $("<textarea />").html(sourceText).text();
  }

  /**
   * Check for ctrl/alt/shift down:
   */
  modKey(event) {
    const retn = '';

    if (event.ctrlKey) {
      retn = 'ctrl-';
      if (event.ctrlLeft) {
        retn = 'left';
      }
    } else if (event.altKey) {
      retn = 'alt-';
      if (event.altLeft) {
        retn = 'left';
      }
    } else if (event.shiftKey) {
      retn = 'shift-';
      if (event.shiftLeft) {
        retn += 'left';
      }
    } else if (event.metaKey) {
      retn = 'metakey-';
      if (window.navigator.platform.indexOf('Mac') !== -1) {
        retn += 'clover';
      } else {
        retn += 'windows';
      }
    }

    // If the string is partial, then it was the right-side key:
    if (retn.slice(-1) === '-') {
      retn += 'right';
    }

    return retn;
  }

  url_add_var(url_in = '', var_in = '') {
    let add = '';
    if (url_in && url_in.length && var_in && var_in.length) {
      add = '&';
      if (url_in.indexOf('?') === -1) {
        add = '?';
      }
    }

    return url_in + add + var_in;
  }

  // Callback methods for replacer
  replacer_onEach(text, re, new_text, value, key) {
    re = new RegExp(`%${this.escapeRegExp(key)}%`, 'gi');
    new_text = text.replace(re, value);
    text = new_text;
  }

  // Callback methods for markdownify
  markdownify_sortByLength(a, b) {
    // Go by order of largest to smallest
    return b.length - a.length;
  }

  markdownify_onSortEach(tooProcess, unique_placeholder_k, count, regexp_k, body, replacer_dict, value) {
    const replace = tooProcess[value];
    const swap = `${unique_placeholder_k}${(count++).toString()}`;
    const re = new RegExp(
      regexp_k.begin + this.escapeRegExp(value) + regexp_k.end,
      'gi'
    );
    const replaced = body.replace(re, `%${swap}%`); // Replace occurance with placeholder
    if (body !== replaced) {
      body = replaced;
      replacer_dict[swap] = replace;
    }
  }

  markdownify_onElementEach(replaceText, toProcess, min_text_length_k, index, value) {
    let text = ($(this).text() || '').trim();
    if (text && text.length > min_text_length_k) {
      const replace = this.replacer(replaceText, { text: text });
      toProcess[text.toLowerCase()] = replace; // Intentionally overwrites duplicates
    }
  }

  markdownify_onHeaderEach(toProcess, min_text_length_k, index, value) {
    let text = ($(this).text() || '').trim();
    let nodeName = $(this).prop('nodeName') || '0';
    if (nodeName && text && text.length > min_text_length_k) {
      const x = nodeName.substr(-1);
      toProcess[text.toLowerCase()] = `\n${'#'.repeat(x)} ${text}\n`; // Intentionally overwrites duplicates
    }
  }

  markdownify_onLinkEach(toProcess, min_text_length_k, index, value) {
    let text = ($(this).text() || '').trim();
    let href = ($(this).prop('href') || '').trim(); // Was attr
    /*
      var uri_display = this.uriForDisplay(href);
      var comment = ' "' + text + ' via ' + uri_display + '"';
      var re = new RegExp(this.escapeRegExp(text), "i");
      if (uri.match(re)) {
          comment = ' "Open ' + uri_display + '"';
      }
      */
    if (href && text && text.length >= min_text_length_k) {
      toProcess[text.toLowerCase()] = this.anchorMarkdownify(text, href); // Comment seemed like too much extra text // Intentionally overwrites duplicates
    }
  }

  // Callback methods for loadSettings
  loadSettings_onSuccess(popup, response) {
    const setID = this.CHROME_SETTINGS_ID;
    if (response?.[setID]) {
      // NOTE (Ace, 7-Feb-2017): Might need to store these off the app object:
      try {
        this.popupView.data.settings = JSON.parse(response[setID]);
      } catch (err) {
        g2t_log(
          'loadSettings: JSON parse failed! Error: ' + JSON.stringify(err)
        );
      }
    }
    if (popup) {
      popup.init_popup();
      this.updateData();
    }
  }

  // Callback methods for decodeEntities
  decodeEntities_onEach(sourceText, re, new_s, value, key) {
    // value is already available from the callback parameter
    re = new RegExp(this.escapeRegExp(key), 'gi');
    new_s = sourceText.replace(re, value);
    sourceText = new_s;
  }
}

// End, class_app.js