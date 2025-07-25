//Copyright (c) 2010 Nicholas C. Zakas. All rights reserved.
//MIT License

var G2T = G2T || {}; // Namespace initialization

class EventTarget {
  static get ck() {
    // class keys here to assure they're treated like consts
    const ck = {
      id: 'g2t_eventtarget',
    };
    return ck;
  }

  get ck() {
    return EventTarget.ck;
  }

  constructor(args) {
    this.app = args.app;
    this._listeners = {};
  }

  addListener(type, listener) {
    if (typeof this._listeners[type] === 'undefined') {
      this._listeners[type] = [];
    }

    this._listeners[type].push(listener);
  }

  emit(event, params) {
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
