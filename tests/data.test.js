var D_TAGS = ['vacuum', 'atmung', 'core', 'bauch', 'ruecken', 'beine-po', 'dehnen', 'yoga', 'ganzkoerper', 'oberkoerper', 'aufwaermen'];
var D_HILF = ['band', 'stuhl', 'tisch', 'sofa', 'wand', 'matte', 'stab'];
var D_ICONS = ['core', 'dehnen', 'beine', 'ganz'];
function dSubset(arr, allowed) { return Array.isArray(arr) && arr.every(function (x) { return allowed.indexOf(x) >= 0; }); }

test('data: genau 152 Uebungen mit eindeutigen Ids', function () {
  var ids = Takt.EXERCISES.map(function (e) { return e.id; });
  eq(ids.length, 152);
  var dup = ids.filter(function (id, i) { return ids.indexOf(id) !== i; });
  eq(dup, []);
  var bad = ids.filter(function (id) { return !/^[a-z0-9-]+$/.test(id); });
  eq(bad, []);
});

test('data: Ids des Test-Workouts bleiben', function () {
  var ids = Takt.EXERCISES.map(function (e) { return e.id; });
  ['hampelmann', 'plank', 'glute-bridge', 'dead-bug', 'kindhaltung'].forEach(function (id) { ok(ids.indexOf(id) >= 0, id + ' fehlt'); });
});

test('data: Pflichtfelder und erlaubte Werte', function () {
  var errors = [];
  Takt.EXERCISES.forEach(function (e) {
    function bad(msg) { errors.push(e.id + ': ' + msg); }
    if (typeof e.name !== 'string' || e.name.length < 2 || e.name.length > 60) bad('name');
    if (!Array.isArray(e.alias)) bad('alias');
    if (typeof e.beschreibung !== 'string' || e.beschreibung.length < 40 || e.beschreibung.length > 320) bad('beschreibung ' + (e.beschreibung || '').length);
    if (typeof e.hinweis !== 'string' || e.hinweis.length < 5) bad('hinweis');
    if (!Array.isArray(e.tags) || !e.tags.length || !dSubset(e.tags, D_TAGS)) bad('tags');
    if (!dSubset(e.hilfsmittel, D_HILF)) bad('hilfsmittel');
    if (typeof e.beidseitig !== 'boolean') bad('beidseitig');
    if (e.typ !== 'zeit' && e.typ !== 'atem') bad('typ');
    if (e.bild !== null) bad('bild');
    if (D_ICONS.indexOf(e.icon) < 0) bad('icon');
    if (e.quelle !== 'takt') bad('quelle');
  });
  eq(errors, []);
});

test('data: Atem-Uebungen haben einen Rhythmus, Zeit-Uebungen nicht', function () {
  var errors = [];
  Takt.EXERCISES.forEach(function (e) {
    if (e.typ === 'atem') {
      var a = e.atem || {};
      if (![a.ein, a.halten, a.aus, a.haltenLeer].every(function (v) { return typeof v === 'number' && v >= 0; }) || a.ein + a.aus <= 0) errors.push(e.id);
    } else if (e.atem !== null) errors.push(e.id + ' (zeit mit atem)');
  });
  eq(errors, []);
});

test('data: Haltungen fuer jede Zeit-Uebung, keine fuer Atem-Uebungen', function () {
  var errors = [];
  Takt.EXERCISES.forEach(function (e) {
    var p = Takt.POSES[e.id];
    if (e.typ === 'zeit' && !(p && p.frames && p.frames.length)) errors.push(e.id + ' ohne Haltung');
    if (e.typ === 'atem' && p) errors.push(e.id + ' mit Haltung');
  });
  Object.keys(Takt.POSES).forEach(function (id) {
    if (!Takt.EXERCISES.some(function (e) { return e.id === id; })) errors.push(id + ' ohne Uebung');
  });
  eq(errors, []);
});

