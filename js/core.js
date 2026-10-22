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

  /* Hoerbarer Bereich einer Aufnahme in Sekunden (Stille vorn/hinten weg, kleiner Rand) */
  T.silenceBounds = function (samples, sampleRate, threshold, padSec) {
    var thr = threshold == null ? 0.01 : threshold;
    var pad = padSec == null ? 0.03 : padSec;
    var total = samples.length / sampleRate;
    var first = -1, last = -1;
    for (var i = 0; i < samples.length; i++) {
      if (Math.abs(samples[i]) > thr) { if (first < 0) first = i; last = i; }
    }
    if (first < 0) return { start: 0, end: total };
    return {
      start: Math.max(0, first / sampleRate - pad),
      end: Math.min(total, (last + 1) / sampleRate + pad)
    };
  };

  T.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
})(window.Takt);
