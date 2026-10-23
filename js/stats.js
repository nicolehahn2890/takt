/* Takt: Statistik als reine Logik: Koerperbereiche, Trainingszeit eines Eintrags, Zeitraeume */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';

  /* Reihenfolge = Gleichstand-Regel beim haeufigsten Bereich */
  T.AREAS = [
    { key: 'core', label: 'Core & Vacuum', color: '#C6C5A6', tags: ['vacuum', 'core'] },
    { key: 'bauch', label: 'Bauch', color: '#BE7B9D', tags: ['bauch'] },
    { key: 'beine', label: 'Beine & Po', color: '#C4A882', tags: ['beine-po'] },
    { key: 'ruecken', label: 'R\u00fccken', color: '#8AB4C4', tags: ['ruecken'] },
    { key: 'dehnen', label: 'Dehnen', color: '#A8C4A0', tags: ['dehnen'] },
    { key: 'yoga', label: 'Yoga', color: '#B794C5', tags: ['yoga'] },
    { key: 'atmung', label: 'Atmung', color: '#E2A9C4', tags: ['atmung'] },
    { key: 'ganz', label: 'Ganzk\u00f6rper', color: '#E3A3BF', tags: ['ganzkoerper', 'oberkoerper'] }
  ];
  var OTHER = { key: 'sonst', label: 'Sonstiges', color: '#a8949f', tags: [] };

  function areaByTag(tag) {
    for (var i = 0; i < T.AREAS.length; i++) if (T.AREAS[i].tags.indexOf(tag) >= 0) return T.AREAS[i].key;
    return null;
  }
  T.areaInfo = function (key) {
    return T.AREAS.filter(function (a) { return a.key === key; })[0] || OTHER;
  };

  /* Erster Tag der Uebung, der zu einem Bereich gehoert; nur Aufwaermen zaehlt als Ganzkoerper */
  T.areaOf = function (ex) {
    var tags = ex && Array.isArray(ex.tags) ? ex.tags : [];
    for (var i = 0; i < tags.length; i++) {
      var k = areaByTag(tags[i]);
      if (k) return k;
    }
    return tags.indexOf('aufwaermen') >= 0 ? 'ganz' : 'sonst';
  };

  /* Sekunden je Bereich aus den tatsaechlich gelaufenen Uebungen (ohne Pausen und Vorbereitung) */
  T.areaSeconds = function (steps, spentSec, exIndex) {
    var out = {};
    (steps || []).forEach(function (s, i) {
      var sec = Math.round(Number(spentSec && spentSec[i]) || 0);
      if (!s || s.kind !== 'work' || sec <= 0) return;
      var key = T.areaOf(s.exId && exIndex ? exIndex[s.exId] : null);
      out[key] = (out[key] || 0) + sec;
    });
    return out;
  };

  function okNum(v) { return typeof v === 'number' && isFinite(v) && v >= 0; }
  /* Trainingszeit eines Protokoll-Eintrags: ohne Pausieren, wenn bekannt (ab Teil B), sonst Zeit seit Start */
  T.entrySeconds = function (e) {
    if (!e) return 0;
    if (okNum(e.activeSec)) return Math.round(e.activeSec);
    if (okNum(e.actualSec)) return Math.round(e.actualSec);
    return 0;
  };
  T.entryValid = function (e) { return !!e && (okNum(e.activeSec) || okNum(e.actualSec)); };
})(window.Takt);