test('data: jede Haltung bleibt im Bild und ueber dem Boden', function () {
  var errors = [];
  Object.keys(Takt.POSES).forEach(function (id) {
    var p = Takt.POSES[id], n = p.frames.length;
    var hold = p.hold != null ? p.hold : 0.6, move = p.move != null ? p.move : 0.9, seg = hold + move;
    // ganzer Zyklus im 50-ms-Raster, damit auch Zwischenstellungen geprueft werden
    var times = [], cycle = n > 1 ? seg * n * 1000 : 4000;
    for (var t0 = 0; t0 <= cycle; t0 += 50) times.push(t0);
    times.forEach(function (t) {
      var f = Takt.figure.frameAt(p, t);
      var b = Takt.figure.bounds(f, p.scale || Takt.figure.DEFAULT_SCALE);
      var s = Takt.figure.svg(f, p.scale || Takt.figure.DEFAULT_SCALE, p.props);
      if (s.indexOf('NaN') >= 0) errors.push(id + ' NaN bei ' + t);
      if (b.minX < 12 || b.maxX > 228 || b.minY < 18 || b.maxY > 170) {
        errors.push(id + ' bei ' + Math.round(t) + ' ms: x ' + Math.round(b.minX) + '..' + Math.round(b.maxX) + ', y ' + Math.round(b.minY) + '..' + Math.round(b.maxY));
      }
    });
  });
  eq(errors, []);
});

test('data: jede Zeit-Uebung hat eine Ausgangsposition, Atem-Uebungen keine', function () {
  eq(Takt.POSITIONS, ['stehen', 'stuetz', 'knien', 'bauchlage', 'sitzen', 'seitenlage', 'rueckenlage']);
  var bad = Takt.EXERCISES.filter(function (e) {
    return e.typ === 'zeit' ? Takt.POSITIONS.indexOf(e.position) < 0 : e.position !== undefined;
  }).map(function (e) { return e.id; });
  eq(bad, []);
  var pos = {};
  Takt.EXERCISES.forEach(function (e) { pos[e.id] = e.position; });
  eq([pos.kniebeuge, pos.plank, pos['katze-kuh'], pos.superman, pos.schmetterling, pos.clamshells, pos['glute-bridge']],
    Takt.POSITIONS);
});

test('data: Kraft-Uebungen haben ein Bewegungsmuster, Dehnungen und Yoga-Haltungen einen Schwerpunkt', function () {
  var kraft = ['core', 'vacuum', 'bauch', 'beine-po', 'ruecken', 'ganzkoerper', 'oberkoerper'];
  function has(e, tags) { return e.tags.some(function (t) { return tags.indexOf(t) >= 0; }); }
  var bad = [];
  Takt.EXERCISES.forEach(function (e) {
    if (e.typ !== 'zeit') { if (e.muster || e.fokus) bad.push(e.id + ': Atem-Uebung mit Muster'); return; }
    if (has(e, kraft) && !e.muster && !e.fokus) bad.push(e.id + ': ohne Muster');
    if (e.muster && !has(e, kraft)) bad.push(e.id + ': Muster ohne Kraft-Thema');
    var flow = (has(e, ['dehnen']) && !has(e, ['aufwaermen', 'vacuum', 'ganzkoerper'])) || (has(e, ['yoga']) && !has(e, ['aufwaermen', 'atmung']));
    if (flow && !e.fokus) bad.push(e.id + ': ohne Schwerpunkt');
  });
  eq(bad, []);
  var ex = {};
  Takt.EXERCISES.forEach(function (e) { ex[e.id] = e; });
  eq([ex.kniebeuge.muster, ex['glute-bridge'].muster, ex.clamshells.muster, ex.crunch.muster, ex['bird-dog'].muster],
    ['kniebeuge', 'huefte-strecken', 'abspreizen', 'beugen', 'gegengleich']);
  eq([ex['katze-kuh'].muster, ex['katze-kuh'].fokus, ex.taube.fokus, ex.stuhl.muster, ex.stuhl.fokus],
    [undefined, 'wirbelsaeule', 'huefte', 'kniebeuge', 'stand']);
});

test('data: Tag yoga hat 24 Uebungen (19 und 5 mit Stab)', function () {
  eq(Takt.EXERCISES.filter(function (e) { return e.tags.indexOf('yoga') >= 0; }).length, 24);
});

