/* Takt: Bildschirm bleibt an (Screen Wake Lock). Holt sich die Sperre nach
   einem App-Wechsel automatisch zurueck, solange ein Training laeuft. */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';
  var lock = null;
  var wanted = false;
  var pending = null;   // laufende Anfrage (nie zwei gleichzeitig)

  function request() {
    if (!('wakeLock' in navigator)) return Promise.resolve(false);
    if (pending) return pending;
    pending = navigator.wakeLock.request('screen').then(function (l) {
      pending = null;
      // Kam inzwischen off() (z. B. Training endete beim Entsperren): gleich wieder freigeben
      if (!wanted) { try { l.release(); } catch (e) { /* egal */ } return false; }
      lock = l;
      l.addEventListener('release', function () { if (lock === l) lock = null; });
      return true;
    }).catch(function () { pending = null; return false; });
    return pending;
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
    }
  };
})(window.Takt);
