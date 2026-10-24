/* Takt: Abzeichen-Regeln. Rechnet aus Protokoll und Workouts, welche Abzeichen erreicht sind
   und wann (Zeitpunkt des Trainings, das sie erfuellt hat). Einmal erreicht bleibt erreicht. */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';

  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function themeKeys() { return T.WORKOUT_THEMES || []; }

  /* "24. Okt. 2026" */
  T.badgeDate = function (iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.getDate() + '. ' + (T.MONTH_SHORT || [])[d.getMonth()] + ' ' + d.getFullYear();
  };

  /* Runde Plakette mit Zahl oder Wort; erreicht in der Abzeichen-Farbe, sonst grau */
  T.badgeHtml = function (b, on, tag, cls, style) {
    tag = tag || 'div';
    return '<' + tag + ' class="bdg' + (on ? ' on' : '') + (cls ? ' ' + cls : '') + '"' + (tag === 'button' ? ' data-badge="' + T.esc(b.id) + '"' : '') +
      ' style="--bc:' + b.color + (style ? ';' + style : '') + '"><i class="' + (b.face.length > 3 ? 'w' : '') + '">' + T.esc(b.face) + '</i><span>' + T.esc(b.title) + '</span></' + tag + '>';
  };

  /* Thema eines Trainings; alte Eintraege ohne Thema bekommen es vom Workout */
  function themeOf(e, data) {
    if (themeKeys().indexOf(e.theme) >= 0) return e.theme;
    var w = (data.workouts || []).concat(T.TEMPLATES || []).filter(function (x) { return x && x.id === e.workoutId; })[0];
    return w && themeKeys().indexOf(w.theme) >= 0 ? w.theme : null;
  }

  function isMix(e) {
    return e.source === 'mix' || e.origin === 'mix' || /^mix-/.test(String(e.workoutId || ''));
  }

  function met(b, st) {
    switch (b.kind) {
      case 'count': return st.count >= b.n;
      case 'streak': return st.run >= b.n;
      case 'minutes': return st.sec >= b.n * 60;
      case 'before': return st.hour < b.n;
      case 'from': return st.hour >= b.n;
      case 'themes': return Object.keys(st.themes).length >= b.n;
      case 'mix': return st.mix >= b.n;
      case 'breath': return st.breath >= b.n;
      default: return false;
    }
  }

  /* { earned: { id: isoDatum }, fresh: [ids, die gegenueber data.badges neu sind] } */
  T.badgeCheck = function (data, now) {
    data = isObj(data) ? data : {};
    now = now instanceof Date && !isNaN(now.getTime()) ? now : new Date();
    var prev = isObj(data.badges) ? data.badges : {};
    var earned = {};
    Object.keys(prev).forEach(function (k) { if (typeof prev[k] === 'string') earned[k] = prev[k]; });

    var list = (Array.isArray(data.log) ? data.log : []).filter(function (e) { return T.entryValid(e); })
      .map(function (e) { return { e: e, t: new Date(e.date).getTime() }; })
      .filter(function (x) { return isFinite(x.t); })
      .sort(function (a, b) { return a.t - b.t; });
    var st = { count: 0, sec: 0, run: 0, hour: 12, themes: {}, mix: 0, breath: 0 };
    var lastDay = null;
    list.forEach(function (x) {
      var e = x.e, d = new Date(x.t);
      // Kalendertag in Ortszeit als fortlaufende Zahl, damit Monatsgrenzen und Zeitumstellung keine Rolle spielen
      var day = Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
      if (lastDay === null || day - lastDay > 1) st.run = 1;
      else if (day - lastDay === 1) st.run++;
      lastDay = day;
      st.count++;
      st.sec += T.entrySeconds(e);
      st.hour = d.getHours();
      var th = themeOf(e, data);
      if (th) st.themes[th] = true;
      if (isMix(e)) st.mix++;
      if (typeof e.breathCount === 'number' && e.breathCount > 0) st.breath += e.breathCount;
      (T.BADGES || []).forEach(function (b) {
        if (!earned[b.id] && met(b, st)) earned[b.id] = d.toISOString();
      });
    });

    // Eigenes Workout: zaehlt jedes eigene, das nicht aus dem Mix stammt; Datum = fruehestes Anlegen
    var own = (Array.isArray(data.workouts) ? data.workouts : []).filter(function (w) { return w && w.source === 'own' && w.origin !== 'mix'; });
    (T.BADGES || []).forEach(function (b) {
      if (b.kind !== 'own' || earned[b.id] || own.length < b.n) return;
      var times = own.map(function (w) { return new Date(w.createdAt).getTime(); }).filter(isFinite).sort(function (a, c) { return a - c; });
      earned[b.id] = (times.length ? new Date(times[0]) : now).toISOString();
    });

    var fresh = (T.BADGES || []).filter(function (b) { return earned[b.id] && !prev[b.id]; }).map(function (b) { return b.id; });
    return { earned: earned, fresh: fresh };
  };
})(window.Takt);