test('data: Besenstiel-Uebungen zeigen den Stab, und er bleibt im Bild', function () {
  var errors = [], stab = Takt.EXERCISES.filter(function (e) { return e.hilfsmittel.indexOf('stab') >= 0; }).map(function (e) { return e.id; });
  eq(stab, ['stab-durchzug', 'stab-schulter', 'stab-brust', 'stab-kindhaltung', 'stab-ueberkopf']);
  Object.keys(Takt.POSES).forEach(function (id) {
    var p = Takt.POSES[id], has = (p.props || []).some(function (x) { return x.type === 'stab'; });
    if (has !== (stab.indexOf(id) >= 0)) errors.push(id + (has ? ': Stab ohne Hilfsmittel' : ': Hilfsmittel ohne Stab'));
    if (!has) return;
    var s = p.scale || Takt.figure.DEFAULT_SCALE, seg = (p.hold != null ? p.hold : 0.6) + (p.move != null ? p.move : 0.9);
    for (var t = 0; t <= seg * p.frames.length * 1000; t += 50) {
      var m = /data-prop="stab" x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"/.exec(Takt.figure.svg(Takt.figure.frameAt(p, t), s, p.props, t));
      [[m[1], m[2]], [m[3], m[4]]].forEach(function (q) {
        var x = 120 + (Number(q[0]) - 120) * s, y = 166 + (Number(q[1]) - 166) * s;
        if (x < 12 || x > 228 || y < 18 || y > 170) errors.push(id + ' bei ' + t + ' ms: ' + Math.round(x) + '/' + Math.round(y));
      });
    }
  });
  eq(errors, []);
});

test('data: jede Uebung hat eine Katja-Ansage', function () {
  var missing = Takt.EXERCISES.filter(function (e) { return !(Takt.VOICE_FILES || {})['ex_' + e.id]; }).map(function (e) { return e.id; });
  eq(missing.length, 0, 'fehlend: ' + missing.slice(0, 5).join(', '));
});

test('data: Vacuum mit Fersentippen ersetzt Bauchnabel nach innen', function () {
  var ids = Takt.EXERCISES.map(function (e) { return e.id; });
  ok(ids.indexOf('transversus') < 0, 'transversus noch da');
  var e = Takt.EXERCISES.filter(function (x) { return x.id === 'vacuum-fersentippen'; })[0];
  ok(e && e.tags.indexOf('vacuum') >= 0, 'neue Uebung fehlt');
  eq(Takt.POSES['vacuum-fersentippen'].frames.length > 1, true);
});

test('data: Vacuum mit Beinstrecken und Vacuum mit Dead Bug (Nicole, 2026-10-27)', function () {
  var ex = {};
  Takt.EXERCISES.forEach(function (e) { ex[e.id] = e; });
  ['vacuum-beinstrecken', 'vacuum-dead-bug'].forEach(function (id) {
    var e = ex[id];
    ok(e, id + ' fehlt');
    eq([e.tags, e.hilfsmittel, e.beidseitig, e.position, e.muster], [['vacuum', 'core'], ['matte'], false, 'rueckenlage', 'vakuum-bewegt'], id);
    ok(Takt.POSES[id].frames.length >= 4, id + ': nicht beide Seiten');
  });
  eq([ex['vacuum-beinstrecken'].name, ex['vacuum-beinstrecken'].ansage], ['Vacuum mit Beinstrecken', 'Vakuum mit Beinstrecken']);
  eq([ex['vacuum-dead-bug'].name, ex['vacuum-dead-bug'].ansage], ['Vacuum mit Dead Bug', 'Vakuum mit Dead Bug']);
  // Beinstrecken: Arme bleiben neben dem Koerper; Dead Bug: ein Arm geht nach hinten ueber den Kopf. Bei beiden wird ein Bein lang.
  function reach(id) {
    var p = Takt.POSES[id], r = { hand: 999, foot: 0 }, cycle = ((p.hold || 0) + (p.move || 0)) * p.frames.length * 1000;
    for (var t = 0; t <= cycle; t += 50) {
      var f = Takt.figure.frameAt(p, t);
      r.hand = Math.min(r.hand, f.handN[0], f.handF[0]);
      r.foot = Math.max(r.foot, f.footN[0], f.footF[0]);
    }
    return r;
  }
  var b = reach('vacuum-beinstrecken'), d = reach('vacuum-dead-bug');
  ok(b.hand > 100 && b.foot >= 185, 'Beinstrecken: ' + JSON.stringify(b));
  ok(d.hand < 40 && d.foot >= 185, 'Dead Bug: ' + JSON.stringify(d));
});

test('data: jede Vacuum-Uebung zeigt einen Pfeil zum Bauch', function () {
  var missing = Takt.EXERCISES.filter(function (e) { return e.tags.indexOf('vacuum') >= 0 && e.typ === 'zeit'; })
    .filter(function (e) { return !((Takt.POSES[e.id] || {}).props || []).some(function (p) { return p.type === 'pfeil'; }); })
    .map(function (e) { return e.id; });
  eq(missing, []);
});

