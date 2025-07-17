var G2T = G2T || {}; // must be var to guarantee correct scope

class Utils {
  constructor(args) {
    this.app = args.app;
    this._state = {};
    this.storageHashes = {};
  }

  static get ck() {
    // class keys here to assure they're treated like consts
    const cks = {
      id: 'g2t_utils',
    };
    return cks;
  }

  get ck() {
    return Utils.ck;
  }

  get state() {
    return this._state;
  }

  set state(newState) {
    this._state = newState;
  }

  loadState() {
    const fire_on_done = 'classUtilsStateLoaded';
    this.loadFromChromeStorage(this.ck.id, fire_on_done);
  }

  saveState() {
    this.saveToChromeStorage(this.ck.id, this.state);
  }

  /**
   * Load data from chrome storage
   */
  loadFromChromeStorage(keyId, fire_on_done = '') {
    try {
      chrome.storage.sync.get(keyId, response => {
        const jsonData = response?.[keyId];
        const result = jsonData ? JSON.parse(jsonData) : '';

        // Store hash of loaded data for future comparison
        if (jsonData) {
          this.storageHashes[keyId] = this.djb2Hash(jsonData);
        }

        if (fire_on_done) {
          this.app.events.fire(fire_on_done, result);
        }
      });
    } catch (error) {
      g2t_log(`Utils:loadFromChromeStorage ERROR: ${error.message}`);
    }
  }

  /**
   * Save data to chrome storage with hash-based throttling
   */
  saveToChromeStorage(keyId, data) {
    try {
      // Stringify once and reuse
      const jsonData = JSON.stringify(data);
      const dataHash = this.djb2Hash(jsonData);

      // Check if we have a stored hash for this key
      const storedHash = this.storageHashes[keyId];
      if (storedHash === dataHash) {
        return; // No changes, don't save
      }

      // Update stored hash and save data
      this.storageHashes[keyId] = dataHash;

      chrome.storage.sync.set({ [keyId]: jsonData });
    } catch (error) {
      g2t_log(`Utils:saveToChromeStorage ERROR: ${error.message}`);
    }
  }

