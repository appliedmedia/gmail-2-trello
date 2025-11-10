var G2T = G2T || {}; // must be var to guarantee correct scope - do not alter this line

/**
 * Observer class - Manages MutationObservers for Gmail DOM changes
 * Provides reactive detection of Gmail UI changes (toolbar replacement, navigation, etc.)
 */
class Observer {
  static get ck() {
    // class keys here to assure they're treated like consts
    const ck = {
      id: 'g2t_observer',
    };
    return ck;
  }

  get ck() {
    return Observer.ck;
  }

  constructor(args) {
    this.app = args.app;

    // Active observers
    this.observers = {
      toolbar: null,
      content: null,
    };

    // Debounce timers
    this.debounceTimers = {
      toolbar: null,
      content: null,
    };

    // Configuration
    this.config = {
      toolbar: {
        debounceMs: 250, // Wait for Gmail to finish updates
        selector: '[gh="mtb"]', // Gmail toolbar selector
      },
      content: {
        debounceMs: 500,
        selector: '.AO', // Gmail main content area
      },
    };
  }

  /**
   * Initialize all observers
   */
  init() {
    this.app.utils.log('Observer:init');
    // Observers are set up on-demand via observeToolbar() etc.
  }

  /**
   * Set up MutationObserver to watch for Gmail toolbar changes
   * Fires 'toolbarChanged' event when toolbar DOM is replaced
   */
  observeToolbar() {
    // Don't set up multiple observers
    if (this.observers.toolbar) {
      this.app.utils.log('Observer: Toolbar observer already active');
      return;
    }

    const config = {
      childList: true, // Watch for nodes being added/removed
      subtree: true, // Watch the entire subtree
      attributes: false, // Don't care about attribute changes
    };

    const callback = mutationsList => {
      this.handleToolbarMutations(mutationsList);
    };

    try {
      this.observers.toolbar = new MutationObserver(callback);
      this.observers.toolbar.observe(document.body, config);
      this.app.utils.log('Observer: Toolbar observer initialized');
    } catch (error) {
      this.app.utils.log('Observer: Failed to setup toolbar observer:', error);
    }
  }

  /**
   * Handle toolbar mutations
   * @private
   */
  handleToolbarMutations(mutationsList) {
    const selector = this.config.toolbar.selector;
    let toolbarChanged = false;

    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        // Check removed nodes
        for (const node of mutation.removedNodes) {
          if (
            node.nodeType === 1 &&
            (node.matches?.(selector) || node.querySelector?.(selector))
          ) {
            toolbarChanged = true;
            break;
          }
        }

        // Check added nodes
        if (!toolbarChanged) {
          for (const node of mutation.addedNodes) {
            if (
              node.nodeType === 1 &&
              (node.matches?.(selector) || node.querySelector?.(selector))
            ) {
              toolbarChanged = true;
              break;
            }
          }
        }
      }

      if (toolbarChanged) break;
    }

    if (toolbarChanged) {
      this.debounceEvent('toolbar', () => {
        this.app.utils.log('Observer: Toolbar mutation detected');
        this.app.events.emit('toolbarChanged');
      });
    }
  }

  /**
   * Set up MutationObserver to watch for Gmail content area changes
   * Fires 'contentChanged' event when main content area updates
   */
  observeContent() {
    // Don't set up multiple observers
    if (this.observers.content) {
      this.app.utils.log('Observer: Content observer already active');
      return;
    }

    const config = {
      childList: true,
      subtree: true,
      attributes: false,
    };

    const callback = mutationsList => {
      this.handleContentMutations(mutationsList);
    };

    try {
      this.observers.content = new MutationObserver(callback);
      const contentArea = document.querySelector(this.config.content.selector);
      if (contentArea) {
        this.observers.content.observe(contentArea, config);
        this.app.utils.log('Observer: Content observer initialized');
      } else {
        this.app.utils.log('Observer: Content area not found, observer delayed');
      }
    } catch (error) {
      this.app.utils.log('Observer: Failed to setup content observer:', error);
    }
  }

  /**
   * Handle content area mutations
   * @private
   */
  handleContentMutations(mutationsList) {
    // Only emit if significant changes detected
    if (mutationsList.length > 0) {
      this.debounceEvent('content', () => {
        this.app.utils.log('Observer: Content area mutation detected');
        this.app.events.emit('contentChanged');
      });
    }
  }

  /**
   * Debounce event emission to prevent thrashing during rapid changes
   * @private
   */
  debounceEvent(type, callback) {
    // Clear existing timer
    if (this.debounceTimers[type]) {
      clearTimeout(this.debounceTimers[type]);
    }

    // Set new timer
    const debounceMs = this.config[type]?.debounceMs || 250;
    this.debounceTimers[type] = setTimeout(() => {
      callback();
      this.debounceTimers[type] = null;
    }, debounceMs);
  }

  /**
   * Disconnect a specific observer
   */
  disconnect(type) {
    if (this.observers[type]) {
      this.observers[type].disconnect();
      this.observers[type] = null;
      this.app.utils.log(`Observer: ${type} observer disconnected`);
    }

    if (this.debounceTimers[type]) {
      clearTimeout(this.debounceTimers[type]);
      this.debounceTimers[type] = null;
    }
  }

  /**
   * Disconnect all observers
   * Call this during extension cleanup or disable
   */
  disconnectAll() {
    this.app.utils.log('Observer: Disconnecting all observers');
    Object.keys(this.observers).forEach(type => {
      this.disconnect(type);
    });
  }

  /**
   * Get status of observers
   */
  getStatus() {
    return {
      toolbar: this.observers.toolbar !== null,
      content: this.observers.content !== null,
    };
  }
}

// Assign class to namespace
G2T.Observer = Observer;

// end, class_observer.js
