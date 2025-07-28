const dueShortcuts_k = JSON.stringify({
  today: {
    am: 'd+0 am=9:00',
    noon: 'd+0 pm=12:00',
    pm: 'd+0 pm=3:00',
    end: 'd+0 pm=6:00',
    eve: 'd+0 pm=11:00',
  },
  tomorrow: {
    am: 'd+1 am=9:00',
    noon: 'd+1 pm=12:00',
    pm: 'd+1 pm=3:00',
    end: 'd+1 pm=6:00',
    eve: 'd+1 pm=11:00',
  },
  'next monday': {
    am: 'd=monday am=9:00',
    noon: 'd=monday pm=12:00',
    pm: 'd=monday pm=3:00',
    end: 'd=monday pm=6:00',
    eve: 'd=monday pm=11:00',
  },
  'next friday': {
    am: 'd=friday am=9:00',
    noon: 'd=friday pm=12:00',
    pm: 'd=friday pm=3:00',
    end: 'd=friday pm=6:00',
    eve: 'd=friday pm=11:00',
  },
});

// Track debug mode state for change detection
let previousDebugMode = false;

// Saves options to localStorage.
function save_options() {
  // Reads options from the form and stores them in chrome.storage.
  var debugMode = document.getElementById('debugmode').checked;
  var dueShortcuts = document.getElementById('dueshortcuts').value;

  chrome.storage.sync.set({ debugMode, dueShortcuts }, () => {
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    if (debugMode !== previousDebugMode) {
      status.innerHTML =
        'Options Saved. Debug mode changes take effect immediately.';
    } else {
      status.innerHTML = 'Options saved.';
    }
    previousDebugMode = debugMode;
    setTimeout(() => {
      status.innerHTML = '&nbsp;';
    }, 3000);
  });
}

// Returns dueshortcuts to default:
function default_dueshortcuts() {
  document.getElementById('dueshortcuts').value = dueShortcuts_k;
}

// Clear cache function
function clear_cache() {
  const cacheStatus = document.getElementById('cache-status');

  chrome.runtime.sendMessage({ g2t_clear_extension_browsing_data: true });

  cacheStatus.innerHTML = 'Cache cleared.';
  setTimeout(() => {
    cacheStatus.innerHTML = '&nbsp;';
  }, 3000);
}

// Restores select box state to saved value from localStorage.
function restore_options() {
  chrome.storage.sync.get(['debugMode', 'dueShortcuts'], function (response) {
    const debugMode = response.debugMode || false;
    document.getElementById('debugmode').checked = debugMode;
    document.getElementById('dueshortcuts').value =
      response.dueShortcuts || dueShortcuts_k;

    // Track initial debug mode state for change detection
    previousDebugMode = debugMode;
  });
}

function extensionInvalidConfirmReload() {
  if (
    confirm(
      'Gmail-2-Trello extension needs to be reloaded to work correctly.\n\nReload now?',
    )
  ) {
    window.location.reload();
  }
}

document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
document
  .querySelector('#default-dueshortcuts')
  .addEventListener('click', default_dueshortcuts);
document.querySelector('#clearcache').addEventListener('click', clear_cache);
try {
  document.getElementById('g2tVersion').textContent =
    chrome.runtime.getManifest().version || 'unknown';
} catch (error) {
  extensionInvalidConfirmReload();
}

// End, options.js
