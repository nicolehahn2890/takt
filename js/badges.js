/* Takt: Abzeichen-Regeln. Rechnet aus Protokoll, Workouts, eigenen Uebungen und Einstellungen, welche Abzeichen
   erreicht sind und wann (Zeitpunkt des Trainings, das sie erfuellt hat), und wie weit die gesperrten sind.
   Einmal erreicht bleibt erreicht. */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';

  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function themeKeys() { return T.WORKOUT_THEMES || []; }
  function dayNo(d) { return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); }

  /* Einheit fuer "4 von 10 Trainings" */
  T.BADGE_UNITS = { count: 'Trainings', minutes: 'Minuten', streak: 'Tagen', themes: 'Themen', mix: 'Mixen',
    breath: 'Atem-\u00dcbungen', templates: 'Vorlagen', ownEx: '\u00dcbungen', notes: 'Notizen' };

  /* 1000 -> "1.000" */
  T.fmtCount = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };

  /* "24. Okt. 2026" */
  T.badgeDate = function (iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.getDate() + '. ' + (T.MONTH_SHORT || [])[d.getMonth()] + ' ' + d.getFullYear();
  };

  /* Runde Plakette mit Icon; erreicht in der Farbe der Gruppe, sonst grau mit Fortschrittsring.
     prog = { have, need } (optional), opts = { tag, cls, style } */
  T.badgeHtml = function (b, on, prog, opts) {
    opts = opts || {};
    var tag = opts.tag || 'div';
    var ring = !on && prog && prog.need > 1;
    var pct = ring ? Math.round(Math.min(1, prog.have / prog.need) * 100) : 0;
    var cls = 'bdg' + (on ? ' on' : '') + (ring ? ' prog' : '') + (opts.cls ? ' ' + opts.cls : '');
    var style = '--bc:' + b.color + (ring ? ';--p:' + pct + '%' : '') + (opts.style ? ';' + opts.style : '');
    var svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      ((T.BADGE_ICONS || {})[b.icon] || '') + '</svg>';
    return '<' + tag + ' class="' + cls + '"' + (tag === 'button' ? ' data-badge="' + T.esc(b.id) + '"' : '') + ' style="' + style + '">' +
      '<i><b>' + svg + '</b></i><span>' + T.esc(b.title) + '</span>' +
      (ring ? '<em>' + T.fmtCount(Math.min(prog.have, prog.need)) + ' von ' + T.fmtCount(prog.need) + '</em>' : '') + '</' + tag + '>';
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

  /* Zaehlerstand je Regel-Art */
  function have(kind, st) {
    switch (kind) {
      case 'count': return st.count;
      case 'minutes': return Math.floor(st.sec / 60);
      case 'streak': return st.run;
      case 'themes': return Object.keys(st.themes).length;
      case 'mix': return st.mix;
      case 'breath': return st.breath;
      case 'templates': return Object.keys(st.tpl).length;
      case 'notes': return st.notes;
      default: return 0;
    }
  }

  function met(b, st) {
    if (b.kind === 'before') return st.hour < b.n;
    if (b.kind === 'from') return st.hour >= b.n;
    if (b.kind === 'own' || b.kind === 'ownEx' || b.kind === 'backup') return false;
    return have(b.kind, st) >= b.n;
  }

  /* { earned: { id: isoDatum }, fresh: [ids, die gegenueber data.badges neu sind], progress: { id: { have, need } } } */
  T.badgeCheck = function (data, now) {
    data = isObj(data) ? data : {};
    now = now instanceof Date && !isNaN(now.getTime()) ? now : new Date();
    var all = T.BADGES || [];
    var prev = isObj(data.badges) ? data.badges : {};
    var earned = {};
    Object.keys(prev).forEach(function (k) { if (typeof prev[k] === 'string') earned[k] = prev[k]; });
    var tplIds = {};
    (T.TEMPLATES || []).forEach(function (t) { if (t && t.id) tplIds[t.id] = true; });

    var list = (Array.isArray(data.log) ? data.log : []).filter(function (e) { return T.entryValid(e); })
      .map(function (e) { return { e: e, t: new Date(e.date).getTime() }; })
      .filter(function (x) { return isFinite(x.t); })
      .sort(function (a, b) { return a.t - b.t; });
    var st = { count: 0, sec: 0, run: 0, hour: 12, themes: {}, mix: 0, breath: 0, tpl: {}, notes: 0 };
    var lastDay = null;
    list.forEach(function (x) {
      var e = x.e, d = new Date(x.t);
      // Kalendertag in Ortszeit als fortlaufende Zahl, damit Monatsgrenzen und Zeitumstellung keine Rolle spielen
      var day = dayNo(d);
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
      if (tplIds[e.workoutId]) st.tpl[e.workoutId] = true;
      if (typeof e.note === 'string' && e.note.trim()) st.notes++;
      all.forEach(function (b) {
        if (!earned[b.id] && met(b, st)) earned[b.id] = d.toISOString();
      });
    });
    // Serie fuer den Fortschritt: nur, wenn heute oder gestern trainiert wurde
    if (lastDay === null || dayNo(now) - lastDay > 1) st.run = 0;

    // Eigenes Workout: zaehlt jedes eigene, das nicht aus dem Mix stammt; Datum = fruehestes Anlegen
    var own = (Array.isArray(data.workouts) ? data.workouts : []).filter(function (w) { return w && w.source === 'own' && w.origin !== 'mix'; });
    var ownEx = (Array.isArray(data.exercisesOwn) ? data.exercisesOwn : []).filter(isObj);
    var settings = isObj(data.settings) ? data.settings : {};
    var lastBackup = settings.lastBackup ? new Date(settings.lastBackup) : null;
    var hasBackup = !!lastBackup && !isNaN(lastBackup.getTime());
    var other = { own: own.length, ownEx: ownEx.length, backup: hasBackup ? 1 : 0 };
    all.forEach(function (b) {
      if (earned[b.id] || !(b.kind in other) || other[b.kind] < b.n) return;
      if (b.kind === 'own') {
        var times = own.map(function (w) { return new Date(w.createdAt).getTime(); }).filter(isFinite).sort(function (a, c) { return a - c; });
        earned[b.id] = (times.length ? new Date(times[0]) : now).toISOString();
      } else if (b.kind === 'backup') earned[b.id] = lastBackup.toISOString();
      else earned[b.id] = now.toISOString();
    });

    var progress = {};
    all.forEach(function (b) {
      var clock = b.kind === 'before' || b.kind === 'from';   // n ist hier die Uhrzeit, Ziel ist 1 Training
      var need = clock ? 1 : b.n;
      var h = b.kind in other ? other[b.kind] : clock ? (earned[b.id] ? 1 : 0) : have(b.kind, st);
      progress[b.id] = { have: Math.min(h, need), need: need };
    });
    var fresh = all.filter(function (b) { return earned[b.id] && !prev[b.id]; }).map(function (b) { return b.id; });
    return { earned: earned, fresh: fresh, progress: progress };
  };
})(window.Takt);
