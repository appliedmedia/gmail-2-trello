/**
 * MenuControl - ES6 Class Version
 * @depend class_eventtarget.js
 */

var G2T = G2T || {}; // must be var to guarantee correct scope

class MenuControl {
  constructor(args) {
    this.app = args.app;
    this._state = {};
  }

  static get id() {
    return 'g2t_menuControl';
  }

  get id() {
    return MenuControl.id;
  }

  get state() {
    return this._state;
  }

  set state(newState) {
    this._state = newState;
  }

  loadState() {
    const fire_on_done = 'classMenuControlStateLoaded';
    this.app.utils.loadFromChromeStorage(this.id, fire_on_done);
  }

  saveState() {
    this.app.utils.saveToChromeStorage(this.id, this.state);
  }

  init() {
    this.bindEvents();
    this.reset();
    this.loadState();
  }

  handleClassMenuControlLoadStateDone(event, params) {
    if (params?.data) {
      this.state = params.data;
    }
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
    this.app.events.addListener(
      'classMenuControlLoadStateDone',
      this.handleClassMenuControlLoadStateDone.bind(this)
    );
  }
}

// Assign class to namespace
G2T.MenuControl = MenuControl;

// End, class_menuControl.js
