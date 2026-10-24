/* Takt: Atem-Modus als reine Logik. Die Atem-Uhr einer Uebung beginnt nach der Namensansage;
   Toene: heller Ton zu Beginn von Einatmen ("in"), tiefer zu Beginn von Ausatmen ("out"), Halten ohne Ton. */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';

  T.BREATH_DELAY = 2000;

  /* Zeit der Atem-Uhr zur Schrittzeit (ms); <= 0 heisst: Atmen hat noch nicht begonnen */
  T.breathClock = function (elapsedMs, delay) {
    return elapsedMs - (delay == null ? T.BREATH_DELAY : delay);
  };

  /* Ton-Zeitpunkte im halboffenen Intervall (fromMs, toMs] der Schrittzeit */
  T.breathCues = function (atem, fromMs, toMs, delay) {
    delay = delay == null ? T.BREATH_DELAY : delay;
    var parts = [['in', atem && atem.ein], [null, atem && atem.halten], ['out', atem && atem.aus], [null, atem && atem.haltenLeer]]
      .map(function (p) { return [p[0], Math.max(0, Number(p[1]) || 0) * 1000]; })
      .filter(function (p) { return p[1] > 0; });
    var total = parts.reduce(function (s, p) { return s + p[1]; }, 0);
    if (!total || !(toMs > fromMs)) return [];
    var out = [];
    for (var k = Math.max(0, Math.floor((fromMs - delay) / total)); ; k++) {
      var base = delay + k * total;
      if (base > toMs) break;
      var off = 0;
      parts.forEach(function (p) {
        var at = base + off;
        if (p[0] && at > fromMs && at <= toMs) out.push({ atMs: at, tone: p[0] });
        off += p[1];
      });
    }
    return out;
  };
})(window.Takt);