test('data: die 35 neuen Uebungen vom 2026-10-23 sind da', function () {
  var neu = ['vacuum-vorgebeugt', 'vacuum-kniend', 'vacuum-schneidersitz', 'vacuum-kindhaltung', 'vacuum-unterarmstuetz', 'vacuum-baerenstand',
    'vacuum-glute-bridge', 'vacuum-beckenkippen', 'vacuum-marschieren', 'vacuum-arme-oben', 'vacuum-gehen', 'hypopressive-atmung',
    'plank-knie', 'plank-beinheben', 'reverse-plank', 'knee-tucks', 'tabletop-crunch', 'seitstuetz-knie',
    'glute-bridge-marsch', 'standwaage', 'abduktion-stehend', 'kickback-stehend', 'innenschenkel', 'squat-pulses',
    'knie-zur-brust', 'vorbeuge-stehend', 'waden-dehnung', 'schulter-dehnung', 'brust-dehnung', 'faden-einfaedeln',
    'krieger-3', 'boot', 'sphinx', 'schattenboxen', 'seilspringen'];
  var ids = Takt.EXERCISES.map(function (e) { return e.id; });
  eq(neu.filter(function (id) { return ids.indexOf(id) < 0; }), []);
  eq(Takt.EXERCISES.filter(function (e) { return e.id === 'hypopressive-atmung'; })[0].typ, 'atem');
});

test('data: Eisschnelllaeufer ist entfernt und Krieger heissen ohne Zahlen', function () {
  eq(Takt.EXERCISES.filter(function (e) { return e.id === 'skater'; }).length, 0);
  eq(Takt.POSES.skater, undefined);
  eq(Takt.EXERCISES.filter(function (e) { return /I{1,3}$/.test(e.name); }).map(function (e) { return e.name; }), []);
});

/* ---------- Vorlagen ---------- */
var D_THEMES = ['core', 'bauch', 'dehnen', 'yoga', 'beine', 'ruecken'];

test('data: 12 Vorlagen', function () {
  var ids = Takt.TEMPLATES.map(function (w) { return w.id; });
  eq(ids.length, 12);
  eq(ids.filter(function (id, i) { return ids.indexOf(id) !== i; }), []);
  ok(ids.indexOf('test-core') < 0, 'Test-Workout noch da');
  var idx = Takt.indexExercises(Takt.EXERCISES);
  Takt.TEMPLATES.forEach(function (w) {
    ok(D_THEMES.indexOf(w.theme) >= 0, w.id + ' Thema ' + w.theme);
    ok(w.level === 'kurz' || w.level === 'lang', w.id + ' level');
    eq(w.source, 'template', w.id);
    w.blocks.forEach(function (b) {
      ok(b.items.length > 0, w.id + ' leerer Block');
      b.items.forEach(function (i) { ok(idx[i.exId], w.id + ': unbekannte Uebung ' + i.exId); });
    });
    var v = Takt.validateWorkout(w);
    ok(v.ok, w.id + ' ungueltig: ' + JSON.stringify(v.errors));
  });
  D_THEMES.forEach(function (th) {
    eq(Takt.TEMPLATES.filter(function (w) { return w.theme === th; }).map(function (w) { return w.level; }).sort(), ['kurz', 'lang'], th);
  });
});

test('data: Vorlagen-Dauer', function () {
  var idx = Takt.indexExercises(Takt.EXERCISES);
  Takt.TEMPLATES.forEach(function (w) {
    var min = Takt.workoutSeconds(w, idx) / 60;
    var range = w.level === 'kurz' ? [8, 12] : [17, 23];
    ok(min >= range[0] && min <= range[1], w.id + ': ' + min.toFixed(1) + ' Min.');
  });
});

test('data: Vorlage beidseitig passt zur Bibliothek', function () {
  var idx = Takt.indexExercises(Takt.EXERCISES);
  Takt.TEMPLATES.forEach(function (w) {
    w.blocks.forEach(function (b) { b.items.forEach(function (i) { eq(i.bilateral, !!idx[i.exId].beidseitig, w.id + ' ' + i.exId); }); });
  });
});

