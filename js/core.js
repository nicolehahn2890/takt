/* Takt: Namensraum und kleine Helfer */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';
  var counter = 0;

  /* Sekunden als m:ss, negative Werte als 0:00 */
  T.fmt = function (sec) {
    var s = Math.floor(Number(sec) || 0);
    if (s < 0) s = 0;
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  };

  T.uid = function (prefix) {
    counter++;
    return (prefix || '') + Date.now().toString(36) + counter.toString(36) +
      Math.random().toString(36).slice(2, 6);
  };

  T.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
})(window.Takt);
