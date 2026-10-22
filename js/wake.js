/* Takt: Bildschirm bleibt an (Screen Wake Lock). Holt sich die Sperre nach
   einem App-Wechsel automatisch zurueck, solange ein Training laeuft. */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';
  var lock = null;
  var wanted = false;

  function request() {
    if (!('wakeLock' in navigator)) return Promise.resolve(false);
    return navigator.wakeLock.request('screen').then(function (l) {
      lock = l;
      l.addEventListener('release', function () { if (lock === l) lock = null; });
      return true;
    }).catch(function () { return false; });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && wanted && !lock) request();
  });

  T.wake = {
    on: function () {
      wanted = true;
      if (lock) return Promise.resolve(true);
      return request();
    },
    off: function () {
      wanted = false;
      if (lock) { try { lock.release(); } catch (e) { /* egal */ } }
      lock = null;
    },
    active: function () { return !!lock; }
  };
})(window.Takt);
