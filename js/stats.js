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

  /* ---------- Zeitraeume (Ortszeit, Woche Mo-So, Ende exklusiv) ---------- */
  var DAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  var DAY_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  var MONTH = ['Januar', 'Februar', 'M\u00e4rz', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  var MONTH_SHORT = ['Jan.', 'Feb.', 'M\u00e4rz', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'];
  var MONTH_LETTER = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  var WORDS = {
    week: { to: 'zur Vorwoche', same: 'in der Vorwoche', none: 'Vorwoche ohne Training' },
    month: { to: 'zum Vormonat', same: 'im Vormonat', none: 'Vormonat ohne Training' },
    year: { to: 'zum Vorjahr', same: 'im Vorjahr', none: 'Vorjahr ohne Training' }
  };

  function weekday(d) { return (d.getDay() + 6) % 7; }
  function daysIn(y, m) { return new Date(y, m + 1, 0).getDate(); }

  T.periodRange = function (kind, offset, now) {
    now = now instanceof Date ? now : new Date();
    offset = Math.min(0, Math.round(Number(offset) || 0));
    var y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
    if (kind === 'month') return { start: new Date(y, m + offset, 1), end: new Date(y, m + offset + 1, 1) };
    if (kind === 'year') return { start: new Date(y + offset, 0, 1), end: new Date(y + offset + 1, 0, 1) };
    var mon = d - weekday(now) + 7 * offset;
    return { start: new Date(y, m, mon), end: new Date(y, m, mon + 7) };
  };

  /* Balken-Grenzen eines Zeitraums: Tage (Woche, Monat) oder Monate (Jahr) */
  function buckets(kind, start) {
    var out = [], y = start.getFullYear(), m = start.getMonth(), d = start.getDate(), i, n;
    if (kind === 'year') {
      for (i = 0; i < 12; i++) {
        out.push({ start: new Date(y, i, 1), end: new Date(y, i + 1, 1), label: MONTH_LETTER[i], title: MONTH[i] + ' ' + y });
      }
      return out;
    }
    n = kind === 'month' ? daysIn(y, m) : 7;
    for (i = 0; i < n; i++) {
      var s = new Date(y, m, d + i);
      out.push({ start: s, end: new Date(y, m, d + i + 1), label: kind === 'month' ? String(s.getDate()) : DAY_SHORT[i],
        title: DAY_SHORT[weekday(s)] + ', ' + s.getDate() + '. ' + MONTH_SHORT[s.getMonth()] });
    }
    return out;
  }

  function label(kind, offset, r, now) {
    if (kind === 'year') return String(r.start.getFullYear());
    if (kind === 'month') return MONTH[r.start.getMonth()] + ' ' + r.start.getFullYear();
    if (offset === 0) return 'Diese Woche';
    if (offset === -1) return 'Letzte Woche';
    var a = r.start, b = new Date(r.end.getFullYear(), r.end.getMonth(), r.end.getDate() - 1);
    var txt = a.getMonth() === b.getMonth() ? a.getDate() + '.\u2013' + b.getDate() + '. ' + MONTH_SHORT[b.getMonth()] :
      a.getDate() + '. ' + MONTH_SHORT[a.getMonth()] + '\u2013' + b.getDate() + '. ' + MONTH_SHORT[b.getMonth()];
    return b.getFullYear() !== now.getFullYear() ? txt + ' ' + b.getFullYear() : txt;
  }

  /* Ende des Vergleichsfensters der Vorperiode: laufend gleich viele Tage, sonst ganze Vorperiode */
  function prevCut(kind, prev, now, current) {
    if (!current) return prev.end;
    var py = prev.start.getFullYear(), pm = prev.start.getMonth();
    if (kind === 'week') return new Date(py, pm, prev.start.getDate() + weekday(now) + 1);
    if (kind === 'month') return new Date(py, pm, Math.min(now.getDate(), daysIn(py, pm)) + 1);
    return new Date(py, now.getMonth(), Math.min(now.getDate(), daysIn(py, now.getMonth())) + 1);
  }
  function untilText(kind, now) {
    if (kind === 'week') return ' (bis ' + DAY_LONG[weekday(now)] + ')';
    if (kind === 'month') return ' (bis zum ' + now.getDate() + '.)';
    return ' (bis ' + now.getDate() + '. ' + MONTH_SHORT[now.getMonth()] + ')';
  }

  T.periodStats = function (log, kind, offset, now) {
    now = now instanceof Date ? now : new Date();
    kind = kind === 'month' || kind === 'year' ? kind : 'week';
    offset = Math.min(0, Math.round(Number(offset) || 0));
    var current = offset === 0;
    var r = T.periodRange(kind, offset, now), prev = T.periodRange(kind, offset - 1, now);
    var cut = prevCut(kind, prev, now, current);
    var entries = (Array.isArray(log) ? log : []).filter(T.entryValid).map(function (e) {
      return { t: e.date ? new Date(e.date).getTime() : NaN, sec: T.entrySeconds(e), area: e.areaSec };
    }).filter(function (e) { return isFinite(e.t); });

    var bars = buckets(kind, r.start).map(function (b) {
      return { label: b.label, title: b.title, start: b.start, seconds: 0,
        today: current && now >= b.start && now < b.end, _end: b.end.getTime() };
    });
    var seconds = 0, count = 0, prevSeconds = 0, areas = {};
    entries.forEach(function (e) {
      if (e.t >= prev.start.getTime() && e.t < cut.getTime()) prevSeconds += e.sec;
      if (e.t < r.start.getTime() || e.t >= r.end.getTime()) return;
      seconds += e.sec;
      count++;
      for (var i = 0; i < bars.length; i++) {
        if (e.t < bars[i]._end) { bars[i].seconds += e.sec; break; }
      }
      if (e.area && typeof e.area === 'object') {
        Object.keys(e.area).forEach(function (k) { if (okNum(e.area[k])) areas[k] = (areas[k] || 0) + e.area[k]; });
      }
    });
    bars.forEach(function (b) { delete b._end; });

    var w = WORDS[kind], compare = { prevSeconds: prevSeconds, pct: null }, ring;
    if (!seconds) {
      compare.state = 'empty';
      compare.text = current ? 'Noch kein Training' : 'Kein Training';
      ring = 0;
    } else if (!prevSeconds) {
      compare.state = 'noprev';
      compare.text = w.none;
      ring = 1;
    } else {
      var pct = Math.round((seconds - prevSeconds) / prevSeconds * 100);
      compare.pct = pct;
      if (Math.abs(pct) <= 2) {
        compare.state = 'same';
        compare.text = 'gleich viel wie ' + w.same;
      } else {
        compare.state = pct > 0 ? 'up' : 'down';
        compare.text = (pct > 0 ? '+' : '\u2212') + Math.abs(pct) + ' % ' + w.to + (current ? untilText(kind, now) : '');
      }
      ring = Math.min(1, seconds / prevSeconds);
    }

    /* Haeufigster Bereich: meiste Sekunden, Gleichstand nach Reihenfolge, Sonstiges nur ohne andere */
    var total = 0, top = null;
    Object.keys(areas).forEach(function (k) { total += areas[k]; });
    T.AREAS.forEach(function (a) {
      if ((areas[a.key] || 0) > 0 && (!top || areas[a.key] > top.seconds)) top = { key: a.key, seconds: areas[a.key] };
    });
    if (!top && areas.sonst > 0) top = { key: 'sonst', seconds: areas.sonst };
    if (top && total > 0) {
      var info = T.areaInfo(top.key);
      top = { key: top.key, label: info.label, color: info.color, share: Math.round(top.seconds / total * 100), seconds: top.seconds };
    } else {
      top = null;
    }

    var selected = -1;
    if (current) bars.forEach(function (b, i) { if (b.today) selected = i; });
    else bars.forEach(function (b, i) { if (b.seconds > 0) selected = i; });

    return { label: label(kind, offset, r, now), current: current, seconds: seconds, count: count, bars: bars,
      compare: compare, ring: ring, top: top, selected: selected };
  };
})(window.Takt);
