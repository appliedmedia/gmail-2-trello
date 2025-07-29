// Ensure namespace is declared before any use
var G2T = G2T || {}; // must be var to guarantee correct scope - do not alter this line

/**
 * WaitCounter - ES6 Class Version
 * @depend class_eventtarget.js
 */

class WaitCounter {
  constructor(args) {
    this.app = args.app;
    this.items = {};
  }

  static get ck() {
    // class keys here to assure they're treated like consts
    const ck = {
      id: 'g2t_waitCounter',
    };
    return ck;
  }

  get ck() {
    return WaitCounter.ck;
  }

  stop(name) {
    if (this.items[name]) {
      const item = this.items[name];

      if (item.handler !== null) {
        clearInterval(item.handler);
        item.busy = false;
      }
    }
  }

  start(name, interval, maxSteps, callBack) {
    // TODO: replace current event to a new one
    if (!this.items[name]) {
      this.items[name] = {
        name: name,
        interval: interval,
        maxSteps: maxSteps,
        callBack: callBack,
        handler: null,
        busy: false,
        count: 0,
      };
    }

    const current = this.items[name];

    if (!current.busy) {
      current.count = 0;
      current.busy = true;

      current.handler = setInterval(() => {
        current.count++;
        this.app.utils.log(
          'WaitCounter[' + current.name + ']. Round #' + current.count,
        );

        if (current.count >= current.maxSteps) {
          clearInterval(current.handler);
          current.busy = false;
        }

        callBack();
      }, current.interval);
    }
  }
}

// Assign class to namespace
G2T.WaitCounter = WaitCounter;

// End, class_waitCounter.js
