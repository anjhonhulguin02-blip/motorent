/* Boot guard — swaps the loading splash to a "No Connection" state when the app
   can't start. Deliberately a plain, separate script rather than inline: the
   site's CSP is `script-src 'self'`, which blocks inline execution, and it must
   also survive the app bundle itself failing to download — which is exactly the
   no-connection case it exists to report. */
(function () {
  var handled = false;

  // The app counts as booted once React has rendered into #root. Checking this
  // rather than trusting navigator.onLine — which some browsers report as false
  // on a perfectly good connection — is what stops a false "No Connection"
  // screen from covering a working page.
  function appBooted() {
    var root = document.getElementById('root');
    return !!(root && root.children.length > 0);
  }

  function showBootSplashError() {
    if (handled) return;
    if (appBooted()) return;
    var splash = document.getElementById('boot-splash');
    if (!splash || splash.classList.contains('boot-splash-hide')) return;
    handled = true;
    var content = splash.querySelector('.boot-splash-content');
    if (!content) return;

    content.innerHTML =
      '<svg class="boot-splash-error-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#eaa974" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<line x1="1" y1="1" x2="23" y2="23"></line>' +
      '<path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>' +
      '<path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>' +
      '<path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>' +
      '<path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>' +
      '<path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>' +
      '<line x1="12" y1="20" x2="12.01" y2="20"></line>' +
      '</svg>' +
      '<p class="boot-splash-error-title">No Connection</p>' +
      '<p class="boot-splash-error-msg">We couldn\'t reach MotoRent. Please check your internet connection and try again.</p>' +
      '<button type="button" class="boot-splash-retry-btn">Retry</button>';

    // Bound here rather than via an onclick attribute, which the CSP also blocks.
    var retry = content.querySelector('.boot-splash-retry-btn');
    if (retry) {
      retry.addEventListener('click', function () {
        window.location.reload();
      });
    }
  }

  // Every path gives the app a grace period to finish booting first, so a brief
  // network blip or a stale onLine flag never hides a page that is about to work.
  if (!navigator.onLine) setTimeout(showBootSplashError, 2500);
  window.addEventListener('offline', function () {
    setTimeout(showBootSplashError, 1500);
  });
  setTimeout(showBootSplashError, 10000);
})();
