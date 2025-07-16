// Native ES6 EventTarget wrapper for G2T.EventTarget
// Maintains same interface as original but uses native EventTarget under the hood

var G2T = G2T || {}; // Namespace initialization

class EventTarget extends globalThis.EventTarget {
  constructor() {
    super();
    this._listeners = new Map(); // Track listeners for removeListener compatibility
  }

  addListener(type, listener) {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    this._listeners.get(type).add(listener);
    
    // Create wrapper function to maintain same signature as original
    const wrapper = (event) => {
      // Convert native event to original format
      const originalEvent = {
        type: event.type,
        target: this,
        detail: event.detail
      };
      
      // Call listener with original signature: (event, params)
      listener.call(this, originalEvent, event.detail);
    };
    
    // Store wrapper for removal
    listener._wrapper = wrapper;
    this.addEventListener(type, wrapper);
  }

  fire(event, params) {
    if (typeof event === 'string') {
      // String event type - create event object
      const customEvent = new CustomEvent(event, {
        detail: params,
        bubbles: false,
        cancelable: true
      });
      customEvent.target = this;
      this.dispatchEvent(customEvent);
    } else {
      // Event object - extract type and use detail for params
      if (!event.target) {
        event.target = this;
      }
      
      const customEvent = new CustomEvent(event.type, {
        detail: params || event,
        bubbles: false,
        cancelable: true
      });
      customEvent.target = this;
      this.dispatchEvent(customEvent);
    }
  }

  removeListener(type, listener) {
    const listeners = this._listeners.get(type);
    if (listeners && listeners.has(listener)) {
      listeners.delete(listener);
      if (listener._wrapper) {
        this.removeEventListener(type, listener._wrapper);
        delete listener._wrapper;
      }
      
      // Clean up empty listener sets
      if (listeners.size === 0) {
        this._listeners.delete(type);
      }
    }
  }
}

// Assign to namespace (same as original)
G2T.EventTarget = EventTarget;