test('data: Vorlagen vom Stehen zum Liegen, kein Aufstehen mitten im Block', function () {
  var idx = Takt.indexExercises(Takt.EXERCISES), bad = [];
  Takt.TEMPLATES.forEach(function (w) {
    w.blocks.forEach(function (b) {
      if (b.label === 'Aufwärmen' || b.label === 'Ankommen') return;
      var items = b.items.filter(function (i) { return idx[i.exId].position; });   // Atem-Uebungen haben keine Position
      var r = items.map(function (i) { return Takt.POSITIONS.indexOf(idx[i.exId].position); });
      var strict = b.label === 'Hauptteil' || b.label === 'Haltungen';
      r.forEach(function (x, i) {
        if (i && (strict ? x < r[i - 1] : x === 0 && r[i - 1] > 0)) bad.push(w.id + ' ' + (b.label || 'Block') + ': ' + items[i].exId);
      });
    });
  });
  eq(bad, []);
});

test('data: Katja sagt immer Vakuum, nie Vacuum', function () {
  eq(Takt.EXERCISES.filter(function (e) { return /vacuum/i.test(e.ansage || e.name); }).map(function (e) { return e.id; }), []);
  eq(Takt.EXERCISES.filter(function (e) { return e.id === 'vacuum-fersentippen'; })[0].ansage, 'Vakuum mit Fersentippen');
});

test('data: Stomach-Uebungen spricht Katja als Bauch-Vakuum', function () {
  var st = Takt.EXERCISES.filter(function (e) { return /^Stomach Vacuum/.test(e.name); });
  eq(st.length, 15);
  st.forEach(function (e) { eq(e.ansage, e.name.replace('Stomach Vacuum', 'Bauch-Vakuum'), e.id); });
  eq(Takt.EXERCISES.filter(function (e) { return e.id === 'plank'; })[0].ansage, undefined);
});

test('data: Aufwaermen der Vorlagen wie im Mix (Puls, dann Gelenke, 5 s Wechsel, nicht tiefer als der Hauptteil)', function () {
  var idx = Takt.indexExercises(Takt.EXERCISES), bad = [];
  var PULS = ['laufen-stelle', 'hampelmann', 'kniehebelauf', 'seilspringen', 'schattenboxen'];
  var rank = function (id) { return Takt.POSITIONS.indexOf(idx[id].position); };
  var warmed = 0;
  Takt.TEMPLATES.forEach(function (w) {
    var warm = w.blocks.filter(function (b) { return b.label === 'Aufwärmen'; })[0];
    if (!warm) return;
    warmed++;
    var main = w.blocks.filter(function (b) { return b.label === 'Hauptteil'; })[0];
    var ids = warm.items.map(function (i) { return i.exId; });
    var puls = ids.map(function (id) { return PULS.indexOf(id) >= 0; });
    if (!puls[0]) bad.push(w.id + ': beginnt nicht mit Puls');
    if (puls[puls.length - 1]) bad.push(w.id + ': endet nicht mit Gelenken');
    if (puls.some(function (p, i) { return p && i > 0 && !puls[i - 1]; })) bad.push(w.id + ': Puls nach Gelenken');
    warm.items.forEach(function (i, k) {
      if (i.rest !== (k < warm.items.length - 1 ? 5 : null)) bad.push(w.id + ': Pause nach ' + i.exId);
      if (!idx[i.exId].tags.some(function (t) { return t === 'aufwaermen' || t === 'dehnen' || t === 'ganzkoerper'; })) bad.push(w.id + ': ' + i.exId + ' keine Aufwaerm-Uebung');
    });
    if (rank(ids[ids.length - 1]) > rank(main.items[0].exId)) bad.push(w.id + ': Aufwaermen endet tiefer als der Hauptteil beginnt');
    main.items.forEach(function (i) { if (ids.indexOf(i.exId) >= 0) bad.push(w.id + ': ' + i.exId + ' doppelt'); });
  });
  eq(bad, []);
  eq(warmed, 6);
  // Vacuum & Core: kein Aufwaermen, 60 s Bauchatmung zum Ankommen, dann direkt der Hauptteil
  Takt.TEMPLATES.filter(function (w) { return w.id.indexOf('vacuum-core') === 0; }).forEach(function (w) {
    eq([w.blocks[0].label, w.blocks[0].items.map(function (i) { return i.exId + ' ' + i.duration; }), w.blocks[1].label],
      ['Ankommen', ['bauchatmung 60'], 'Hauptteil'], w.id);
  });
});