  /**
   * Correctly escape RegExp
   */
  escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
  }

  // Callback methods for replacer
  replacer_onEach(text, value, key) {
    const regex = new RegExp(`%${this.escapeRegExp(key)}%`, 'gi');
    const replaced = text.replace(regex, value);
    return replaced;
  }

  /**
   * Utility routine to replace variables
   */
  replacer(text = '', dict = {}) {
    if (text?.length < 1) {
      // g2t_log('Require text!');
      return '';
    } else if (!dict || Object.keys(dict).length < 1) {
      g2t_log('replacer: Require dictionary!');
      return text;
    }

    let result = text;
    let runaway_max = 3;
    while (result.indexOf('%') !== -1 && runaway_max-- > 0) {
      g2t_each(dict, (value, key) => {
        result = this.replacer_onEach(result, value, key);
      });
    }

    return result;
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
        const prelude = matched[1].substr(0, uri_length_max_k);
        if (matched[1].length > uri_length_max_k) {
          uri_display = prelude + '...' + filename_k;
        } else if (filename_k.length > 0) {
          uri_display = prelude + ':' + filename_k;
        } else {
          uri_display = prelude + filename_k;
        }
      }
    }
    return uri_display;
  }

  /**
   * Simple djb2 hash function
   */
  djb2Hash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) + hash + str.charCodeAt(i);
    }
    return hash >>> 0; // unsigned 32-bit
  }

  /**
   * Remove specified fields from object and return clean copy
   */
  excludeFields(obj, fieldsToExclude) {
    const clean = {};
    const excludeSet = new Set(fieldsToExclude);

    // Copy only fields that aren't excluded
    Object.keys(obj).forEach(key => {
      if (!excludeSet.has(key)) {
        clean[key] = obj[key];
      }
    });

    return clean;
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

    let retn = '';

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
    const sortAndPlaceholderize = tooProcess => {
      if (tooProcess) {
        g2t_each(
          Object.keys(tooProcess).sort(
            this.markdownify_sortByLength.bind(this)
          ),
          this.markdownify_onSortEach.bind(
            this,
            tooProcess,
            unique_placeholder_k,
            count,
            regexp_k,
            body,
            replacer_dict
          )
        );
      }
    };

    const processMarkdown = (elementTag, replaceText) => {
      if (featureEnabled(elementTag)) {
        $(elementTag, $html).each(
          this.markdownify_onElementEach.bind(
            this,
            replaceText,
            toProcess,
            min_text_length_k
          )
        );
      }
    };

    const repeatReplace = (body, inRegexp, replaceWith) => {
      let replaced = body;
      let attempts = 0;
      while (replaced !== body && attempts < max_replace_attempts_k) {
        body = replaced;
        replaced = body.replace(inRegexp, replaceWith);
        attempts++;
      }
      return replaced;
    };

    // Pass 1: Collect tagged items
    processMarkdown('h1', '**%text%**');
    processMarkdown('h2', '**%text%**');
    processMarkdown('h3', '**%text%**');
    processMarkdown('h4', '**%text%**');
    processMarkdown('h5', '**%text%**');
    processMarkdown('h6', '**%text%**');
    processMarkdown('strong', '**%text%**');
    processMarkdown('b', '**%text%**');
    processMarkdown('em', '*%text%*');
    processMarkdown('i', '*%text%*');
    processMarkdown('u', '__%text%__');
    processMarkdown('strike', '~~%text%~~');
    processMarkdown('s', '~~%text%~~');
    processMarkdown('del', '~~%text%~~');
    processMarkdown('a', this.anchorMarkdownify.bind(this));

    // Pass 2: Remove duplicates and sort by length
    sortAndPlaceholderize(toProcess);

    // Pass 3: Replace with final text
    body = this.replacer(body, replacer_dict);

    // Clean up the body:
    // Replace bullets with asterisks:
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
    let retn = text || '';
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
    let retn = text || '';
    const add_k = this.decodeEntities(add || '');
    const max_k = Math.abs((max || 0) - add_k.length);
    const mid_k = (max_k + 0.01) / 2;

    if (text && text.length > max_k) {
      retn = text.slice(0, mid_k + 1) + add_k + text.slice(-mid_k);
    }
    return retn;
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

  // Callback methods for decodeEntities
  decodeEntities_onEach(sourceText, re, new_s, value, key) {
    // value is already available from the callback parameter
    const regex = new RegExp(this.escapeRegExp(key), 'gi');
    const replaced = sourceText.replace(regex, value);
    return replaced;
  }

  /**
   * Decode entities
   */
  decodeEntities(sourceText) {
    const dict_k = { '...': '&hellip;', '*': '&bullet;', '-': '&mdash;' };
    let re, new_s;
    g2t_each(
      dict_k,
      this.decodeEntities_onEach.bind(this, sourceText, re, new_s)
    );
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
    let retn = '';

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

  /**
   * Make avatar URL
   * NOTE (Ace@2020-04-03): 403s: "https://trello-avatars.s3.amazonaws.com/" + avatarHash + "/30.png";
   * Gravatar requires md5 hash of lowercase email address [see "https://www.gravatar.com/site/implement/images/"]:
   * "https://www.gravatar.com/avatar/" + gravatarHash + ".jpg?s=30";
   * avatarUrl return format is "https://trello-members.s3.amazonaws.com/{member-id}/{member-avatar-hash}/30.png"
   */
  makeAvatarUrl(args) {
    return args?.avatarUrl ? `${args.avatarUrl}/30.png` : '';
  }

  // Callback methods for markdownify
  markdownify_sortByLength(a, b) {
    // Go by order of largest to smallest
    return b.length - a.length;
  }

  markdownify_onSortEach(
    tooProcess,
    unique_placeholder_k,
    count,
    regexp_k,
    body,
    replacer_dict,
    value
  ) {
    const replace = tooProcess[value];
    const swap = `${unique_placeholder_k}${(count++).toString()}`;
    const regex = new RegExp(
      regexp_k.begin + this.escapeRegExp(value) + regexp_k.end,
      'gi'
    );
    const replaced = body.replace(regex, `%${swap}%`); // Replace occurance with placeholder
    if (body !== replaced) {
      replacer_dict[swap] = replace;
      return replaced;
    }
    return body;
  }

  markdownify_onElementEach(
    replaceText,
    toProcess,
    min_text_length_k,
    index,
    value
  ) {
    const text = ($(this).text() || '').trim();
    if (text && text.length > min_text_length_k) {
      const replace = this.replacer(replaceText, { text });
      toProcess[text.toLowerCase()] = replace; // Intentionally overwrites duplicates
    }
  }

  markdownify_onHeaderEach(toProcess, min_text_length_k, index, value) {
    const text = ($(this).text() || '').trim();
    const nodeName = $(this).prop('nodeName') || '0';
    if (nodeName && text && text.length > min_text_length_k) {
      const x = nodeName.substr(-1);
      toProcess[text.toLowerCase()] = `\n${'#'.repeat(x)} ${text}\n`; // Intentionally overwrites duplicates
    }
  }

  markdownify_onLinkEach(toProcess, min_text_length_k, index, value) {
    const text = ($(this).text() || '').trim();
    const href = ($(this).prop('href') || '').trim(); // Was attr
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

  // Event handlers
  handleClassUtilsStateLoaded(event, params) {
    this.state = params || {};
  }

  // Event binding
  bindEvents() {
    this.app.events.addListener(
      'classUtilsStateLoaded',
      this.handleClassUtilsStateLoaded.bind(this)
    );
  }

  init() {
    // Utils initialization if needed
    this.bindEvents();
    this.loadState();
  }
}

// Assign class to namespace
G2T.Utils = Utils;

// End, class_utils.js
