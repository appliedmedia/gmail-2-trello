/**
 * MenuControl - ES6 Class Version
 * @depend class_eventtarget.js
 */

var G2T = G2T || {}; // must be var to guarantee correct scope

class MenuControl {
  constructor(args) {
    this.app = args.app;
    this.items = null;
    this.nonexclusive = false;
  }

  init() {
    this.reset();
  }

  reset(args = {}) {
    const { selectors, nonexclusive = false } = args;

    if (!selectors) {
      g2t_log('MenuControl: missing required selectors');
      return;
    }

    this.items = jQuery(selectors);
    this.nonexclusive = nonexclusive;

    for (let i = 0; i < this.items.length; i++) {
      this.items[i].menuIndex = i;
    }

    this.bindEvents();
  }

  bindEvents() {
    // Bind click events
    this.items.click(event => {
      const newIndex = event.currentTarget.menuIndex;

      if (this.nonexclusive === true) {
        $(event.currentTarget).toggleClass('active');
      } else {
        $(event.currentTarget)
          .addClass('active')
          .siblings()
          .removeClass('active');
      }

      this.app.events.fire('onMenuClick', {
        target: event.currentTarget,
        index: newIndex,
      });
    });
  }
}

// Assign class to namespace
G2T.MenuControl = MenuControl;

// End, class_menuControl.js
