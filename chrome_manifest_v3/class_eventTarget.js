//Copyright (c) 2010 Nicholas C. Zakas. All rights reserved.
//MIT License

var G2T = G2T || {}; // Namespace initialization

class EventTarget {
  constructor(args) {
    this.app = args.app;
    this._state = {
      listeners: {},
    };
  }

  static get id() {
    return 'g2t_eventtarget';
  }

  get id() {
    return EventTarget.id;
  }

  get state() {
    return this._state;
  }

  set state(newState) {
    this._state = newState;
  }

  loadState() {
    this.app.utils.loadFromChromeStorage(this.id);
  }

  saveState() {
    this.app.utils.saveToChromeStorage(this.id, this.state);
  }

  async init() {
    // Load state first
    await this.loadState();

    this._listeners = this.state.listeners;
  }

  addListener(type, listener) {
    if (typeof this._listeners[type] === 'undefined') {
      this._listeners[type] = [];
    }

    this._listeners[type].push(listener);
  }

  fire(event, params) {
    if (typeof event === 'string') {
      event = { type: event };
    }
    if (!event.target) {
      event.target = this;
    }

    if (!event.type) {
      //falsy
      throw new Error("Event object missing 'type' property.");
    }

    if (this._listeners[event.type] instanceof Array) {
      var listeners = this._listeners[event.type];
      for (var i = 0, len = listeners.length; i < len; i++) {
        listeners[i].call(this, event, params);
      }
    }
  }

  removeListener(type, listener) {
    if (this._listeners[type] instanceof Array) {
      var listeners = this._listeners[type];
      for (var i = 0, len = listeners.length; i < len; i++) {
        if (listeners[i] === listener) {
          listeners.splice(i, 1);
          break;
        }
      }
    }
  }
}

// Assign to namespace
G2T.EventTarget = EventTarget;

// end, eventTarget.js
