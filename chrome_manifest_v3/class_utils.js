var G2T = G2T || {}; // must be var to guarantee correct scope

class Utils {
  constructor(args) {
    this.app = args.app;
    // Remove local state - use centralized app state
    // storageHashes moved to app.persist.storageHashes
  }

  /**
   * Refresh debug mode from Chrome storage
   */
  refreshDebugMode() {
    this.app.chrome.storageSyncGet('debugMode', response => {
      this.app.temp.log.debugMode = response?.debugMode || false;
    });
  }

  /**
   * Log function. A wrapper for console.log, depends on logEnabled flag
   * @param  {any} data data to write log
   */
  log(data) {
    // Initialize log state if not exists
    if (!this.app.temp.log) {
      this.app.temp.log = {
        memory: [],
        count: 0,
        max: 100,
        debugMode: false,
      };
    }

    let l = this.app.temp.log;

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
        window.console.log(data);
      }
    } else {
      return (
        l.memory.slice(l.count).join('\n') +
        l.memory.slice(0, l.count).join('\n')
      );
    }
  }

  static get ck() {
    // class keys here to assure they're treated like consts
    const ck = {
      id: 'g2t_utils',
    };
    return ck;
  }

  get ck() {
    return Utils.ck;
  }

  /**
   * Load data from chrome storage
   */
  loadFromChromeStorage(keyId, fire_on_done = '') {
    this.app.chrome.storageSyncGet(keyId, response => {
      const jsonData = response?.[keyId];
      const result = jsonData ? JSON.parse(jsonData) : '';

      // Store hash of loaded data for future comparison
      if (jsonData) {
        this.app.persist.storageHashes[keyId] = this.djb2Hash(jsonData);
      }

      if (fire_on_done) {
        this.app.events.fire(fire_on_done, result);
      }
    });
  }

  /**
   * Save data to chrome storage with hash-based throttling
   */
  saveToChromeStorage(keyId, data) {
    // Stringify once and reuse
    const jsonData = JSON.stringify(data);
    const dataHash = this.djb2Hash(jsonData);

    // Check if we have a stored hash for this key
    const storedHash = this.app.persist.storageHashes[keyId];
    if (storedHash === dataHash) {
      return; // No changes, don't save
    }

    // Update stored hash and save data
    this.app.persist.storageHashes[keyId] = dataHash;

    this.app.chrome.storageSyncSet({ [keyId]: jsonData });
  }

  /**
   * Correctly escape RegExp
   */
  escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
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
    if (!text || text.length === 0) {
      // this.log('Require text!');
      return text;
    }

    if (!dict || Object.keys(dict).length === 0) {
      this.log('replacer: Require dictionary!');
      return text;
    }

    let result = text;
    let runaway_max = 3;
    while (result.indexOf('%') !== -1 && runaway_max-- > 0) {
      Object.entries(dict).forEach(([key, value]) => {
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
   * Sort markdown elements by length (largest to smallest)
   */
  markdownify_sortByLength(a, b) {
    return b.length - a.length;
  }

  /**
   * Process each element during markdown sorting
   */
  markdownify_onSortEach(context, value) {
    const replace = context.toProcess[value];
    const swap = `${context.placeholder}${(context.count++).toString()}`;
    const regex = new RegExp(
      context.regexp.begin + this.escapeRegExp(value) + context.regexp.end,
      'gi'
    );
    const replaced = context.body.replace(regex, `%${swap}%`); // Replace occurrence with placeholder
    if (context.body !== replaced) {
      context.replacer_dict[swap] = replace;
      return replaced;
    }
    return context.body;
  }

  /**
   * Process each element during markdown processing
   */
  markdownify_onElementEach(context, replaceText) {
    const text = ($(this).text() || '').trim();
    if (text && text.length > context.min_text_length) {
      const replace = this.replacer(replaceText, { text });
      context.toProcess[text.toLowerCase()] = replace; // Intentionally overwrites duplicates
    }
  }

  /**
   * Process headers during markdown processing
   */
  markdownify_onHeaderEach(context) {
    const text = ($(this).text() || '').trim();
    const nodeName = $(this).prop('nodeName') || '0';
    if (nodeName && text && text.length > context.min_text_length) {
      const x = nodeName.substr(-1);
      context.toProcess[text.toLowerCase()] = `\n${'#'.repeat(x)} ${text}\n`; // Intentionally overwrites duplicates
    }
  }

  /**
   * Process links during markdown processing
   */
  markdownify_onLinkEach(context) {
    const text = ($(this).text() || '').trim();
    const href = ($(this).prop('href') || '').trim(); // Was attr
    if (href && text && text.length >= context.min_text_length) {
      context.toProcess[text.toLowerCase()] = this.anchorMarkdownify(
        text,
        href
      ); // Intentionally overwrites duplicates
    }
  }

  /**
   * Check if a markdown feature is enabled
   */
  markdownify_featureEnabled(features, elementTag = '') {
    return features === false ? false : features?.[elementTag] !== false;
  }

  /**
   * Sort and placeholderize markdown elements
   */
  markdownify_sortAndPlaceholderize(context) {
    if (context.toProcess) {
      Object.keys(context.toProcess)
        .sort(this.markdownify_sortByLength.bind(this))
        .forEach(this.markdownify_onSortEach.bind(this, context));
    }
  }

  /**
   * Process markdown for a specific element tag
   */
  markdownify_processMarkdown(context, features, elementTag, replaceText) {
    if (this.markdownify_featureEnabled(features, elementTag)) {
      $(elementTag, context.$html).each(
        this.markdownify_onElementEach.bind(this, context, replaceText)
      );
    }
  }

  /**
   * Repeat replace until no more changes or max attempts reached
   */
  markdownify_repeatReplace(context, inRegexp, replaceWith) {
    let replaced = context.body;
    let attempts = 0;
    while (
      replaced !== context.body &&
      attempts < context.max_replace_attempts
    ) {
      context.body = replaced;
      replaced = context.body.replace(inRegexp, replaceWith);
      attempts++;
    }
    return replaced;
  }

  /**
   * Markdownify a text block
   */
  markdownify($emailBody, features, preprocess) {
    if (!$emailBody || $emailBody.length < 1) {
      this.log('markdownify: Require emailBody!');
      return;
    }

    // Create markdownify context with all constants and state
    let context = {
      // Constants
      placeholder: 'g2t_placeholder:',
      regexp: {
        begin: '(^|\\s+|<|\\[|\\(|\\b|(?=\\W+))',
        end: '($|\\s+|>|\\]|\\)|\\b|(?=\\W+))',
      },
      min_text_length: 4,
      max_replace_attempts: 10,

      // State variables
      count: 0,
      replacer_dict: {},
      $html: $emailBody || '',
      body: $emailBody.html() || '',
      toProcess: {},
    };

    // Different encodings handle CRLF differently, so we'll process the main body as html and convert to text:
    // Convert paragraph marker to two returns:
    let replaced = context.body.replace(
      /\s*[\n\r]*<p[^>]*>\s*[\n\r]*/g,
      '\n\n'
    );
    context.body = replaced;

    // Convert br marker to one return:
    replaced = context.body.replace(/\s*[\n\r]*<br[^>]*>\s*[\n\r]*/g, '\n');
    context.body = replaced;

    // Remove all other html markers:
    replaced = context.body.replace(/<[^>]*>/g, '');
    context.body = replaced;

    // Decode HTML entities:
    replaced = this.decodeEntities(context.body);
    context.body = replaced;

    // Replace hr:
    replaced = context.body.replace(/\s*-{3,}\s*/g, '---\n');
    context.body = replaced;

    // Convert crlf x 2 (or more) to paragraph markers:
    replaced = context.body.replace(/(\s*[\n\r]\s*){2,}/g, '<p />\n');
    context.body = replaced;

    // Pass 1: Collect tagged items
    this.markdownify_processMarkdown(context, features, 'h1', '**%text%**');
    this.markdownify_processMarkdown(context, features, 'h2', '**%text%**');
    this.markdownify_processMarkdown(context, features, 'h3', '**%text%**');
    this.markdownify_processMarkdown(context, features, 'h4', '**%text%**');
    this.markdownify_processMarkdown(context, features, 'h5', '**%text%**');
    this.markdownify_processMarkdown(context, features, 'h6', '**%text%**');
    this.markdownify_processMarkdown(context, features, 'strong', '**%text%**');
    this.markdownify_processMarkdown(context, features, 'b', '**%text%**');
    this.markdownify_processMarkdown(context, features, 'em', '*%text%*');
    this.markdownify_processMarkdown(context, features, 'i', '*%text%*');
    this.markdownify_processMarkdown(context, features, 'u', '__%text%__');
    this.markdownify_processMarkdown(context, features, 'strike', '~~%text%~~');
    this.markdownify_processMarkdown(context, features, 's', '~~%text%~~');
    this.markdownify_processMarkdown(context, features, 'del', '~~%text%~~');
    this.markdownify_processMarkdown(
      context,
      features,
      'a',
      this.anchorMarkdownify.bind(this)
    );

    // Process links separately
    if (this.markdownify_featureEnabled(features, 'a')) {
      $('a', context.$html).each(
        this.markdownify_onLinkEach.bind(this, context)
      );
    }

    // Pass 2: Remove duplicates and sort by length
    this.markdownify_sortAndPlaceholderize(context);

    // Pass 3: Replace with final text
    context.body = this.replacer(context.body, context.replacer_dict);

    // Clean up the body:
    // Replace bullets with asterisks:
    replaced = context.body.replace(/\s*[\n\r]+\s*[·-]+\s*/g, '<p />* '); // = [\u00B7\u2022]
    context.body = replaced;

    // Replace remaining bullets with asterisks:
    replaced = context.body.replace(/[·]/g, '*');
    context.body = replaced;

    // ORDER MATTERS FOR THIS NEXT SET:
    // (1) Replace <space>CRLF<space> with just CR:
    replaced = context.body.replace(/\s*[\n\r]+\s*/g, '\n');
    context.body = replaced;

    // (2) Replace 2 or more spaces with just one:
    replaced = this.markdownify_repeatReplace(
      context,
      new RegExp('\\s{2,}', 'g'),
      ' '
    );
    context.body = replaced;

    // (3) Replace paragraph markers with CR+CR:
    replaced = context.body.replace(/\s*<p \/>\s*/g, '\n\n');
    context.body = replaced;

    // (4) Replace 3 or more CRs with just two:
    replaced = this.markdownify_repeatReplace(
      context,
      new RegExp('\\n{3,}', 'g'),
      '\n\n'
    );
    context.body = replaced;

    // (5) Trim excess at beginning and end:
    replaced = context.body.trim();
    context.body = replaced;

    return context.body;
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
    Object.entries(dict_k).forEach(
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

  // Event binding
  bindEvents() {
    // No events to bind
  }

  init() {
    // Utils initialization if needed
    this.bindEvents();
    // State is loaded centrally by app
  }
}

// Assign class to namespace
G2T.Utils = Utils;

// End, class_utils.js
