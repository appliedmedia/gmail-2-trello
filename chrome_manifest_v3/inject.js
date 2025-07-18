/***
 * This function is injected into the page for the content-script to receive information
 */
setTimeout(function () {
  let userEmail = '?';
  if (typeof GLOBALS !== 'undefined') {
    userEmail = GLOBALS[10];
  } else if (
    typeof window !== 'undefined' &&
    window.opener !== null &&
    typeof window.opener.GLOBALS !== 'undefined'
  ) {
    userEmail = window.opener.GLOBALS[10];
  }
  const G2T_event = new CustomEvent('g2t_connect_extension', {
    detail: { userEmail },
  });
  document.dispatchEvent(G2T_event);
}, 0);
